import { Response } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db";
import { writeAuditLog } from "../services/audit.service";
import { publishPost } from "../services/publish.service";
import {
  validate,
  PostCreateSchema,
  PostUpdateSchema,
  PostQuerySchema,
  BulkScheduleSchema,
  ScheduleDraftsSchema,
  RescheduleSchema,
} from "../lib/validation";
import { localToUtc, getDateInTz } from "../lib/schedule-utils";
import { AuthRequest, paramId } from "../types";

export async function create(req: AuthRequest, res: Response) {
  const { data, error } = validate(PostCreateSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  const userId = req.user!.id;
  const db = await getDb();
  const now = new Date();

  // Validate accountIds belong to this user
  const rawAccountIds = data.accountIds?.length
    ? data.accountIds
    : data.accountId
      ? [data.accountId]
      : [];

  if (rawAccountIds.length > 0) {
    const ownedAccounts = await db.collection("accounts").countDocuments({
      _id: { $in: rawAccountIds.map((id) => new ObjectId(id)) },
      userId,
    });
    if (ownedAccounts !== rawAccountIds.length) {
      return res.status(400).json({ error: "One or more accounts do not belong to you" });
    }
  }

  const accountIds = rawAccountIds.length ? rawAccountIds : [null];

  const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
  const status = scheduledAt ? "scheduled" : "draft";

  const docs = accountIds.map((aid) => ({
    content: data.content,
    status,
    scheduledAt,
    postedAt: null,
    accountId: aid,
    source: "manual",
    likes: 0,
    comments: 0,
    userId,
    createdAt: now,
    updatedAt: now,
  }));

  try {
    const result = await db.collection("posts").insertMany(docs);
    writeAuditLog({
      action: "post.created",
      entityType: "post",
      metadata: { count: result.insertedCount, accountIds },
      userId,
    });
    const ids = Object.values(result.insertedIds).map((id) => id.toString());
    res.status(201).json({
      ok: true,
      insertedCount: result.insertedCount,
      ids,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create post" });
  }
}

export async function list(req: AuthRequest, res: Response) {
  const { data } = validate(PostQuerySchema, req.query);
  const userId = req.user!.id;
  const db = await getDb();

  const filter: Record<string, any> = { userId };
  if (data.status) filter.status = data.status;
  if (data.view === "upcoming") {
    filter.status = { $in: ["scheduled", "queued"] };
    filter.scheduledAt = { $gte: new Date() };
  }

  if (data.startDate || data.endDate) {
    const dateFilter: any = {};
    if (data.startDate) dateFilter.$gte = new Date(data.startDate);
    if (data.endDate) dateFilter.$lte = new Date(data.endDate);
    
    // If filtering by status "posted", use postedAt, otherwise use scheduledAt
    if (data.status === "posted") {
      filter.postedAt = dateFilter;
    } else {
      filter.scheduledAt = dateFilter;
    }
  }

  const page = data.page;
  const limit = data.limit;
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    db
      .collection("posts")
      .find(filter, {
        sort: data.view === "upcoming" ? { scheduledAt: 1 } : { updatedAt: -1 },
        skip,
        limit,
      })
      .toArray(),
    db.collection("posts").countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Batch fetch account names
  const accountIds = [...new Set(posts.map((p) => p.accountId).filter(Boolean))];
  const accounts = accountIds.length
    ? await db
        .collection("accounts")
        .find(
          { _id: { $in: accountIds.map((id) => new ObjectId(id)) } },
          { projection: { name: 1 } }
        )
        .toArray()
    : [];
  const accountMap = new Map(
    accounts.map((a) => [a._id.toString(), a.name])
  );

  const serialized = posts.map((p) => {
    const accountId = p.accountId?.toString?.() || p.accountId;
    const accountName = accountMap.get(accountId) || null;
    return {
      ...p,
      id: p._id.toString(),
      _id: undefined,
      createdAt: p.createdAt?.toISOString?.() || p.createdAt,
      updatedAt: p.updatedAt?.toISOString?.() || p.updatedAt,
      scheduledAt: p.scheduledAt?.toISOString?.() || p.scheduledAt,
      postedAt: p.postedAt?.toISOString?.() || p.postedAt,
      analyticsLastSync:
        p.analyticsLastSync?.toISOString?.() || p.analyticsLastSync,
      account: accountName ? { name: accountName, id: accountId } : null,
    };
  });

  res.json({ posts: serialized, total, totalPages, page, limit });
}

export async function getById(req: AuthRequest, res: Response) {
  const db = await getDb();
  const post = await db.collection("posts").findOne({
    _id: new ObjectId(paramId(req)),
    userId: req.user!.id,
  });

  if (!post) return res.status(404).json({ error: "Post not found" });

  let account = null;
  if (post.accountId) {
    try {
      account = await db.collection("accounts").findOne(
        { _id: new ObjectId(post.accountId) },
        { projection: { accessToken: 0, refreshToken: 0, refreshTokenExpiresAt: 0 } }
      );
    } catch {}
  }

  res.json({
    ...post,
    id: post._id.toString(),
    _id: undefined,
    createdAt: post.createdAt?.toISOString?.() || post.createdAt,
    updatedAt: post.updatedAt?.toISOString?.() || post.updatedAt,
    scheduledAt: post.scheduledAt?.toISOString?.() || post.scheduledAt,
    postedAt: post.postedAt?.toISOString?.() || post.postedAt,
    account: account
      ? { ...account, id: account._id.toString(), _id: undefined }
      : null,
  });
}

export async function update(req: AuthRequest, res: Response) {
  const { data, error } = validate(PostUpdateSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  const db = await getDb();
  const userId = req.user!.id;

  // Validate accountId belongs to this user
  if (data.accountId) {
    const owned = await db.collection("accounts").countDocuments({
      _id: new ObjectId(data.accountId),
      userId,
    });
    if (owned === 0) {
      return res.status(400).json({ error: "Account does not belong to you" });
    }
  }

  const setPayload: Record<string, unknown> = { updatedAt: new Date() };
  if (data.content !== undefined) setPayload.content = data.content;
  if (data.accountId !== undefined) setPayload.accountId = data.accountId;
  if (data.status !== undefined) setPayload.status = data.status;
  if (data.scheduledAt !== undefined) {
    setPayload.scheduledAt = data.scheduledAt
      ? new Date(data.scheduledAt)
      : null;
  }

  try {
    await db.collection("posts").updateOne(
      { _id: new ObjectId(paramId(req)), userId: req.user!.id },
      { $set: setPayload }
    );
    writeAuditLog({
      action: "post.updated",
      entityType: "post",
      entityId: paramId(req),
      metadata: setPayload,
      userId: req.user!.id,
    });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Update failed" });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  const db = await getDb();
  const id = new ObjectId(paramId(req));

  try {
    const result = await db.collection("posts").deleteOne({
      _id: id,
      userId: req.user!.id,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    writeAuditLog({
      action: "post.deleted",
      entityType: "post",
      entityId: paramId(req),
      userId: req.user!.id,
    });
    res.json({ ok: true, deletedCount: 1 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Delete failed" });
  }
}

export async function batchDelete(req: AuthRequest, res: Response) {
  const ids = req.body.ids as string[] | undefined;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "ids array is required and must not be empty" });
  }
  if (ids.length > 100) {
    return res.status(400).json({ error: "Maximum 100 posts per batch delete" });
  }

  const db = await getDb();
  const objectIds = ids.map((id: string) => new ObjectId(id));

  try {
    const result = await db.collection("posts").deleteMany({
      _id: { $in: objectIds },
      userId: req.user!.id,
    });
    writeAuditLog({
      action: "post.batch_deleted",
      entityType: "post",
      metadata: { count: result.deletedCount },
      userId: req.user!.id,
    });
    res.json({ ok: true, deletedCount: result.deletedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Batch delete failed" });
  }
}

export async function postNow(req: AuthRequest, res: Response) {
  const db = await getDb();
  const postId = new ObjectId(paramId(req));
  const post = await db.collection("posts").findOne({
    _id: postId,
    userId: req.user!.id,
  });

  if (!post) return res.status(404).json({ error: "Post not found" });
  if (!post.accountId)
    return res.status(400).json({ error: "No account linked to post" });

  const result = await publishPost(postId, post.accountId, "post");
  if (result.ok) {
    res.json({
      ok: true,
      linkedinPostId: result.linkedinPostId,
      shareUrl: result.shareUrl,
    });
  } else {
    res.status(500).json({ ok: false, error: result.error });
  }
}

export async function bulkSchedule(req: AuthRequest, res: Response) {
  const { data, error } = validate(BulkScheduleSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  const db = await getDb();
  const userId = req.user!.id;
  const startDate = new Date(data.startDate);
  const timezone = data.timezone || "UTC";
  const docs: Record<string, unknown>[] = [];
  let dayOffset = 0;
  let slotIndex = 0;

  for (const content of data.contents) {
    const date = new Date(startDate.getTime() + dayOffset * 86400000);
    const [h, m] = data.times[slotIndex % data.times.length]
      .split(":")
      .map(Number);

    // Get date components in the user's timezone, then convert to UTC
    const dateStr = getDateInTz(timezone, date);
    const [yyyy, mm, dd] = dateStr.split("-").map(Number);
    const utcDate = localToUtc(timezone, yyyy, mm - 1, dd, h, m);

    docs.push({
      content,
      status: "scheduled",
      scheduledAt: utcDate,
      accountId: data.accountId,
      source: "bulk",
      userId,
      likes: 0,
      comments: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    slotIndex++;
    if (slotIndex >= data.postsPerDay) {
      slotIndex = 0;
      dayOffset++;
    }
  }

  const result = await db.collection("posts").insertMany(docs);
  writeAuditLog({
    action: "post.bulk_scheduled",
    entityType: "post",
    metadata: {
      count: result.insertedCount,
      days: dayOffset + 1,
      accountId: data.accountId,
    },
    userId,
  });

  res.status(201).json({
    ok: true,
    count: result.insertedCount,
    scheduled: result.insertedCount,
    daysScheduled: dayOffset + 1,
    days: dayOffset + 1,
  });
}

export async function scheduleDrafts(req: AuthRequest, res: Response) {
  const { data, error } = validate(ScheduleDraftsSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  const db = await getDb();
  const userId = req.user!.id;
  const timezone = data.timezone || "Asia/Kolkata";
  const drafts = await db
    .collection("posts")
    .find({ userId, status: "draft" })
    .sort({ createdAt: 1 })
    .toArray();

  if (!drafts.length)
    return res.status(400).json({ error: "No draft posts to schedule" });

  const startDate = new Date(data.startDate);
  let dayOffset = 0;
  let slotIndex = 0;
  let scheduled = 0;

  for (const draft of drafts) {
    const date = new Date(startDate.getTime() + dayOffset * 86400000);
    const [h, m] = data.times[slotIndex % data.times.length]
      .split(":")
      .map(Number);

    const dateStr = getDateInTz(timezone, date);
    const [yyyy, mm, dd] = dateStr.split("-").map(Number);
    const utcDate = localToUtc(timezone, yyyy, mm - 1, dd, h, m);

    await db.collection("posts").updateOne(
      { _id: draft._id, userId },
      {
        $set: {
          status: "scheduled",
          scheduledAt: utcDate,
          accountId: data.accountId,
          updatedAt: new Date(),
        },
      }
    );
    scheduled++;
    slotIndex++;
    if (slotIndex >= data.postsPerDay) {
      slotIndex = 0;
      dayOffset++;
    }
  }

  writeAuditLog({
    action: "post.drafts_scheduled",
    entityType: "post",
    metadata: { scheduled, days: dayOffset + 1 },
    userId,
  });

  res.json({ ok: true, scheduled, daysScheduled: dayOffset + 1 });
}

export async function reschedule(req: AuthRequest, res: Response) {
  const { data, error } = validate(RescheduleSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  const db = await getDb();
  const userId = req.user!.id;

  // Determine which posts to reschedule
  const filter: Record<string, unknown> = { userId };

  if (data.ids && data.ids.length > 0) {
    filter._id = { $in: data.ids.map((id) => new ObjectId(id)) };
  } else {
    // Reschedule all overdue scheduled/queued/draft posts
    filter.status = { $in: ["scheduled", "queued", "draft"] };
    filter.$or = [
      { scheduledAt: { $lte: new Date() } },
      { scheduledAt: null },
    ];
  }

  const posts = await db
    .collection("posts")
    .find(filter)
    .sort({ scheduledAt: 1, createdAt: 1 })
    .toArray();

  if (!posts.length) {
    return res.status(400).json({ error: "No posts to reschedule" });
  }

  // Start from tomorrow in the user's timezone
  const timezone = data.timezone || "Asia/Kolkata";
  const tomorrow = new Date(Date.now() + 86400000);
  const startStr = data.startDate || getDateInTz(timezone, tomorrow);

  // Parse start date as midnight in the target timezone
  const [sy, sm, sd] = startStr.split("-").map(Number);
  const startDate = new Date(Date.UTC(sy, sm - 1, sd, 12, 0, 0));

  const times = data.times;
  const postsPerDay = data.postsPerDay;
  const now = new Date();
  let dayOffset = 0;
  let slotIndex = 0;
  let rescheduled = 0;

  for (const post of posts) {
    const date = new Date(startDate.getTime() + dayOffset * 86400000);
    const [h, m] = times[slotIndex % times.length].split(":").map(Number);

    // Get date components in target timezone, then convert to UTC
    const dateStr = getDateInTz(timezone, date);
    const [yyyy, mm, dd] = dateStr.split("-").map(Number);
    const utcDate = localToUtc(timezone, yyyy, mm - 1, dd, h, m);

    await db.collection("posts").updateOne(
      { _id: post._id, userId },
      {
        $set: {
          status: "scheduled",
          scheduledAt: utcDate,
          errorMessage: null,
          updatedAt: now,
        },
        $unset: { retryAt: "", retryCount: "" },
      },
    );
    rescheduled++;
    slotIndex++;
    if (slotIndex >= postsPerDay) {
      slotIndex = 0;
      dayOffset++;
    }
  }

  writeAuditLog({
    action: "post.rescheduled",
    entityType: "post",
    metadata: {
      count: rescheduled,
      days: dayOffset + 1,
      startDate: startStr,
      timezone,
    },
    userId,
  });

  res.json({
    ok: true,
    rescheduled,
    daysScheduled: dayOffset + 1,
    startDate: startStr,
    timezone,
  });
}
