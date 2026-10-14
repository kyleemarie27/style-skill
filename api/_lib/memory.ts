import { q } from "./db.js";

/** One thing Bloom has learned about the user from chat (or she added herself). */
export interface Fact {
  id: string;
  text: string;
  added: string;
}

export const MAX_FACTS = 80;

export async function loadFacts(): Promise<Fact[]> {
  const { rows } = await q<{ value: { facts?: Fact[] } }>("SELECT value FROM settings WHERE key='memory'");
  return Array.isArray(rows[0]?.value?.facts) ? rows[0].value.facts : [];
}

export async function saveFacts(facts: Fact[]): Promise<Fact[]> {
  const clean = facts
    .filter((f) => f && typeof f.text === "string" && f.text.trim())
    .slice(-MAX_FACTS)
    .map((f) => ({
      id: typeof f.id === "string" && f.id ? f.id.slice(0, 40) : Math.random().toString(36).slice(2, 10),
      text: f.text.trim().slice(0, 240),
      added: typeof f.added === "string" ? f.added.slice(0, 10) : new Date().toISOString().slice(0, 10),
    }));
  await q(
    "INSERT INTO settings (key, value) VALUES ('memory', $1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [JSON.stringify({ facts: clean })],
  );
  return clean;
}

/** The facts as a prompt section, or "" when there are none. */
export function factsPrompt(facts: Fact[]): string {
  if (!facts.length) return "";
  return `\n\nWhat she has told Bloom about herself in earlier chats (use naturally when relevant; don't list them back or say "you told me" every time):\n${facts.map((f) => `- ${f.text}`).join("\n")}`;
}
