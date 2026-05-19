import { getDb } from "../config/db";
import { executePost, ensureValidToken } from "./linkedin.service";
import { generateWithAI, checkPrePublish } from "./ai.service";
import { writeAuditLog } from "./audit.service";
import { ObjectId } from "mongodb";
import { PublishResult } from "../types";

export async function publishPost(
  postId: ObjectId,
  accountId: string | ObjectId,
  logPrefix: "cron" | "post"
): Promise<PublishResult> {
  const db = await getDb();

  // Atomically claim this post — only proceed if it's still in a publishable state
  const claim = await db.collection("posts").findOneAndUpdate(
    { _id: postId, status: { $in: ["scheduled", "queued", "draft"] } },
    { $set: { status: "posting", updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!claim) return { ok: false, error: "Post already published or claimed" };

  const post = claim;
  if (!post.accountId) return { ok: false, error: "No account bound to post" };

  const account = await db.collection("accounts").findOne({
    _id: typeof accountId === "string" ? new ObjectId(accountId) : accountId,
    userId: post.userId,
  });
  if (!account) return { ok: false, error: "Account no longer exists" };

  let finalizedContent = post.content;

  // Auto-inject hashtags if none present
  if (!post.content.includes("#")) {
    try {
      const tags = await generateWithAI(post.content, "hashtag");
      if (tags && tags.includes("#")) {
        finalizedContent = `${post.content.trim()}\n\n${tags.trim()}`;
      }
    } catch (e) {
      console.warn("Auto-inject failed:", e);
    }
  }

  // Pre-publish AI quality gate with auto-fix (up to 2 retries)
  let prePublishPassed = false;
  let retries = 0;
  const MAX_RETRIES = 2;
  while (!prePublishPassed && retries <= MAX_RETRIES) {
    try {
      const { verdict, reason } = await checkPrePublish(finalizedContent);
      if (verdict === "PUBLISH") {
        prePublishPassed = true;
        break;
      }
      if (retries >= MAX_RETRIES) {
        const retryCount = (post.retryCount || 0) + 1;
        await db.collection("posts").updateOne(
          { _id: postId },
          {
            $set: {
              status: "failed",
              errorMessage: `Pre-publish check rejected after ${MAX_RETRIES + 1} attempts: ${reason || "Content issue detected"}`,
              updatedAt: new Date(),
              retryCount,
              retryAt: new Date(Date.now() + 120000),
            },
          }
        );
        writeAuditLog({
          action: `${logPrefix}.publish_failed`,
          entityType: "post",
          entityId: postId.toString(),
          error: `Pre-publish rejected after ${MAX_RETRIES + 1} attempts: ${reason}`,
          metadata: {
            accountId: post.accountId?.toString(),
            stage: "pre_publish_check",
            retries,
          },
        });
        return {
          ok: false,
          error: `Pre-publish check rejected after ${MAX_RETRIES + 1} attempts: ${reason}`,
        };
      }
      // Auto-fix the content based on rejection reason
      retries++;
      const fixPrompt = `Post content:\n${finalizedContent}\n\nRejection reason: ${reason || "Content issue detected"}\n\nFix the post to address the rejection reason. Output ONLY the corrected post.`;
      const fixed = await generateWithAI(fixPrompt, "fixPost");
      if (fixed && fixed.trim().length > 20) {
        finalizedContent = fixed.trim();
        await db.collection("posts").updateOne(
          { _id: postId },
          { $set: { content: finalizedContent, updatedAt: new Date() } }
        );
        writeAuditLog({
          action: `${logPrefix}.publish_retry`,
          entityType: "post",
          entityId: postId.toString(),
          metadata: { retry: retries, reason },
        });
      } else {
        // AI didn't produce valid output, bail
        await db.collection("posts").updateOne(
          { _id: postId },
          {
            $set: {
              status: "failed",
              errorMessage: `Pre-publish check rejected: ${reason || "Content issue detected"}`,
              updatedAt: new Date(),
              retryCount: (post.retryCount || 0) + 1,
              retryAt: new Date(Date.now() + 120000),
            },
          }
        );
        writeAuditLog({
          action: `${logPrefix}.publish_failed`,
          entityType: "post",
          entityId: postId.toString(),
          error: `Pre-publish rejected: ${reason}`,
          metadata: {
            accountId: post.accountId?.toString(),
            stage: "pre_publish_check",
          },
        });
        return {
          ok: false,
          error: `Pre-publish check rejected: ${reason}`,
        };
      }
    } catch (e) {
      console.warn("Pre-publish check failed:", e);
      const msg = e instanceof Error ? e.message : String(e);
      if (retries < MAX_RETRIES) {
        retries++;
        continue;
      }
      await db.collection("posts").updateOne(
        { _id: postId },
        {
          $set: {
            status: "failed",
            errorMessage: `Pre-publish check error: ${msg}`,
            updatedAt: new Date(),
            retryCount: (post.retryCount || 0) + 1,
            retryAt: new Date(Date.now() + 120000),
          },
        }
      );
      writeAuditLog({
        action: `${logPrefix}.publish_failed`,
        entityType: "post",
        entityId: postId.toString(),
        error: `Pre-publish check threw: ${msg}`,
        metadata: {
          accountId: post.accountId?.toString(),
          stage: "pre_publish_crash",
        },
      });
      return { ok: false, error: `Pre-publish check failed: ${msg}` };
    }
  }

  // Persist finalized content (with injected hashtags) before executing
  if (finalizedContent !== post.content) {
    await db.collection("posts").updateOne(
      { _id: postId },
      { $set: { content: finalizedContent, updatedAt: new Date() } }
    );
  }

  // Execute LinkedIn post
  try {
    const accessToken = await ensureValidToken(account, db);
    const result = await executePost(
      finalizedContent,
      account.linkedinUserId,
      accessToken
    );

    if (result.statusCode === 201 || result.statusCode === 202) {
      await db.collection("posts").updateOne(
        { _id: postId },
        {
          $set: {
            status: "posted",
            postedAt: new Date(),
            linkedinPostId: result.linkedinPostId,
            shareUrl: result.shareUrl,
            updatedAt: new Date(),
          },
        }
      );
      writeAuditLog({
        action: `${logPrefix}.published`,
        entityType: "post",
        entityId: postId.toString(),
        metadata: {
          linkedinPostId: result.linkedinPostId,
          shareUrl: result.shareUrl,
          accountId: post.accountId?.toString(),
        },
      });
      return {
        ok: true,
        linkedinPostId: result.linkedinPostId,
        shareUrl: result.shareUrl,
      };
    }

    // LinkedIn API error — attempt AI auto-fix + inline retry once
    if ((post.retryCount || 0) < 1) {
      try {
        const errorDetail = typeof result.data === "object"
          ? JSON.stringify(result.data)
          : String(result.data || "");
        const fixPrompt = `Post content:\n${finalizedContent}\n\nLinkedIn API error: ${errorDetail}\n\nFix the post content to resolve the LinkedIn API error. Output ONLY the corrected post.`;
        const fixed = await generateWithAI(fixPrompt, "fixPost");
        if (fixed && fixed.trim().length > 20) {
          finalizedContent = fixed.trim();
          await db.collection("posts").updateOne(
            { _id: postId },
            { $set: { content: finalizedContent, updatedAt: new Date() } }
          );
          writeAuditLog({
            action: `${logPrefix}.publish_auto_fix`,
            entityType: "post",
            entityId: postId.toString(),
            metadata: {
              stage: "linkedin_api_error_fix",
              statusCode: result.statusCode,
            },
          });

          // Inline retry with AI-fixed content
          const retryResult = await executePost(
            finalizedContent,
            account.linkedinUserId,
            accessToken
          );

          if (retryResult.statusCode === 201 || retryResult.statusCode === 202) {
            await db.collection("posts").updateOne(
              { _id: postId },
              {
                $set: {
                  status: "posted",
                  postedAt: new Date(),
                  linkedinPostId: retryResult.linkedinPostId,
                  shareUrl: retryResult.shareUrl,
                  updatedAt: new Date(),
                },
              }
            );
            writeAuditLog({
              action: `${logPrefix}.published`,
              entityType: "post",
              entityId: postId.toString(),
              metadata: {
                linkedinPostId: retryResult.linkedinPostId,
                shareUrl: retryResult.shareUrl,
                accountId: post.accountId?.toString(),
                retriedAfterAiFix: true,
              },
            });
            return {
              ok: true,
              linkedinPostId: retryResult.linkedinPostId,
              shareUrl: retryResult.shareUrl,
            };
          }
        }
      } catch (e) {
        console.warn("AI auto-fix after LinkedIn failure failed:", e);
      }
    }

    // Still failed after AI fix attempt — schedule retry in 2 min
    const retryCount = (post.retryCount || 0) + 1;
    await db.collection("posts").updateOne(
      { _id: postId },
      {
        $set: {
          status: "failed",
          errorMessage: JSON.stringify(result.data),
          updatedAt: new Date(),
          retryCount,
          retryAt: new Date(Date.now() + 120000),
        },
      }
    );
    writeAuditLog({
      action: `${logPrefix}.publish_failed`,
      entityType: "post",
      entityId: postId.toString(),
      error: JSON.stringify(result.data),
      metadata: {
        statusCode: result.statusCode,
        accountId: post.accountId?.toString(),
        retryCount,
      },
    });
    return {
      ok: false,
      error: "LinkedIn API error",
      statusCode: result.statusCode,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const retryCount = (post.retryCount || 0) + 1;
    await db.collection("posts").updateOne(
      { _id: postId },
      {
        $set: {
          status: "failed",
          errorMessage: msg,
          updatedAt: new Date(),
          retryCount,
          retryAt: new Date(Date.now() + 120000),
        },
      }
    );
    writeAuditLog({
      action: `${logPrefix}.publish_failed`,
      entityType: "post",
      entityId: postId.toString(),
      error: msg,
      metadata: { accountId: post.accountId?.toString(), retryCount },
    });
    return { ok: false, error: msg };
  }
}
