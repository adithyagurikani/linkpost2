const FREE_MODELS = [
  "nemotron-3-super-free",
  "ring-2.6-1t-free",
  "minimax-m2.5-free",
] as const;

const BASE_URL = "https://opencode.ai/zen/v1/chat/completions";

type Message = { role: "system" | "user" | "assistant"; content: string };

export interface OpenCodeOptions {
  model?: (typeof FREE_MODELS)[number];
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

const DEFAULT_MODEL = "nemotron-3-super-free";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function tryFetch(
  messages: Message[],
  model: string,
  temperature: number,
  maxTokens: number | undefined,
  timeout: number
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "opencode/1.14.48",
  };

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout * 1000);

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature,
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`OpenCode API ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  } finally {
    clearTimeout(id);
  }
}

export async function opencodeChat(
  messages: Message[],
  options?: OpenCodeOptions
): Promise<string> {
  const model = options?.model ?? DEFAULT_MODEL;
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens;
  const timeout = options?.timeout ?? 120;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS * attempt);
    }

    try {
      return await tryFetch(messages, model, temperature, maxTokens, timeout);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message;
      const isRateLimit = msg.includes("429") || msg.includes("rate limit");
      const isOverloaded = msg.includes("503") || msg.includes("overloaded");

      if (!isRateLimit && !isOverloaded) {
        throw lastError;
      }

      if (attempt < MAX_RETRIES) {
        continue;
      }

      for (const fallbackModel of FREE_MODELS) {
        if (fallbackModel === model) continue;
        try {
          return await tryFetch(
            messages,
            fallbackModel,
            temperature,
            maxTokens,
            timeout
          );
        } catch {
        }
      }
    }
  }

  throw lastError ?? new Error("All AI models failed");
}

export async function opencodeRun(
  systemRole: string,
  userContent: string,
  options?: OpenCodeOptions
): Promise<string> {
  return opencodeChat(
    [
      { role: "system", content: systemRole },
      { role: "user", content: userContent },
    ],
    options
  );
}
