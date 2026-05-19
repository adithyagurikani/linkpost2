import { getDb } from "../config/db";

export const DEFAULT_CRON_CONFIG = {
  times: ["08:00", "13:00", "18:00"],
  timezone: "Asia/Kolkata",
  isActive: true,
};

const CONFIG_ID = "cron_config";

export interface CronConfig {
  times: string[];
  timezone: string;
  isActive: boolean;
}

export async function getCronConfig(): Promise<CronConfig> {
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ _id: CONFIG_ID as any });
  if (!doc) return { ...DEFAULT_CRON_CONFIG };
  return {
    times: doc.times || DEFAULT_CRON_CONFIG.times,
    timezone: doc.timezone || DEFAULT_CRON_CONFIG.timezone,
    isActive: doc.isActive !== false,
  };
}

export async function updateCronConfig(updates: Partial<CronConfig>): Promise<CronConfig> {
  const db = await getDb();
  const setFields: Record<string, unknown> = {};
  if (updates.times !== undefined) setFields.times = updates.times;
  if (updates.timezone !== undefined) setFields.timezone = updates.timezone;
  if (updates.isActive !== undefined) setFields.isActive = updates.isActive;

  if (Object.keys(setFields).length > 0) {
    await db.collection("settings").updateOne(
      { _id: CONFIG_ID as any },
      { $set: setFields },
      { upsert: true }
    );
  }

  return getCronConfig();
}

export function timesToCronExpression(times: string[]): string {
  const hours = times
    .map((t) => {
      const [h] = t.split(":").map(Number);
      return h;
    })
    .filter((h) => !isNaN(h))
    .sort((a, b) => a - b);
  if (hours.length === 0) return "0 8 * * *";
  return `0 ${hours.join(",")} * * *`;
}
