import { getDb } from "../config/db";
import { ensureValidToken } from "./linkedin.service";
import { ObjectId } from "mongodb";
import { writeAuditLog } from "./audit.service";

type SocialData = {
  likes: number;
  comments: number;
};

function sumReactions(
  reactionSummaries: Record<string, { count: number }> | undefined
): number {
  if (!reactionSummaries) return 0;
  return Object.values(reactionSummaries).reduce(
    (sum, r) => sum + r.count,
    0
  );
}

async function fetchViaSocialMetadata(
  postUrn: string,
  accessToken: string
): Promise<SocialData | null> {
  const url = `https://api.linkedin.com/rest/socialMetadata/${encodeURIComponent(postUrn)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "LinkedIn-Version": "202604",
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `socialMetadata API ${res.status} for ${postUrn}: ${body.slice(0, 500)}`
    );
    return null;
  }

  const data = await res.json() as any;
  return {
    likes: sumReactions(data.reactionSummaries),
    comments: data.commentSummary?.count ?? 0,
  };
}

async function fetchViaSocialActions(
  postUrn: string,
  accessToken: string
): Promise<SocialData | null> {
  const url = `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(postUrn)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "LinkedIn-Version": "202604",
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `socialActions API ${res.status} for ${postUrn}: ${body.slice(0, 500)}`
    );
    return null;
  }

  const data = await res.json() as any;
  return {
    likes: data.likesSummary?.totalLikes ?? 0,
    comments: data.commentsSummary?.totalComments ?? 0,
  };
}

export async function fetchSocialMetrics(
  postUrn: string,
  accessToken: string
): Promise<SocialData | null> {
  const fromMeta = await fetchViaSocialMetadata(postUrn, accessToken);
  if (fromMeta) return fromMeta;

  const fromActions = await fetchViaSocialActions(postUrn, accessToken);
  if (fromActions) return fromActions;

  console.error(`All analytics endpoints failed for ${postUrn}`);
  return null;
}

export async function runAnalyticsCycle(limit = 10, userId?: string) {
  const db = await getDb();

  const filter: Record<string, unknown> = {
    status: "posted",
    linkedinPostId: { $ne: null },
    accountId: { $ne: null },
  };
  if (userId) filter.userId = userId;

  const maxLimit = Math.min(limit, 100);
  const publishedPosts = await db
    .collection("posts")
    .find(filter, { sort: { analyticsLastSync: 1 }, limit: maxLimit })
    .toArray();

  const accountIds = [
    ...new Set(
      publishedPosts
        .filter((p) => p.accountId)
        .map((p) =>
          typeof p.accountId === "string"
            ? new ObjectId(p.accountId)
            : p.accountId
        )
    ),
  ];
  const accounts =
    accountIds.length > 0
      ? await db
          .collection("accounts")
          .find({ _id: { $in: accountIds } })
          .toArray()
      : [];
  const accountMap = new Map(accounts.map((a) => [a._id.toString(), a]));

  let syncedCount = 0;
  for (const post of publishedPosts) {
    if (!post.linkedinPostId || !post.accountId) continue;

    const account = accountMap.get(post.accountId.toString());
    if (!account || !account.accessToken) continue;

    let accessToken: string;
    try {
      accessToken = await ensureValidToken(account, db);
    } catch {
      continue;
    }

    const stats = await fetchSocialMetrics(post.linkedinPostId, accessToken);

    if (stats) {
      await db.collection("posts").updateOne(
        { _id: post._id },
        {
          $set: {
            likes: stats.likes,
            comments: stats.comments,
            analyticsLastSync: new Date(),
            updatedAt: new Date(),
          },
        }
      );
      syncedCount++;
    }
  }

  if (syncedCount > 0) {
    writeAuditLog({
      action: "cron.analytics_synced",
      entityType: "cron",
      metadata: { synced: syncedCount, limit: maxLimit },
    });
  }
  return syncedCount;
}

export async function getAnalyticsData(userId: string) {
  const db = await getDb();

  const rawPosts = await db
    .collection("posts")
    .find(
      { userId, status: "posted" },
      {
        sort: { postedAt: -1 },
        projection: {
          content: 1,
          likes: 1,
          comments: 1,
          postedAt: 1,
        },
        limit: 500,
      }
    )
    .toArray();

  const stats = rawPosts.map((p) => ({
    id: p._id.toString(),
    content:
      p.content.length > 60 ? p.content.substring(0, 60) + "..." : p.content,
    likes: p.likes || 0,
    comments: p.comments || 0,
    postedAt: p.postedAt
      ? new Date(p.postedAt).toISOString()
      : new Date().toISOString(),
  }));

  const totalLikes = stats.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = stats.reduce((sum, p) => sum + p.comments, 0);
  const hasAnalytics = stats.some((p) => p.likes > 0 || p.comments > 0);
  const aggregates = { totalLikes, totalComments, totalPosts: stats.length, hasAnalytics };

  const chartData = [...stats]
    .reverse()
    .slice(-15)
    .map((p) => ({
      name: p.postedAt.substring(5, 10),
      likes: p.likes,
      comments: p.comments,
      fullDate: new Date(p.postedAt).toLocaleDateString(),
    }));

  return { stats, aggregates, chartData };
}
