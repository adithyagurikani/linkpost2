import { env } from "../config/env";
import { Db } from "mongodb";
import { LinkedInTokenResponse, LinkedInUserInfo } from "../types";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_API_BASE = "https://api.linkedin.com";
const SCOPES = "openid profile email w_member_social_feed";

export const LINKEDIN_MAX_CHARS = 3000;

export function getOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.LINKEDIN_CLIENT_ID,
    redirect_uri: `${env.BASE_URL}/api/v1/accounts/callback`,
    scope: SCOPES,
    state,
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(
  code: string
): Promise<LinkedInTokenResponse> {
  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: env.LINKEDIN_CLIENT_ID,
      client_secret: env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: `${env.BASE_URL}/api/v1/accounts/callback`,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn token exchange failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<LinkedInTokenResponse>;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<LinkedInTokenResponse> {
  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: env.LINKEDIN_CLIENT_ID,
      client_secret: env.LINKEDIN_CLIENT_SECRET,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn token refresh failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<LinkedInTokenResponse>;
}

export async function ensureValidToken(
  account: Record<string, any>,
  db: Db
): Promise<string> {
  if (
    !account.tokenExpiresAt ||
    new Date(account.tokenExpiresAt) > new Date(Date.now() + 5 * 60 * 1000)
  ) {
    return account.accessToken;
  }

  if (!account.refreshToken) {
    throw new Error(
      "Token expired and no refresh token available. Reconnect the account."
    );
  }

  const token = await refreshAccessToken(account.refreshToken);
  const updatePayload: Record<string, unknown> = {
    accessToken: token.access_token,
    tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
    updatedAt: new Date(),
  };
  if (token.refresh_token) {
    updatePayload.refreshToken = token.refresh_token;
  }
  if (token.refresh_token_expires_in) {
    updatePayload.refreshTokenExpiresAt = new Date(
      Date.now() + token.refresh_token_expires_in * 1000
    );
  }

  await db
    .collection("accounts")
    .updateOne({ _id: account._id }, { $set: updatePayload });

  return token.access_token;
}

export async function getUserInfo(
  accessToken: string
): Promise<LinkedInUserInfo> {
  const res = await fetch(`${LINKEDIN_API_BASE}/v2/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn userinfo failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<LinkedInUserInfo>;
}

export async function executePost(
  content: string,
  linkedinUserId: string,
  accessToken: string
): Promise<{
  statusCode: number;
  data: Record<string, unknown>;
  linkedinPostId?: string;
  shareUrl?: string;
}> {
  if (content.length > LINKEDIN_MAX_CHARS) {
    return {
      statusCode: 413,
      data: {
        error: `Content exceeds LinkedIn's ${LINKEDIN_MAX_CHARS} character limit (${content.length} chars). Shorten your post and try again.`,
      },
    };
  }

  const body = {
    author: `urn:li:person:${linkedinUserId}`,
    commentary: content,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "LinkedIn-Version": "202604",
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = res.ok ? {} : await res.text();
  const urn = res.headers.get("x-restli-id") || undefined;

  let parsed: Record<string, unknown> = {};
  if (typeof data === "string" && data) {
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = { raw: data };
    }
  }

  return {
    statusCode: res.status,
    data: parsed,
    linkedinPostId: urn,
    shareUrl: urn
      ? `https://www.linkedin.com/feed/update/${urn}/`
      : undefined,
  };
}
