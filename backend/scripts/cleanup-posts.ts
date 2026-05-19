import { MongoClient, ObjectId } from "mongodb";
import { config } from "dotenv";

config({ path: "./backend/.env" });

async function main() {
  let uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing in backend/.env");

  // Convert SRV URI to direct connection if DNS fails
  const srvMatch = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\//);
  if (srvMatch) {
    const [, user, pass, host] = srvMatch;
    const dbName = uri.split("/").pop()?.split("?")[0] || "autopost";
    const params = uri.includes("?") ? uri.split("?")[1] : "";
    uri = `mongodb://${user}:${pass}@${host}/${dbName}?${params}`;
    console.log("Using direct connection...");
  }

  console.log("Connecting to MongoDB Atlas...");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });

  try {
    await client.connect();
    const db = client.db();

    // 1. Show current state
    const allPosts = await db.collection("posts").find({}).toArray();
    console.log(`\n=== BEFORE CLEANUP ===`);
    console.log(`Total posts: ${allPosts.length}`);
    const byStatus: Record<string, number> = {};
    allPosts.forEach((p) => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });
    console.log("By status:", byStatus);

    // 2. Remove duplicates — keep only unique content per user
    // Group by content hash, keep the one with earliest createdAt
    const contentMap = new Map<string, any>();
    const duplicateIds: ObjectId[] = [];

    for (const post of allPosts) {
      const key = `${post.userId}::${(post.content || "").trim().substring(0, 200)}`;
      if (contentMap.has(key)) {
        const existing = contentMap.get(key);
        // Keep the one that has a scheduledAt if possible
        if (!existing.scheduledAt && post.scheduledAt) {
          duplicateIds.push(existing._id);
          contentMap.set(key, post);
        } else {
          duplicateIds.push(post._id);
        }
      } else {
        contentMap.set(key, post);
      }
    }

    if (duplicateIds.length > 0) {
      const delResult = await db.collection("posts").deleteMany({ _id: { $in: duplicateIds } });
      console.log(`\nRemoved ${delResult.deletedCount} duplicate posts`);
    } else {
      console.log("\nNo duplicates found");
    }

    // 3. Clean up posts with empty content
    const emptyResult = await db.collection("posts").deleteMany({
      $or: [{ content: "" }, { content: { $exists: false } }, { content: null }],
    });
    if (emptyResult.deletedCount > 0) {
      console.log(`Removed ${emptyResult.deletedCount} empty posts`);
    }

    // 4. Get remaining posts and schedule them neatly
    const remainingPosts = await db.collection("posts").find({}).sort({ createdAt: 1 }).toArray();
    console.log(`\nRemaining posts to schedule: ${remainingPosts.length}`);

    if (remainingPosts.length > 0) {
      // Get active accounts
      const accounts = await db.collection("accounts").find({ isActive: true }).toArray();
      console.log(`Active accounts: ${accounts.length}`);

      // Get schedule configurations
      const schedules = await db.collection("schedules").find({ isActive: true }).toArray();
      console.log(`Active schedules: ${schedules.length}`);

      // Default posting times (IST) if no schedule configured
      const defaultTimes = ["09:00", "12:00", "17:00"];
      const postsPerDay = 3;

      // Determine which account to use
      const defaultAccountId = accounts.length > 0 ? accounts[0]._id.toString() : null;

      // Use schedule's accountId if available, otherwise default
      const targetAccountId = schedules.length > 0 ? schedules[0].accountId : defaultAccountId;

      // Get times from first active schedule or use defaults
      const times = schedules.length > 0 && schedules[0].times?.length ? schedules[0].times : defaultTimes;
      const actualPostsPerDay = times.length;

      console.log(`\nScheduling ${remainingPosts.length} posts at ${actualPostsPerDay} per day`);
      console.log(`Times (IST): ${times.join(", ")}`);
      console.log(`Account: ${targetAccountId}`);

      // Start from tomorrow
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);

      let dayOffset = 0;
      let slotIndex = 0;
      let scheduled = 0;

      for (const post of remainingPosts) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + dayOffset);

        const timeStr = times[slotIndex % times.length];
        const [h, m] = timeStr.split(":").map(Number);
        date.setHours(h, m, 0, 0);

        // Convert IST to UTC for storage
        // IST is UTC+5:30
        const istOffset = 5.5 * 60 * 60 * 1000;
        const utcDate = new Date(date.getTime() - istOffset);

        await db.collection("posts").updateOne(
          { _id: post._id },
          {
            $set: {
              status: "scheduled",
              scheduledAt: utcDate,
              accountId: targetAccountId,
              updatedAt: new Date(),
            },
          }
        );

        scheduled++;
        slotIndex++;
        if (slotIndex >= actualPostsPerDay) {
          slotIndex = 0;
          dayOffset++;
        }
      }

      console.log(`\nScheduled ${scheduled} posts across ${dayOffset + 1} days`);

      // Print schedule summary
      console.log("\n=== SCHEDULE SUMMARY ===");
      const scheduledPosts = await db.collection("posts")
        .find({ status: "scheduled" })
        .sort({ scheduledAt: 1 })
        .toArray();

      let lastDate = "";
      for (const post of scheduledPosts) {
        const dateStr = post.scheduledAt ? new Date(post.scheduledAt).toISOString().split("T")[0] : "no-date";
        if (dateStr !== lastDate) {
          console.log(`\n📅 ${dateStr}`);
          lastDate = dateStr;
        }
        const time = post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(11, 16) : "??:??";
        const preview = (post.content || "").substring(0, 60).replace(/\n/g, " ");
        console.log(`   ${time} IST — ${preview}...`);
      }
    }

    // 5. Final state
    const finalPosts = await db.collection("posts").find({}).toArray();
    console.log(`\n=== AFTER CLEANUP ===`);
    console.log(`Total posts: ${finalPosts.length}`);
    const finalByStatus: Record<string, number> = {};
    finalPosts.forEach((p) => { finalByStatus[p.status] = (finalByStatus[p.status] || 0) + 1; });
    console.log("By status:", finalByStatus);

    console.log("\n✅ Cleanup complete!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

main();
