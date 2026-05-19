import { getDb } from "../config/db";
import { ObjectId } from "mongodb";
import { writeAuditLog } from "./audit.service";
import { generateWithAI } from "./ai.service";
import { publishPost } from "./publish.service";
import { getNextRun, getDateInTz, DEFAULT_TZ } from "../lib/schedule-utils";
import { runAnalyticsCycle } from "./analytics.service";

/**
 * Publish posts whose scheduledAt is within the lookback window.
 * Runs AFTER processSchedules() so newly created posts are picked up immediately.
 */
export async function postOneDue(
  lookbackHours = 3,
  maxBatch = 25,
): Promise<number> {
  const db = await getDb();
  const windowStart = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

  const posts = await db
    .collection("posts")
    .find(
      {
        status: { $in: ["scheduled", "queued"] },
        scheduledAt: { $gte: windowStart, $lte: new Date() },
        accountId: { $ne: null },
      },
      { sort: { scheduledAt: 1 }, limit: maxBatch },
    )
    .toArray();

  if (!posts.length) return 0;

  let published = 0;
  for (const post of posts) {
    const accountId =
      typeof post.accountId === "string"
        ? new ObjectId(post.accountId)
        : post.accountId;
    const result = await publishPost(post._id, accountId, "cron");
    if (result.ok) published++;
  }

  return published;
}

/**
 * Retry previously failed posts whose retryAt has been reached.
 * Exponential backoff: 30min, 1h, 2h. Max 3 retries.
 */
export async function retryFailedPosts(maxBatch = 10): Promise<number> {
  const db = await getDb();
  const now = new Date();

  const posts = await db
    .collection("posts")
    .find({
      status: "failed",
      retryAt: { $lte: now },
      retryCount: { $lt: 3 },
      accountId: { $ne: null },
    })
    .sort({ retryAt: 1 })
    .limit(maxBatch)
    .toArray();

  if (!posts.length) return 0;

  let retried = 0;
  for (const post of posts) {
    const accountId =
      typeof post.accountId === "string"
        ? new ObjectId(post.accountId)
        : post.accountId;
    const result = await publishPost(post._id, accountId, "cron");
    if (result.ok) retried++;
  }

  if (retried > 0) {
    writeAuditLog({
      action: "cron.retried_failed",
      entityType: "cron",
      metadata: { retried },
    });
  }

  return retried;
}

/**
 * Process due recurring schedules.
 * For each matching schedule:
 *   - Template mode: creates a post for each time slot in the upcoming window
 *   - Drafts mode: assigns due drafts to time slots
 * Wraps each schedule in try/catch so one failure doesn't skip the rest.
 */
export async function processSchedules(): Promise<number> {
  const db = await getDb();
  const now = new Date();

  const schedules = await db
    .collection("schedules")
    .find({
      isActive: true,
      $or: [{ nextRunAt: null }, { nextRunAt: { $lte: now } }],
    })
    .toArray();

  let count = 0;
  for (const schedule of schedules) {
    try {
      const processed = await processOneSchedule(schedule, now);
      if (processed) count++;
    } catch (err) {
      console.error(`Schedule "${schedule.name}" (${schedule._id}) failed:`, err);
      writeAuditLog({
        action: "cron.schedule_failed",
        entityType: "schedule",
        entityId: schedule._id.toString(),
        error: err instanceof Error ? err.message : String(err),
        metadata: { scheduleName: schedule.name },
      });
    }
  }

  if (count > 0) {
    writeAuditLog({
      action: "cron.schedules_processed",
      entityType: "cron",
      metadata: { count },
    });
  }

  return count;
}

async function processOneSchedule(schedule: any, now: Date): Promise<boolean> {
  const db = await getDb();
  const timezone = schedule.timezone || DEFAULT_TZ;

  let times: string[] = schedule.times?.length ? schedule.times : ["08:00"];

  // Compute next UTC run time from the schedule's local times
  const next = getNextRun(times, schedule.nextRunAt ?? now, timezone);

  if (schedule.mode === "drafts") {
    const slotsPerRun = times.length;
    const drafts = await db
      .collection("posts")
      .find(
        {
          userId: schedule.userId,
          status: "draft",
          accountId: { $in: [null, schedule.accountId] },
        },
        { sort: { createdAt: 1 }, limit: slotsPerRun },
      )
      .toArray();

    for (let i = 0; i < drafts.length; i++) {
      const [hh, mm] = times[i].split(":").map(Number);
      const scheduledDate = dateForLocalTime(next, hh, mm, timezone);

      await db.collection("posts").updateOne(
        { _id: drafts[i]._id },
        {
          $set: {
            status: "scheduled",
            scheduledAt: scheduledDate,
            accountId: schedule.accountId,
            updatedAt: now,
          },
        },
      );
    }

    if (drafts.length > 0) {
      writeAuditLog({
        action: "cron.scheduled_drafts",
        entityType: "schedule",
        entityId: schedule._id.toString(),
        metadata: {
          scheduleName: schedule.name,
          draftsScheduled: drafts.length,
          times,
        },
      });
    }
  } else {
    // Template mode: create one post at the next scheduled time
    const content = (schedule.contentTemplate || "")
      .replace(/\{date\}/g, getDateInTz(timezone, now))
      .replace(/\{time\}/g, now.toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }));

    await db.collection("posts").insertOne({
      accountId: schedule.accountId,
      userId: schedule.userId,
      content,
      status: "scheduled",
      scheduledAt: next,
      source: "schedule",
      createdAt: now,
      updatedAt: now,
      likes: 0,
      comments: 0,
    });
  }

  // Advance the schedule
  const nextAfter = getNextRun(times, new Date(next.getTime() + 60000), timezone);

  await db.collection("schedules").updateOne(
    { _id: schedule._id },
    { $set: { lastRunAt: now, nextRunAt: nextAfter, times } },
  );

  return true;
}

/**
 * Given a reference UTC date and local hour/minute in a timezone,
 * return the UTC Date that corresponds to that local time on that date.
 */
function dateForLocalTime(
  referenceDate: Date,
  hour: number,
  minute: number,
  timezone: string,
): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(referenceDate);

  const year = parseInt(parts.find((p) => p.type === "year")!.value);
  const month = parseInt(parts.find((p) => p.type === "month")!.value) - 1;
  const day = parseInt(parts.find((p) => p.type === "day")!.value);

  const noonUtc = Date.UTC(year, month, day, 12, 0, 0);
  const offsetMs = getTzOffsetMs(new Date(noonUtc), timezone);

  return new Date(Date.UTC(year, month, day, hour, minute, 0) - offsetMs);
}

function getTzOffsetMs(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);

  const tzYear = parseInt(parts.find((p) => p.type === "year")!.value);
  const tzMonth = parseInt(parts.find((p) => p.type === "month")!.value) - 1;
  const tzDay = parseInt(parts.find((p) => p.type === "day")!.value);
  const tzHour = parseInt(parts.find((p) => p.type === "hour")!.value);
  const tzMinute = parseInt(parts.find((p) => p.type === "minute")!.value);
  const tzSecond = parseInt(parts.find((p) => p.type === "second")!.value);

  const localEpoch = Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMinute, tzSecond);
  return localEpoch - date.getTime();
}

/**
 * Add AI-generated hashtags to scheduled/queued posts that lack them.
 */
export async function batchOptimizeTags(
  batchSize = 20,
  userId?: string,
): Promise<number> {
  const db = await getDb();

  const filter: Record<string, unknown> = {
    status: { $in: ["scheduled", "queued"] },
    content: { $not: /#/ },
  };
  if (userId) filter.userId = userId;

  const maxBatch = Math.min(batchSize, 100);
  const posts = await db
    .collection("posts")
    .find(filter, { sort: { scheduledAt: 1 }, limit: maxBatch })
    .toArray();

  if (!posts.length) return 0;

  const bundle = posts
    .map((p) => `ID:${p._id.toString()} CONTENT:[${p.content}]`)
    .join("\n\n");
  const dataBlock = `${bundle.length} blocks to process:\n${bundle}`;

  try {
    const rawResponse = await generateWithAI(dataBlock, "batch");
    const match = rawResponse.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("JSON not found");

    const parsed: Record<string, string> = JSON.parse(match[0]);
    let updated = 0;

    for (const id in parsed) {
      const tags = parsed[id];
      const matchPost = posts.find((p) => p._id.toString() === id);

      if (matchPost && tags && tags.includes("#")) {
        await db.collection("posts").updateOne(
          { _id: matchPost._id },
          {
            $set: {
              content: `${matchPost.content.trim()}\n\n${tags.trim()}`,
              updatedAt: new Date(),
            },
          },
        );
        updated++;
      }
    }
    if (updated > 0) {
      writeAuditLog({
        action: "cron.tags_optimized",
        entityType: "cron",
        metadata: { batchSize, updated },
      });
    }
    return updated;
  } catch (err) {
    console.error("Batch optimization pipeline fault:", err);
    writeAuditLog({
      action: "cron.optimize_failed",
      entityType: "cron",
      error: String(err),
    });
    return 0;
  }
}

/**
 * Fast pipeline — runs every 15 minutes.
 * Creates upcoming scheduled posts, publishes due ones, retries failed ones.
 */
export async function runFastPipeline(): Promise<{
  schedules_processed: number;
  posted: number;
  retried: number;
}> {
  let schedules_processed = 0;
  let posted = 0;
  let retried = 0;

  try {
    schedules_processed = await processSchedules();
  } catch (e) {
    console.error("processSchedules failed:", e);
  }

  try {
    posted = await postOneDue(3, 25);
  } catch (e) {
    console.error("postOneDue failed:", e);
  }

  try {
    retried = await retryFailedPosts(10);
  } catch (e) {
    console.error("retryFailedPosts failed:", e);
  }

  return { schedules_processed, posted, retried };
}

/**
 * Slow pipeline — runs at user-configured times (e.g., 3x/day).
 * Heavy tasks: tagged optimization + analytics sync.
 * Also runs the fast pipeline steps.
 */
export async function runFullPipeline(): Promise<{
  optimized: number;
  posted: number;
  schedules_processed: number;
  analytics_synced: number;
  retried: number;
}> {
  let optimized = 0;
  let analytics_synced = 0;

  // Run fast pipeline steps first (creates + publishes posts)
  const fast = await runFastPipeline();

  // Then heavy tasks
  try {
    optimized = await batchOptimizeTags(25);
  } catch (e) {
    console.error("batchOptimizeTags failed:", e);
  }

  try {
    analytics_synced = await runAnalyticsCycle(30);
  } catch (e) {
    console.error("runAnalyticsCycle failed:", e);
  }

  writeAuditLog({
    action: "cron.executed",
    entityType: "cron",
    metadata: {
      optimized,
      posted: fast.posted,
      schedules_processed: fast.schedules_processed,
      analytics_synced,
      retried: fast.retried,
    },
  });

  return {
    optimized,
    posted: fast.posted,
    schedules_processed: fast.schedules_processed,
    analytics_synced,
    retried: fast.retried,
  };
}
