import cron, { ScheduledTask } from "node-cron";
import { runFastPipeline, runFullPipeline, retryFailedPosts } from "../services/cron.service";
import { getCronConfig, timesToCronExpression } from "../services/cron-config.service";

let slowTask: ScheduledTask | null = null;
let fastTask: ScheduledTask | null = null;
let retryTask: ScheduledTask | null = null;

export async function startCronJobs() {
  const config = await getCronConfig();

  if (!config.isActive) {
    console.log("⏸️ Cron jobs disabled via config");
    return;
  }

  const tz = config.timezone === "UTC" ? "Etc/UTC" : config.timezone;

  // Fast pipeline: process schedules + publish due posts every 15 minutes
  fastTask = cron.schedule(
    "*/15 * * * *",
    async () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Fast pipeline triggered (every 15min)`);
      try {
        const result = await runFastPipeline();
        if (result.schedules_processed || result.posted || result.retried) {
          console.log(`[${timestamp}] Fast pipeline:`, result);
        }
      } catch (err) {
        console.error(`[${timestamp}] Fast pipeline failed:`, err);
      }
    },
    { timezone: tz },
  );

  // Retry pipeline: retry failed posts every 2 minutes
  retryTask = cron.schedule(
    "*/2 * * * *",
    async () => {
      try {
        const retried = await retryFailedPosts(10);
        if (retried > 0) {
          console.log(`[${new Date().toISOString()}] Retry pipeline: ${retried} posts retried`);
        }
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Retry pipeline failed:`, err);
      }
    },
    { timezone: tz },
  );

  // Slow pipeline: batch optimize tags + sync analytics at configured times
  const expression = timesToCronExpression(config.times);
  slowTask = cron.schedule(
    expression,
    async () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Full pipeline triggered (${config.times.join(", ")} ${config.timezone})`);
      try {
        const result = await runFullPipeline();
        console.log(`[${timestamp}] Full pipeline complete:`, result);
      } catch (err) {
        console.error(`[${timestamp}] Full pipeline failed:`, err);
      }
    },
    { timezone: tz },
  );

  console.log(`✅ Cron scheduled: retry=*/2 * * * *, fast=*/15 * * * *, slow=${expression} ${config.timezone}`);
}

export async function restartCronJobs() {
  if (fastTask) {
    fastTask.stop();
    fastTask = null;
  }
  if (slowTask) {
    slowTask.stop();
    slowTask = null;
  }
  if (retryTask) {
    retryTask.stop();
    retryTask = null;
  }
  await startCronJobs();
}
