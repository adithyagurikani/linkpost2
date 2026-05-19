import { Request, Response } from "express";
import { getCronConfig, updateCronConfig } from "../services/cron-config.service";
import { restartCronJobs } from "../jobs/cron-scheduler";

export async function getConfig(_req: Request, res: Response) {
  try {
    const config = await getCronConfig();
    res.json(config);
  } catch (err) {
    console.error("Failed to get cron config:", err);
    res.status(500).json({ error: "Failed to get cron config" });
  }
}

export async function updateConfig(req: Request, res: Response) {
  try {
    const { times, timezone, isActive } = req.body;
    const config = await updateCronConfig({ times, timezone, isActive });
    restartCronJobs().catch((err) => console.error("Failed to restart cron:", err));
    res.json(config);
  } catch (err) {
    console.error("Failed to update cron config:", err);
    res.status(500).json({ error: "Failed to update cron config" });
  }
}
