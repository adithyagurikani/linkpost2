import { getDb } from "../config/db";

export const DEFAULT_PROMPTS = {
  hashtagSystemRole: `You are a LinkedIn hashtag strategist. Your specialty is the Brew360 ranking framework for maximizing topical indexing and professional authority. Output ONLY the hashtags separated by spaces — no explanations, no commentary, no greetings.`,
  refineSystemRole: `You are a professional LinkedIn content editor. You refine posts to be concise, impactful, and highly professional while preserving the original meaning and voice.`,
  expandSystemRole: `You are a research writer specializing in long-form LinkedIn content. You expand topics into detailed, engaging posts with relevant data points, examples, and industry context.`,
  batchSystemRole: `You are a hashtag optimization engine. You analyze text blocks and return ONLY a raw JSON object mapping each ID to its hashtag string. No explanations, no markdown, no extra text.`,
  prePublishSystemRole: `You are a strict content quality reviewer for LinkedIn posts. You analyze content for completeness, professionalism, proper formatting, and readiness to publish. Be critical — catch truncated text, incomplete sentences, formatting errors, or unprofessional content.`,
  briefSystemRole: `You are InkPost's AI status reporter. You summarize activity data clearly and concisely. Highlight successes, flag failures, and give actionable insights. Be direct and data-driven. Keep summaries under 150 words unless asked for detail.`,
  schedulerSystemRole: `You are a LinkedIn content scheduling strategist. You analyze user requests and available content to create detailed posting plans. You output structured plans covering dates, times, content sources, and scheduling strategies. Be precise and thorough.`,
  hashtagInstruction: `Apply the Brew360 framework. Generate exactly 3 to 5 highly relevant, niche semantic hashtags for this text:`,
  refineInstruction: `Refine and polish this LinkedIn post:`,
  expandInstruction: `Research and expand this topic into a comprehensive LinkedIn post:`,
  batchInstruction: `Generate 3-5 hashtags per block. Return JSON: {"id": "#tag1 #tag2 #tag3"}. Data:`,
  prePublishInstruction: `Review this post. If approved, respond with exactly: PUBLISH. If rejected: REJECT followed by brief reason.`,
  briefInstruction: `Summarize the following activity data from InkPost:`,
  schedulerInstruction: `Create a posting plan based on this request and available data:`,
};

export type PromptKey = keyof typeof DEFAULT_PROMPTS;

export async function getPrompts(
  userId?: string
): Promise<Record<PromptKey, string>> {
  const db = await getDb();
  if (!userId) return { ...DEFAULT_PROMPTS };
  const doc = await db
    .collection("settings")
    .findOne({ _id: `ai_prompts:${userId}` as any });
  if (!doc) return { ...DEFAULT_PROMPTS };
  const prompts: Record<string, string> = {};
  for (const key of Object.keys(DEFAULT_PROMPTS)) {
    prompts[key] = doc[key] || DEFAULT_PROMPTS[key as PromptKey];
  }
  return prompts as Record<PromptKey, string>;
}

export async function updatePrompts(
  userId: string,
  updates: Partial<Record<PromptKey, string>>
) {
  const db = await getDb();
  const setFields: Record<string, string> = {};
  for (const key of Object.keys(updates)) {
    if (updates[key as PromptKey] !== undefined) {
      setFields[key] = updates[key as PromptKey]!;
    }
  }
  await db.collection("settings").updateOne(
    { _id: `ai_prompts:${userId}` as any },
    { $set: setFields },
    { upsert: true }
  );
}
