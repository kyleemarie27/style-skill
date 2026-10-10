import { normalizeDate } from "../../../shared/dates";
import type { ImportBundle } from "../../../shared/types";
import {
  DayCollector,
  flowFromText,
  humanize,
  mucusFromText,
  parseTemp,
  pregnancyFromText,
} from "./common";

/**
 * Clue exports a password-protected .zip containing JSON (older versions: a .cluedata JSON file).
 * Clue has changed the layout over the years, so this parser is deliberately tolerant. It
 * understands both shapes we know of:
 *   1. day records:      { day: "2023-04-01T00:00:00Z", period: "heavy", sex: ["unprotected"], pain: [...] }
 *   2. measurement rows: { date: "2023-04-01", type: "period", value: { option: "heavy" } }
 * Anything with a date and a recognisable category is picked up; the rest is ignored.
 */
export function parseClueJson(json: unknown): ImportBundle {
  const c = new DayCollector("clue");
  let records = 0;

  walk(json, (obj) => {
    const date = normalizeDate(obj.day ?? obj.date ?? obj.Date ?? obj.timestamp);
    if (!date) return false;
    records++;
    if (typeof obj.type === "string") {
      handle(c, date, obj.type, obj.value ?? obj.option ?? obj.values ?? obj.data);
    } else {
      for (const [k, v] of Object.entries(obj)) {
        if (["day", "date", "Date", "timestamp", "id", "created_at", "updated_at"].includes(k)) continue;
        handle(c, date, k, v);
      }
    }
    return true;
  });

  if (records === 0) c.warnings.push("Couldn't find any dated entries in this Clue file.");
  return c.result();
}

/** Visit every plain object; `visit` returns true to stop descending into that object. */
function walk(node: unknown, visit: (o: Record<string, unknown>) => boolean) {
  if (Array.isArray(node)) {
    for (const n of node) walk(n, visit);
  } else if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (visit(o)) return;
    for (const v of Object.values(o)) walk(v, visit);
  }
}

/** Flatten Clue's many value shapes into option strings. */
export function optionsOf(v: unknown): string[] {
  if (v == null || v === false) return [];
  if (typeof v === "string") return [v];
  if (typeof v === "number") return [String(v)];
  if (v === true) return ["yes"];
  if (Array.isArray(v)) return v.flatMap(optionsOf);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("option" in o) return optionsOf(o.option);
    if ("value" in o) return optionsOf(o.value);
    if ("name" in o) return optionsOf(o.name);
    return Object.entries(o).flatMap(([k, val]) => (val === true ? [k] : optionsOf(val)));
  }
  return [];
}

const SYMPTOM_CATEGORIES = [
  "pain", "energy", "digestion", "poop", "skin", "hair", "craving", "sleep", "ailment",
  "headache", "cramps", "breast", "bloat", "symptom", "collection_method", "pms", "social", "motivation",
];
const SEX_ACTS = ["unprotected", "withdrawal", "intercourse", "had_sex", "sex"];

/** Clue's "everything's normal" answers. Not worth showing as symptoms. */
const NEUTRAL = new Set([
  "ok", "good", "fine", "great", "normal", "none", "pain_free", "no_pain", "ok_hair", "good_hair",
  "good_skin", "woke_up_refreshed", "great_digestion", "normal_stool",
]);
/** Clue option → the wording Bloom uses for the same thing. */
const LABELS: Record<string, string> = {
  period_cramps: "Cramps",
  cramps: "Cramps",
  lower_back: "Back pain",
  ovulation: "Ovulation pain",
  tender_breasts: "Tender breasts",
  nauseous: "Nausea",
  bloated: "Bloating",
  tired: "Tired",
  exhausted: "Tired",
  dry: "Dry skin",
  oily: "Oily skin",
};

function handle(c: DayCollector, date: string, rawKey: string, value: unknown) {
  const key = rawKey.toLowerCase();
  const opts = optionsOf(value).map((o) => o.toLowerCase());
  if (!opts.length) return;

  if (key.includes("spotting")) {
    c.flow(date, "spotting");
  } else if (key === "period" || key.includes("bleeding") || key === "flow" || key.includes("menstruation")) {
    for (const o of opts) {
      const f = flowFromText(o);
      if (f) c.flow(date, f);
    }
  } else if (key.includes("sex") || key.includes("intercourse")) {
    // Clue also tracks sex *drive* under this category, which isn't intercourse.
    for (const o of opts) {
      if (o.includes("drive") || o.includes("libido") || key.includes("drive")) {
        if (o.includes("high")) c.symptom(date, "High libido");
        else if (o.includes("low")) c.symptom(date, "Low libido");
      } else if (o === "protected") {
        // Logged, but kept out of the trying-to-conceive ♥ counts.
        c.symptom(date, "Protected sex");
      } else if (SEX_ACTS.some((a) => o.includes(a)) || o === "yes" || o === "true") {
        c.day(date).intercourse = true;
      }
    }
  } else if (key.includes("ovulation_test") || key.includes("opk") || key === "lh" || key.includes("lh_test")) {
    for (const o of opts) {
      if (o.includes("pos")) c.lh.push({ date, ratio: null, level: "peak", source: "clue" });
      else if (o.includes("neg")) c.lh.push({ date, ratio: null, level: "low", source: "clue" });
    }
  } else if (key.includes("pregnancy")) {
    for (const o of opts) {
      const p = pregnancyFromText(o);
      if (p) c.day(date).pregnancy_test = p;
    }
  } else if (key === "tests" || key === "test") {
    for (const o of opts) {
      if (o.includes("ovulation") && o.includes("pos")) c.lh.push({ date, ratio: null, level: "peak", source: "clue" });
      else if (o.includes("ovulation") && o.includes("neg")) c.lh.push({ date, ratio: null, level: "low", source: "clue" });
      else if (o.includes("pregnancy")) {
        const p = pregnancyFromText(o);
        if (p) c.day(date).pregnancy_test = p;
      }
    }
  } else if (key.includes("fluid") || key.includes("discharge") || key.includes("mucus") || key.includes("cervical")) {
    for (const o of opts) {
      const m = mucusFromText(o);
      if (m) c.day(date).cervical_mucus = m;
    }
  } else if (key.includes("temp") || key === "bbt") {
    const t = parseTemp(opts[0]);
    if (t) c.day(date).bbt = t;
  } else if (key.includes("mood") || key.includes("emotion") || key.includes("feeling") || key.includes("mental") || key === "mind") {
    for (const o of opts) c.mood(date, o);
  } else if (key.includes("note")) {
    const text = optionsOf(value).join(" ").trim();
    if (text) c.day(date).notes = text;
  } else if (SYMPTOM_CATEGORIES.some((s) => key.includes(s))) {
    for (const o of opts) {
      if (NEUTRAL.has(o) || /^\d+(\.\d+)?$/.test(o)) continue; // "ok" answers and raw numbers (e.g. sleep minutes)
      if (o === "yes" || o === "true") c.symptom(date, humanize(key));
      else if (key.includes("craving")) c.symptom(date, `Craving ${o.replace(/_/g, " ")}`);
      else c.symptom(date, LABELS[o] ?? o);
    }
  }
}

/** Open a Clue export (.zip with password, .cluedata or .json) in the browser. */
export async function readClueFile(file: File, password?: string): Promise<ImportBundle> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".zip")) {
    const { ZipReader, BlobReader, TextWriter } = await import("@zip.js/zip.js");
    const reader = new ZipReader(new BlobReader(file), password ? { password } : undefined);
    try {
      const entries = await reader.getEntries();
      const allJsons = entries.filter(
        (e) => !e.directory && /\.(json|cluedata)$/i.test(e.filename) && !e.filename.startsWith("__MACOSX"),
      );
      // Newer exports hold tracking data in measurements.json, next to account files (reminders,
      // notifications, subscriptions…) that can mention "period" and must not become cycle days.
      const tracking = allJsons.filter((e) => /(measurements[^/]*\.json|\.cluedata)$/i.test(e.filename));
      const jsons = tracking.length ? tracking : allJsons;
      if (!jsons.length) throw new Error("No JSON files found inside the Clue zip.");
      if (jsons.some((e) => e.encrypted) && !password) throw new PasswordNeeded();
      const merged: ImportBundle = { dayLogs: [], lhTests: [], warnings: [] };
      for (const e of jsons) {
        if (e.directory) continue;
        let text: string;
        try {
          text = await e.getData!(new TextWriter());
        } catch (err) {
          if (/password/i.test(String(err))) throw new PasswordNeeded(true);
          throw err;
        }
        try {
          const b = parseClueJson(JSON.parse(text));
          merged.dayLogs.push(...b.dayLogs);
          merged.lhTests.push(...b.lhTests);
        } catch {
          merged.warnings.push(`Skipped ${e.filename} (not readable JSON).`);
        }
      }
      return mergeSameSource(merged);
    } finally {
      await reader.close();
    }
  }
  const text = await file.text();
  return parseClueJson(JSON.parse(text));
}

export class PasswordNeeded extends Error {
  constructor(public wrong = false) {
    super(wrong ? "That password didn't work." : "This zip is password-protected.");
  }
}

/** Collapse duplicate days that came from different files in the same export. */
function mergeSameSource(b: ImportBundle): ImportBundle {
  const c = new DayCollector("clue");
  for (const d of b.dayLogs) {
    const t = c.day(d.date);
    if (d.flow) c.flow(d.date, d.flow);
    if (d.intercourse) t.intercourse = true;
    for (const s of d.symptoms ?? []) c.symptom(d.date, s);
    if (d.mood) c.mood(d.date, d.mood);
    t.cervical_mucus ??= d.cervical_mucus;
    t.bbt ??= d.bbt;
    t.pregnancy_test ??= d.pregnancy_test;
    t.notes ??= d.notes;
  }
  c.lh = b.lhTests;
  c.warnings = b.warnings;
  return c.result();
}
