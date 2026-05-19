import { Request, Response } from "express";
import { batchOptimizeTags } from "../services/cron.service";
import { runAnalyticsCycle } from "../services/analytics.service";
import { AuthRequest } from "../types";

export async function optimize(req: AuthRequest, res: Response) {
  try {
    const count = await batchOptimizeTags(25, req.user!.id);
    res.json({ ok: true, message: `Optimized tags for ${count} post(s)` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Optimization failed" });
  }
}

export async function syncAnalytics(req: AuthRequest, res: Response) {
  try {
    const count = await runAnalyticsCycle(30, req.user!.id);
    res.json({ ok: true, message: `Synced ${count} post(s)` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Sync failed" });
  }
}

export async function health(_req: Request, res: Response) {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
}
