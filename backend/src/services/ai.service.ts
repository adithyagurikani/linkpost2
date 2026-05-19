import { opencodeRun, OpenCodeOptions } from "./opencode.service";
import { getPrompts } from "./prompt.service";

const MODEL = "nemotron-3-super-free";

const AGENT_CONFIGS: Record<
  string,
  { systemRole: string; instruction: string; options?: OpenCodeOptions }
> = {
  hashtag: {
    systemRole: `You are a LinkedIn hashtag strategist. Output ONLY the hashtags separated by spaces — no explanations.`,
    instruction: `Apply the Brew360 framework. Generate exactly 3 to 5 highly relevant, niche semantic hashtags for this text:`,
    options: { model: MODEL },
  },
  refine: {
    systemRole: `You are a professional LinkedIn content editor. Refine posts to be concise, impactful, and highly professional while preserving the original meaning and voice. Always output the complete post — never truncate.`,
    instruction: `Refine and polish this LinkedIn post (output the COMPLETE post, do not truncate):`,
    options: { model: MODEL, maxTokens: 4096 },
  },
  expand: {
    systemRole: `You are a research writer specializing in long-form LinkedIn content. Expand topics into detailed, engaging posts with data points, examples, and industry context. Always output the complete post — never truncate.`,
    instruction: `Research and expand this topic into a comprehensive LinkedIn post (output the COMPLETE post, do not truncate):`,
    options: { model: MODEL, maxTokens: 4096 },
  },
  batch: {
    systemRole: `You are a hashtag optimization engine. Return ONLY a raw JSON object mapping each ID to its hashtag string. No markdown, no extra text.`,
    instruction: `Generate 3-5 hashtags per block. Return JSON: {"id": "#tag1 #tag2 #tag3"}. Data:`,
    options: { model: MODEL },
  },
  prePublish: {
    systemRole: `You are a strict content quality reviewer for LinkedIn posts. Catch truncated text, incomplete sentences, formatting errors, or unprofessional content.`,
    instruction: `Review this post. Respond with exactly: PUBLISH or REJECT followed by brief reason.`,
    options: { model: MODEL },
  },
  fixPost: {
    systemRole: `You are a LinkedIn content fixer. Fix rejected posts and output ONLY the corrected full post — no explanations. Preserve the original meaning and voice.`,
    instruction: `Fix this LinkedIn post based on the rejection reason. Output ONLY the corrected post:`,
    options: { model: MODEL, maxTokens: 4096 },
  },
  brief: {
    systemRole: `You are InkPost's AI status reporter. Summarize activity data clearly. Highlight successes, flag failures, and give actionable insights. Keep summaries under 150 words unless asked for detail.`,
    instruction: `Summarize the following activity data from InkPost:`,
    options: { model: MODEL },
  },
  scheduler: {
    systemRole: `You are a LinkedIn scheduling strategist. Create structured posting plans covering dates, times, content sources, and scheduling strategies. Be precise and thorough.`,
    instruction: `Create a posting plan based on this request and available data:`,
    options: { model: MODEL },
  },
};

export type AgentName = keyof typeof AGENT_CONFIGS;

export async function generateWithAI(
  content: string,
  agent: AgentName = "hashtag",
  userId?: string
): Promise<string> {
  const config = AGENT_CONFIGS[agent];
  let systemRole = config.systemRole;
  let instruction = config.instruction;

  try {
    const prompts = await getPrompts(userId);
    const roleKey = `${agent}SystemRole` as keyof typeof prompts;
    const instrKey = `${agent}Instruction` as keyof typeof prompts;
    if (prompts[roleKey]) systemRole = prompts[roleKey];
    if (prompts[instrKey]) instruction = prompts[instrKey];
  } catch {
    // fall back to defaults
  }

  return opencodeRun(systemRole, `${instruction}\n\n${content}`, config.options);
}

export type PrePublishVerdict = "PUBLISH" | "REJECT";

export async function checkPrePublish(content: string): Promise<{
  verdict: PrePublishVerdict;
  reason?: string;
}> {
  const response = await generateWithAI(content, "prePublish");
  const trimmed = response.trim().toUpperCase();
  if (trimmed.startsWith("PUBLISH")) {
    return { verdict: "PUBLISH" };
  }
  const reason =
    response.replace(/^REJECT\s*/i, "").trim() ||
    "Content failed pre-publish check";
  return { verdict: "REJECT", reason };
}
