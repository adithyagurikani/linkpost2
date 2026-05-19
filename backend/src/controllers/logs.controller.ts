import { Response } from "express";
import { getDb } from "../config/db";
import { AuthRequest } from "../types";

export async function getLogs(req: AuthRequest, res: Response) {
  const db = await getDb();
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const action = req.query.action as string | undefined;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { userId };
  if (action) filter.action = action;

  const [logs, total, actionCounts] = await Promise.all([
    db
      .collection("auditLogs")
      .find(filter, { sort: { createdAt: -1 }, skip, limit })
      .toArray(),
    db.collection("auditLogs").countDocuments(filter),
    db.collection("auditLogs").aggregate<{ _id: string; count: number }>([
      { $match: { userId } },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray(),
  ]);

  const serialized = logs.map((l) => ({
    ...l,
    _id: l._id.toString(),
    createdAt: l.createdAt?.toISOString?.() || l.createdAt,
  }));

  res.json({ 
    logs: serialized, 
    total, 
    page, 
    limit, 
    actionCounts: actionCounts.map(a => ({ action: a._id, count: a.count }))
  });
}
