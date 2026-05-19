import { Response } from "express";
import { getDb } from "../config/db";
import { validate, AIGenerateSchema, BriefSchema, SchedulePlanSchema } from "../lib/validation";
import { generateWithAI } from "../services/ai.service";
import { AuthRequest } from "../types";

export async function generate(req: AuthRequest, res: Response) {
  const { data, error } = validate(AIGenerateSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  const agentMap: Record<string, string> = {
    refine: "refine",
    expand: "expand",
    hashtags: "hashtag",
    schedule: "scheduler",
  };
  const agent = agentMap[data.mode] || "refine";

  try {
    const result = await generateWithAI(data.prompt, agent as any, req.user!.id);
    res.json({ response: result, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "AI generation failed" });
  }
}

export async function brief(req: AuthRequest, res: Response) {
  const { data, error } = validate(BriefSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  const db = await getDb();
  const userId = req.user!.id;
  const days = data.days;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const [posts, accounts, logs] = await Promise.all([
    db.collection("posts")
      .find({ userId, updatedAt: { $gte: since } })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray(),
    db.collection("accounts")
      .find({ userId })
      .toArray(),
    db.collection("auditLogs")
      .find({ userId, createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray(),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const p of posts) {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  }

  const contextBlock = [
    `Period: Last ${days} day(s)`,
    `Active accounts: ${accounts.filter((a) => a.isActive).length}/${accounts.length}`,
    `Posts by status: ${JSON.stringify(statusCounts)}`,
    `Recent audit actions: ${logs.slice(0, 10).map((l) => l.action).join(", ")}`,
  ].join("\n");

  const prompt = data.query
    ? `${contextBlock}\n\nUser question: ${data.query}`
    : contextBlock;

  try {
    const result = await generateWithAI(prompt, "brief", userId);
    res.json({ result, summary: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Brief generation failed" });
  }
}

export async function schedulePlan(req: AuthRequest, res: Response) {
  const { data, error } = validate(SchedulePlanSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  const db = await getDb();
  const userId = req.user!.id;

  const [accounts, sources, drafts] = await Promise.all([
    db.collection("accounts").find({ userId, isActive: true }).toArray(),
    db.collection("contentSources").find({ userId, isActive: { $ne: false } }).toArray(),
    db.collection("posts").find({ userId, status: "draft" }).limit(20).toArray(),
  ]);

  const contextBlock = [
    `Accounts: ${accounts.map((a) => a.name).join(", ") || "None"}`,
    `Sources: ${sources.length} active content sources`,
    `Draft posts: ${drafts.length} available`,
    drafts.length > 0
      ? `Sample drafts:\n${drafts.slice(0, 5).map((d) => `- ${d.content.substring(0, 80)}...`).join("\n")}`
      : "",
  ].join("\n");

  try {
    const result = await generateWithAI(
      `${contextBlock}\n\nUser request: ${data.prompt}`,
      "scheduler",
      userId
    );

    // Try to parse structured plan from AI response
    let plan: Record<string, unknown> | null = null;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.posts || parsed.summary) {
          plan = parsed;
        }
      }
    } catch {
      // AI response is unstructured text — that's fine
    }

    if (!plan) {
      // Fallback: wrap raw text as plan summary so UI doesn't break
      plan = { summary: result, posts: [], recurringSchedule: null };
    }

    res.json({ result, plan });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Schedule plan failed" });
  }
}
