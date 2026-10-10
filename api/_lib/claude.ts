import Anthropic from "@anthropic-ai/sdk";
import type { BetaContentBlockParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { HttpError } from "./db.js";

export const MODEL = "claude-opus-5-5";

/** Set BLOOM_FAKE_AI=1 in local dev to get canned answers without an API key. */
export const fakeAi = () => process.env.BLOOM_FAKE_AI === "1";

export function requireClaude() {
  if (!process.env.ANTHROPIC_API_KEY && !fakeAi()) {
    throw new HttpError(503, "AI isn't set up yet. Add ANTHROPIC_API_KEY in Vercel to turn it on.");
  }
}

/**
 * One structured-output call to Claude. Returns the parsed JSON object.
 * Server-side refusal fallbacks are on, so a rare safety decline is retried on another model.
 */
export async function askJson<T>(opts: {
  system: string;
  content: BetaContentBlockParam[];
  schema: Record<string, unknown>;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<T> {
  requireClaude();
  const client = new Anthropic();
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: opts.system,
      output_config: {
        effort: opts.effort ?? "low",
        format: { type: "json_schema", schema: opts.schema },
      },
      messages: [{ role: "user", content: opts.content }],
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") throw new HttpError(422, "The AI couldn't help with this one. Please enter it manually.");
    if (msg.stop_reason === "max_tokens") throw new HttpError(422, "That file was too big to read in one go. Try a smaller export or a date range.");
    const text = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    return JSON.parse(text) as T;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    // Logged so the reason shows up in Vercel's runtime logs (the API key itself is never included).
    if (err instanceof Anthropic.APIError) console.error(`Anthropic API error ${err.status ?? "network"}: ${err.message}`);
    if (err instanceof Anthropic.AuthenticationError) throw new HttpError(503, "The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.");
    if (err instanceof Anthropic.RateLimitError) throw new HttpError(429, "The AI is busy right now. Try again in a minute.");
    if (err instanceof Anthropic.APIError) throw new HttpError(502, `AI request failed (${err.status ?? "network"}): ${err.message}`);
    throw err;
  }
}
