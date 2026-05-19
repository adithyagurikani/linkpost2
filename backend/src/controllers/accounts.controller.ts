import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db";
import { env } from "../config/env";
import {
  getOAuthUrl,
  exchangeCode,
  getUserInfo,
} from "../services/linkedin.service";
import { writeAuditLog } from "../services/audit.service";
import { AuthRequest, paramId } from "../types";

export async function listAccounts(req: AuthRequest, res: Response) {
  const db = await getDb();
  const accounts = await db
    .collection("accounts")
    .find(
      { userId: req.user!.id },
      {
        sort: { createdAt: -1 },
        projection: {
          accessToken: 0,
          refreshToken: 0,
          refreshTokenExpiresAt: 0,
        },
      }
    )
    .toArray();

  const serialized = accounts.map((a) => ({
    ...a,
    id: a._id.toString(),
    _id: undefined,
    createdAt: a.createdAt?.toISOString?.() || a.createdAt,
    updatedAt: a.updatedAt?.toISOString?.() || a.updatedAt,
    tokenExpiresAt: a.tokenExpiresAt?.toISOString?.() || a.tokenExpiresAt,
  }));

  res.json(serialized);
}

export async function connect(req: AuthRequest, res: Response) {
  const state = randomUUID();
  const db = await getDb();

  // Store OAuth state in DB with TTL
  await db.collection("oauthStates").insertOne({
    state,
    userId: req.user!.id,
    createdAt: new Date(),
  });

  const authUrl = getOAuthUrl(state);
  res.json({ authUrl });
}

export async function callback(req: Request, res: Response) {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.redirect(
      `${env.FRONTEND_URL}/accounts?error=missing_params`
    );
  }

  const db = await getDb();
  const stateDoc = await db
    .collection("oauthStates")
    .findOneAndDelete({ state: state as string });

  if (!stateDoc) {
    return res.redirect(
      `${env.FRONTEND_URL}/accounts?error=invalid_state`
    );
  }

  const userId = stateDoc.userId;

  try {
    const tokenData = await exchangeCode(code as string);
    const userInfo = await getUserInfo(tokenData.access_token);

    const existing = await db
      .collection("accounts")
      .findOne({ linkedinUserId: userInfo.sub });
    const now = new Date();

    if (existing) {
      await db.collection("accounts").updateOne(
        { _id: existing._id },
        {
          $set: {
            accessToken: tokenData.access_token,
            tokenExpiresAt: new Date(
              Date.now() + tokenData.expires_in * 1000
            ),
            refreshToken: tokenData.refresh_token || existing.refreshToken,
            refreshTokenExpiresAt: tokenData.refresh_token_expires_in
              ? new Date(
                  Date.now() + tokenData.refresh_token_expires_in * 1000
                )
              : existing.refreshTokenExpiresAt,
            name: userInfo.name,
            avatarUrl: userInfo.picture || existing.avatarUrl,
            userId,
            isActive: true,
            updatedAt: now,
          },
        }
      );
    } else {
      await db.collection("accounts").insertOne({
        linkedinUserId: userInfo.sub,
        name: userInfo.name,
        avatarUrl: userInfo.picture || null,
        accessToken: tokenData.access_token,
        tokenExpiresAt: new Date(
          Date.now() + tokenData.expires_in * 1000
        ),
        refreshToken: tokenData.refresh_token || null,
        refreshTokenExpiresAt: tokenData.refresh_token_expires_in
          ? new Date(
              Date.now() + tokenData.refresh_token_expires_in * 1000
            )
          : null,
        isActive: true,
        userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    writeAuditLog({
      action: "account.connected",
      entityType: "account",
      metadata: { linkedinUserId: userInfo.sub, name: userInfo.name },
      userId,
    });

    res.redirect(`${env.FRONTEND_URL}/accounts?connected=1`);
  } catch (err: any) {
    console.error("LinkedIn OAuth callback error:", err);
    writeAuditLog({
      action: "account.connect_failed",
      entityType: "account",
      error: err.message,
      userId,
    });
    res.redirect(`${env.FRONTEND_URL}/accounts?error=oauth_failed`);
  }
}

export async function toggle(req: AuthRequest, res: Response) {
  const db = await getDb();
  const oid = new ObjectId(paramId(req));
  const account = await db
    .collection("accounts")
    .findOne({ _id: oid, userId: req.user!.id });

  if (!account) return res.status(404).json({ error: "Account not found" });

  const newActive = !account.isActive;
  await db
    .collection("accounts")
    .updateOne({ _id: oid, userId: req.user!.id }, { $set: { isActive: newActive } });

  writeAuditLog({
    action: newActive ? "account.activated" : "account.deactivated",
    entityType: "account",
    entityId: paramId(req),
    userId: req.user!.id,
  });

  res.json({ ok: true, isActive: newActive });
}

export async function disconnect(req: AuthRequest, res: Response) {
  const db = await getDb();
  const oid = new ObjectId(paramId(req));

  const account = await db
    .collection("accounts")
    .findOne({ _id: oid, userId: req.user!.id });
  if (!account) return res.status(404).json({ error: "Account not found" });

  // Clear credentials but keep the record for audit trail
  await db.collection("accounts").updateOne(
    { _id: oid, userId: req.user!.id },
    {
      $set: {
        accessToken: "",
        refreshToken: "",
        isActive: false,
        updatedAt: new Date(),
      },
    }
  );

  // Fail any scheduled posts for this account
  await db.collection("posts").updateMany(
    {
      accountId: paramId(req),
      userId: req.user!.id,
      status: { $in: ["scheduled", "queued"] },
    },
    {
      $set: {
        status: "failed",
        errorMessage: "Account disconnected",
        updatedAt: new Date(),
      },
    }
  );

  writeAuditLog({
    action: "account.disconnected",
    entityType: "account",
    entityId: paramId(req),
    userId: req.user!.id,
  });

  res.json({ ok: true });
}
