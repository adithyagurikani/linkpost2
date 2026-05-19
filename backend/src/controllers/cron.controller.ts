import { Request, Response } from "express";
import { runFullPipeline } from "../services/cron.service";
import { writeAuditLog } from "../services/audit.service";

export async function daily(_req: Request, res: Response) {
  try {
    const result = await runFullPipeline();
    res.json({ ok: true, ...result });
  } catch (err: any) {
    writeAuditLog({
      action: "cron.failed",
      entityType: "cron",
      error: err.message,
    });
    res.status(500).json({ error: err.message || "Cron pipeline failed" });
  }
}
