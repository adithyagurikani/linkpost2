import { Response } from "express";
import { getDb } from "../config/db";
import { getAnalyticsData, runAnalyticsCycle } from "../services/analytics.service";
import { AuthRequest, paramId } from "../types";

export async function getData(req: AuthRequest, res: Response) {
  try {
    const data = await getAnalyticsData(req.user!.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch analytics" });
  }
}

export async function sync(req: AuthRequest, res: Response) {
  try {
    const synced = await runAnalyticsCycle(30, req.user!.id);
    res.json({ ok: true, message: `Synced analytics for ${synced} post(s)` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Analytics sync failed" });
  }
}
