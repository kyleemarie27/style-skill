import { normalizeDate } from "../../../shared/dates";
import { levelForRatio, levelFromText, normalizeRatio } from "../../../shared/lh";
import type { ImportBundle } from "../../../shared/types";
import { mergeBundles } from "./merge";
import {
  DayCollector,
  flowFromText,
  isTruthyMark,
  mucusFromText,
  parseTemp,
  pregnancyFromText,
} from "./common";

/**
 * Parses spreadsheet-style exports (Premom CSV/Excel, or any similar table) into an ImportBundle.
 * Column names vary between app versions, so we match headers by keyword. Two layouts work:
 *   wide: one row per day (or per test) with columns like Date | LH Result | Level | Period | Intercourse | BBT
 *   long: Date | Type | Value rows (e.g. "Ovulation Test", "0.85")
 */
type Row = Record<string, unknown>;

const COL = {
  date: ["date", "day", "time", "recorded"],
  type: ["type", "category", "item", "record type"],
  value: ["value", "result value", "data"],
  ratio: ["ratio", "lh value", "lh reading", "reading", "t/c", "lh result", "lh", "ovulation test", "opk", "result"],
  level: ["level", "status", "lh level", "interpretation"],
  flow: ["period", "flow", "menstruation", "bleeding", "menses"],
  sex: ["intercourse", "sex", "love", "bd", "baby dance"],
  bbt: ["bbt", "temperature", "temp"],
  mucus: ["cervical", "mucus", "cm", "discharge", "fluid"],
  pregnancy: ["pregnancy", "hcg", "hpt"],
  notes: ["note", "comment", "memo"],
  symptoms: ["symptom", "feeling"],
};

function findCol(headers: string[], keys: string[], taken: Set<string>): string | null {
  const norm = (h: string) => h.toLowerCase().trim();
  for (const k of keys) {
    const exact = headers.find((h) => norm(h) === k && !taken.has(h));
    if (exact) return exact;
  }
  for (const k of keys) {
    const hit = headers.find((h) => norm(h).includes(k) && !taken.has(h));
    if (hit) return hit;
  }
  return null;
}

export function parseTableRows(rows: Row[], source: string): ImportBundle {
  const c = new DayCollector(source);
  if (!rows.length) {
    c.warnings.push("The file looks empty.");
    return c.result();
  }
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const taken = new Set<string>();
  const take = (keys: string[]) => {
    const h = findCol(headers, keys, taken);
    if (h) taken.add(h);
    return h;
  };
  // Premom pairs every reading column with a "Time(<column>)" column; never mistake those for values.
  const timeOf = new Map<string, string>();
  for (const h of headers) {
    const m = h.match(/^\s*time\s*\((.+)\)\s*$/i);
    if (m) {
      taken.add(h);
      const target = headers.find((x) => x.trim().toLowerCase() === m[1].trim().toLowerCase());
      if (target) timeOf.set(target, h);
    }
  }
  const date = take(COL.date);
  if (!date) {
    c.warnings.push("Couldn't find a date column.");
    return c.result();
  }
  const type = take(COL.type);
  const value = type ? take(COL.value) : null;

  if (type && value) {
    for (const r of rows) {
      const d = normalizeDate(r[date]);
      if (!d) continue;
      applyFact(c, d, String(r[type] ?? ""), r[value], r);
    }
    return c.result();
  }

  const plainTime = headers.find((h) => h.trim().toLowerCase() === "time" && !taken.has(h)) ?? null;
  if (plainTime) taken.add(plainTime);

  // Premom's chart export has one reading column per test brand ("easy@Home T/C ratio",
  // "Premom LH Level", "Others T/C ratio"). Read every one of them.
  const brandCols = headers.filter((h) => !taken.has(h) && /t\/c ratio|lh level/i.test(h));
  brandCols.forEach((h) => taken.add(h));

  // Generic wide layout. Level must be found before ratio because "lh level" also contains "lh".
  const level = brandCols.length ? null : take(COL.level);
  const ratio = brandCols.length ? null : take(COL.ratio);
  const flow = take(COL.flow);
  const sex = take(COL.sex);
  const bbt = take(COL.bbt);
  const mucus = take(COL.mucus);
  const preg = take(COL.pregnancy);
  const notes = take(COL.notes);
  const symptoms = take(COL.symptoms);

  for (const r of rows) {
    const d = normalizeDate(r[date]);
    if (!d) continue;
    const ts = plainTime && r[plainTime]
      ? `${d} ${String(r[plainTime]).trim()}`
      : typeof r[date] === "string" && /\d{1,2}:\d{2}/.test(r[date] as string) ? String(r[date]) : null;
    for (const col of brandCols) {
      const raw = r[col];
      if (raw === "" || raw == null) continue;
      const rr = normalizeRatio(raw);
      const lv = rr !== null ? levelForRatio(rr) : levelFromText(raw);
      if (!lv) continue;
      const t = timeOf.get(col);
      const taken_at = t && r[t] ? `${d} ${String(r[t]).trim()}` : ts;
      c.lh.push({ date: d, taken_at, ratio: rr, level: lv, source });
    }
    if (ratio || level) {
      const rawRatio = ratio ? r[ratio] : null;
      const rr = normalizeRatio(rawRatio);
      const lv = (level ? levelFromText(r[level]) : null) ?? (rr !== null ? levelForRatio(rr) : levelFromText(rawRatio));
      if (rr !== null || lv) c.lh.push({ date: d, taken_at: ts, ratio: rr, level: lv ?? levelForRatio(rr!), source });
    }
    if (flow) {
      const f = flowFromText(r[flow]);
      if (f) c.flow(d, f);
    }
    if (sex && isTruthyMark(r[sex])) c.day(d).intercourse = true;
    if (bbt) {
      const t = parseTemp(r[bbt]);
      if (t) c.day(d).bbt = t;
    }
    if (mucus) {
      const m = mucusFromText(r[mucus]);
      if (m) c.day(d).cervical_mucus = m;
    }
    if (preg) {
      const p = pregnancyFromText(r[preg]);
      if (p) c.day(d).pregnancy_test = p;
    }
    if (notes && r[notes]) c.day(d).notes = String(r[notes]);
    if (symptoms && r[symptoms]) for (const s of String(r[symptoms]).split(/[,;|]/)) c.symptom(d, s);
  }
  return c.result();
}

function applyFact(c: DayCollector, d: string, typeRaw: string, v: unknown, row: Row) {
  const t = typeRaw.toLowerCase();
  if (t.includes("ovulation") || t.includes("lh") || t.includes("opk")) {
    const rr = normalizeRatio(v);
    const lv = levelFromText(row["level"] ?? row["Level"]) ?? (rr !== null ? levelForRatio(rr) : levelFromText(v));
    if (rr !== null || lv) c.lh.push({ date: d, ratio: rr, level: lv ?? "low", source: c.source });
  } else if (t.includes("pregnan") || t.includes("hcg")) {
    const p = pregnancyFromText(v);
    if (p) c.day(d).pregnancy_test = p;
  } else if (t.includes("spot")) {
    c.flow(d, "spotting");
  } else if (t.includes("period") || t.includes("flow") || t.includes("menstru")) {
    c.flow(d, flowFromText(v) ?? "medium");
  } else if (t.includes("intercourse") || t.includes("sex") || t.includes("love")) {
    if (v == null || v === "" || isTruthyMark(v)) c.day(d).intercourse = true;
  } else if (t.includes("temp") || t.includes("bbt")) {
    const tt = parseTemp(v);
    if (tt) c.day(d).bbt = tt;
  } else if (t.includes("mucus") || t.includes("cervical") || t.includes("discharge")) {
    const m = mucusFromText(v);
    if (m) c.day(d).cervical_mucus = m;
  } else if (t.includes("mood")) {
    c.mood(d, String(v));
  } else if (t.includes("note")) {
    c.day(d).notes = String(v);
  } else if (t.includes("symptom")) {
    c.symptom(d, String(v));
  }
}

/** Read CSV / XLS / XLSX (browser or Node) into one row list per sheet. */
export async function readTableFile(file: { arrayBuffer(): Promise<ArrayBuffer> }): Promise<Row[][]> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true, raw: false });
  const sheets: Row[][] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    // Some exports put a title row above the header; find the first row that has a date-ish header.
    const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
    const headerIdx = grid.findIndex((r) => r.some((cell) => /date|day/i.test(String(cell ?? ""))));
    if (headerIdx < 0) continue;
    sheets.push(XLSX.utils.sheet_to_json<Row>(sheet, { range: headerIdx, defval: "" }));
  }
  return sheets;
}

export async function parseTableFile(file: { arrayBuffer(): Promise<ArrayBuffer> }, source: string): Promise<ImportBundle> {
  const sheets = await readTableFile(file);
  if (!sheets.length) return { dayLogs: [], lhTests: [], warnings: ["Couldn't find a table with a date column in this file."] };
  return mergeBundles(sheets.map((rows) => parseTableRows(rows, source)));
}
