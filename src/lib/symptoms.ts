import type { DayLog } from "../../shared/types";

/**
 * The ten symptoms most people get at some point in pregnancy. Everything else is "add your own":
 * once you've logged one of your own on 3 different days it becomes a regular option.
 * Names match the symptom cards in content/pregnancy/library.ts.
 */
export const TOP_SYMPTOMS = [
  "Nausea", "Fatigue", "Tender breasts", "Frequent peeing", "Food aversions",
  "Heartburn", "Constipation", "Bloating", "Back pain", "Headache",
];

/** Symptoms that raise a "call your doctor" flag (see shared/pregnancy.ts). Logged on the Log page only. */
export const WARNING_SYMPTOMS = ["Severe headache", "Vision changes", "Sudden swelling"];

/** Days a symptom of your own has to be logged before it becomes a regular option. */
export const RECURRING_AFTER = 3;

const key = (s: string) => s.trim().toLowerCase();
const builtIn = new Set([...TOP_SYMPTOMS, ...WARNING_SYMPTOMS].map(key));

/** Your own symptoms logged on 3+ different days since `since` (the pregnancy's start), most-logged first. */
export function recurringSymptoms(logs: DayLog[], since: string): string[] {
  const days = new Map<string, { name: string; n: number }>();
  for (const l of logs) {
    if (l.date < since) continue;
    for (const s of new Set((l.symptoms ?? []).map(key))) {
      if (builtIn.has(s)) continue;
      const name = l.symptoms!.find((x) => key(x) === s)!.trim();
      const cur = days.get(s);
      // Keep the most recent spelling (logs come in date order).
      days.set(s, { name, n: (cur?.n ?? 0) + 1 });
    }
  }
  return [...days.values()].filter((d) => d.n >= RECURRING_AFTER).sort((a, b) => b.n - a.n).map((d) => d.name);
}

/** Nausea lives in its own field (with a severity) so the doctor summary and warning flags can use it. */
export function hasSymptom(log: DayLog, name: string): boolean {
  if (name === "Nausea") return (!!log.preg?.nausea && log.preg.nausea !== "none") || !!log.symptoms?.some((s) => key(s) === "nausea");
  return !!log.symptoms?.some((s) => key(s) === key(name));
}

export function setSymptom(log: DayLog, name: string, on: boolean): DayLog {
  const rest = (log.symptoms ?? []).filter((s) => key(s) !== key(name));
  const symptoms = on && name !== "Nausea" ? [...rest, name] : rest;
  if (name !== "Nausea") return { ...log, symptoms };
  const nausea = on ? (log.preg?.nausea && log.preg.nausea !== "none" ? log.preg.nausea : "mild") : "none";
  return { ...log, symptoms, preg: { ...log.preg, nausea } };
}

/** Tidy a typed symptom: trimmed, capitalized, and matched to an existing option when it's the same word. */
export function normalizeSymptom(typed: string, options: string[]): string {
  const t = typed.trim().replace(/\s+/g, " ").slice(0, 40);
  return options.find((o) => key(o) === key(t)) ?? t.charAt(0).toUpperCase() + t.slice(1);
}
