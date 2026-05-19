import { Response } from "express";
import { getDb } from "../config/db";
import { AuthRequest } from "../types";

export async function getStats(req: AuthRequest, res: Response) {
  const db = await getDb();
  const userId = req.user!.id;

  const [result] = await db
    .collection("posts")
    .aggregate([
      { $match: { userId } },
      {
        $facet: {
          totalPosts: [{ $count: "count" }],
          posted: [{ $match: { status: "posted" } }, { $count: "count" }],
          scheduled: [
            { $match: { status: { $in: ["scheduled", "queued"] } } },
            { $count: "count" },
          ],
          failed: [{ $match: { status: "failed" } }, { $count: "count" }],
          drafts: [{ $match: { status: "draft" } }, { $count: "count" }],
          totalLikes: [{ $group: { _id: null, sum: { $sum: "$likes" } } }],
          totalComments: [
            { $group: { _id: null, sum: { $sum: "$comments" } } },
          ],
        },
      },
    ])
    .toArray();

  const extract = (arr: any[]) => arr[0]?.count || arr[0]?.sum || 0;

  res.json({
    totalPosts: extract(result.totalPosts),
    posted: extract(result.posted),
    scheduled: extract(result.scheduled),
    failed: extract(result.failed),
    drafts: extract(result.drafts),
    totalLikes: extract(result.totalLikes),
    totalComments: extract(result.totalComments),
  });
}
