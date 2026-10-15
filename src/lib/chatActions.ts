import { isISODate, prettyDate } from "../../shared/dates";
import type { DayLog, Nausea, PregBleeding, PregLog, PregPain } from "../../shared/types";

/**
 * Ask Bloom can suggest things to save from a conversation. The model ends its answer with lines like
 * [[bloom:{"type":"question","text":"..."}]]; the app strips them from the text and shows each one as
 * a button. Nothing is saved until she taps it.
 */
export type ChatAction =
  | { type: "question"; text: string }
  | { type: "appointment"; date: string; title: string }
  | {
      type: "log";
      date: string;
      symptoms?: string[];
      mood?: string;
      nausea?: Nausea;
      bleeding?: PregBleeding;
      pain?: PregPain;
      prenatal?: boolean;
      notes?: string;
    };

const TAG = /\[\[bloom:([\s\S]*?)\]\]/g;

const NAUSEA: Nausea[] = ["none", "mild", "moderate", "severe"];
const BLEEDING: PregBleeding[] = ["none", "spotting", "light", "heavy"];
const PAIN: PregPain[] = ["none", "mild", "strong"];

function clean(raw: unknown): ChatAction | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const str = (v: unknown, max = 300) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
  if (a.type === "question") {
    const text = str(a.text);
    return text ? { type: "question", text } : null;
  }
  if (a.type === "appointment") {
    const title = str(a.title, 120);
    return title && isISODate(a.date) ? { type: "appointment", date: a.date as string, title } : null;
  }
  if (a.type === "log" && isISODate(a.date)) {
    const out: ChatAction = { type: "log", date: a.date as string };
    if (Array.isArray(a.symptoms)) out.symptoms = a.symptoms.map((s) => str(s, 40)).filter((s): s is string => !!s).slice(0, 8);
    if (str(a.mood, 40)) out.mood = str(a.mood, 40);
    if (NAUSEA.includes(a.nausea as Nausea)) out.nausea = a.nausea as Nausea;
    if (BLEEDING.includes(a.bleeding as PregBleeding)) out.bleeding = a.bleeding as PregBleeding;
    if (PAIN.includes(a.pain as PregPain)) out.pain = a.pain as PregPain;
    if (typeof a.prenatal === "boolean") out.prenatal = a.prenatal;
    if (str(a.notes)) out.notes = str(a.notes);
    const hasData = out.symptoms?.length || out.mood || out.nausea || out.bleeding || out.pain || out.prenatal !== undefined || out.notes;
    return hasData ? out : null;
  }
  return null;
}

/** Split an answer into the text to show and the actions it suggests. Hides a half-streamed tag too. */
export function parseAnswer(text: string): { text: string; actions: ChatAction[] } {
  const actions: ChatAction[] = [];
  let shown = text.replace(TAG, (_, json: string) => {
    try {
      const a = clean(JSON.parse(json));
      if (a) actions.push(a);
    } catch {
      /* malformed: drop it */
    }
    return "";
  });
  const open = shown.lastIndexOf("[[");
  if (open !== -1 && "[[bloom:".startsWith(shown.slice(open, open + 8))) shown = shown.slice(0, open);
  return { text: shown.trim(), actions: actions.slice(0, 4) };
}

/** Short label for the button. */
export function actionLabel(a: ChatAction): string {
  if (a.type === "question") return `Add to doctor questions: "${a.text}"`;
  if (a.type === "appointment") return `Add appointment: ${a.title}, ${prettyDate(a.date)}`;
  const bits = [
    a.nausea && `nausea ${a.nausea}`,
    a.bleeding && (a.bleeding === "none" ? "no bleeding" : `bleeding: ${a.bleeding}`),
    a.pain && (a.pain === "none" ? "no cramping" : `cramping: ${a.pain}`),
    ...(a.symptoms ?? []).map((s) => s.toLowerCase()),
    a.mood && `feeling ${a.mood.toLowerCase()}`,
    a.prenatal && "took prenatal",
    a.notes && "a note",
  ].filter(Boolean);
  return `Log for ${prettyDate(a.date)}: ${bits.join(", ")}`;
}

/** Merge a log action into the existing day without wiping anything already logged. */
export function mergeLog(existing: DayLog | undefined, a: Extract<ChatAction, { type: "log" }>, pregnant: boolean): DayLog {
  const log: DayLog = { ...(existing ?? { date: a.date }) };
  if (a.symptoms?.length) log.symptoms = [...new Set([...(log.symptoms ?? []), ...a.symptoms])];
  if (a.mood) {
    const moods = (log.mood ?? "").split(",").map((m) => m.trim()).filter(Boolean);
    if (!moods.includes(a.mood)) log.mood = [...moods, a.mood].join(", ");
  }
  if (a.notes) log.notes = log.notes ? `${log.notes}\n${a.notes}` : a.notes;
  if (pregnant) {
    const p: PregLog = { ...(log.preg ?? {}) };
    if (a.nausea) p.nausea = a.nausea;
    if (a.bleeding) p.bleeding = a.bleeding;
    if (a.pain) p.pain = a.pain;
    if (a.prenatal !== undefined) p.prenatal = a.prenatal;
    log.preg = p;
  }
  return log;
}
