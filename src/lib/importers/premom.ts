import { normalizeDate } from "../../../shared/dates";
import { levelForRatio, levelFromText } from "../../../shared/lh";
import type { ImportBundle } from "../../../shared/types";
import { DayCollector, flowFromText, mucusFromText, parseTemp, pregnancyFromText } from "./common";

/**
 * Premom's full data export ("premom_data_export_<date>.csv") is several CSV tables in one file,
 * each introduced by a "# Section" line:
 *   # Cycles · # Ovulation Tests (LH / Test Strip) · # Basal Body Temperature · # Daily Logs · # Pregnancy History
 */
export function isPremomExport(text: string): boolean {
  return /^#\s*(Ovulation Tests|Daily Logs|Basal Body Temperature)/im.test(text);
}

type Row = Record<string, string>;

export async function parsePremomExport(text: string): Promise<ImportBundle> {
  const XLSX = await import("xlsx");
  const c = new DayCollector("premom");

  for (const [title, body] of splitSections(text)) {
    const wb = XLSX.read(body, { type: "string", raw: true });
    const rows = XLSX.utils.sheet_to_json<Row>(wb.Sheets[wb.SheetNames[0]], { defval: "", raw: false });
    const t = title.toLowerCase();
    if (t.includes("ovulation test")) rows.forEach((r) => lhRow(c, r));
    else if (t.includes("daily log")) rows.forEach((r) => dayRow(c, r));
    else if (t.includes("temperature")) rows.forEach((r) => bbtRow(c, r));
    // "Cycles" repeats what the daily logs already say, plus predictions; "Pregnancy History" isn't day data.
  }
  return c.result();
}

function splitSections(text: string): [string, string][] {
  const out: [string, string][] = [];
  let title: string | null = null;
  let lines: string[] = [];
  const flush = () => {
    if (title !== null && lines.some((l) => l.trim())) out.push([title, lines.join("\n")]);
  };
  for (const line of text.replace(/^﻿/, "").split(/\r?\n/)) {
    const m = line.match(/^#\s*(.+?)\s*$/);
    if (m) {
      flush();
      title = m[1];
      lines = [];
    } else lines.push(line);
  }
  flush();
  return out;
}

const get = (r: Row, ...names: string[]) => {
  for (const n of names) {
    const k = Object.keys(r).find((h) => h.trim().toLowerCase() === n.toLowerCase());
    if (k && String(r[k]).trim()) return String(r[k]).trim();
  }
  return "";
};

function lhRow(c: DayCollector, r: Row) {
  const when = get(r, "Test Date");
  const date = normalizeDate(when);
  if (!date) return;
  const type = get(r, "Test Type").toLowerCase();
  const result = get(r, "Result");
  const auto = get(r, "Auto Result");

  if (type.includes("hcg") || type.includes("preg")) {
    const p = pregnancyFromText(result || auto);
    if (p) c.day(date).pregnancy_test = p;
    return;
  }

  // Premom's reading is the test-line value divided by the control-line value.
  const tv = Number(get(r, "T Value"));
  const cv = Number(get(r, "C Value"));
  const ratio = Number.isFinite(tv) && Number.isFinite(cv) && cv > 0 ? Math.round((tv / cv) * 100) / 100 : null;
  // Keep Premom's own verdict: a manual result first, then its Peak flag, then its automatic result.
  const level =
    levelFromText(result) ??
    (/^y/i.test(get(r, "Peak")) ? "peak" : null) ??
    levelFromText(auto) ??
    (ratio !== null ? levelForRatio(ratio) : null);
  if (!level) return;
  c.lh.push({ date, taken_at: when, ratio, level, source: "premom" });
}

function dayRow(c: DayCollector, r: Row) {
  const date = normalizeDate(get(r, "Record Date", "Date"));
  if (!date) return;

  const flow = get(r, "Period Flow");
  // Older Premom records store flow as a numeric code (e.g. "256"); newer ones say "Period".
  if (flow && flow !== "0") c.flow(date, flowFromText(flow) ?? "medium");

  const mucus = mucusFromText(get(r, "Cervical Mucus"));
  if (mucus) c.day(date).cervical_mucus = mucus;

  const sex = get(r, "Intercourse").toLowerCase();
  if (sex === "protected") c.symptom(date, "Protected sex");
  else if (sex && !sex.startsWith("no")) c.day(date).intercourse = true; // Unprotected, Withdrawal, Yes…

  for (const m of get(r, "Moods").split(/[,;|]/)) if (m.trim()) c.mood(date, m.trim());
  for (const s of get(r, "Symptoms").split(/[,;|]/)) if (s.trim()) c.symptom(date, s.trim());
  const notes = get(r, "Notes");
  if (notes) c.day(date).notes = notes;
}

function bbtRow(c: DayCollector, r: Row) {
  const date = normalizeDate(get(r, "Measure Date", "Date"));
  if (!date || /^(false|no|0)$/i.test(get(r, "Is BBT"))) return;
  const t = parseTemp(get(r, "Temperature (F)", "Temperature (C)", "Temperature"));
  if (t) c.day(date).bbt = t;
}
