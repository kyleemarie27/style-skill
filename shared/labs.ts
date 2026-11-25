import { isISODate, normalizeDate } from "./dates.js";

/**
 * Lab results going in. Everything lands in a review table first; nothing is saved until she checks it.
 * Three ways in, none of which need AI to understand the structure:
 *   - text in "Test | value | unit | range | flag" lines (what the PDF/photo transcription produces,
 *     and easy to paste by hand),
 *   - a JSON export (like the labs-and-ovulation file),
 *   - CSV with date,test,value,unit,ref_low,ref_high,flag columns.
 */
export interface LabRow {
  date: string;
  panel: string | null;
  test: string;
  /** As printed: "1.2", "<5", "Non Reactive", or "Pending". */
  value: string;
  unit: string | null;
  refLow: number | null;
  refHigh: number | null;
  flag: "low" | "high" | null;
  status: "final" | "pending";
}

/** Dated observations and outside reads that come with an import, saved as evidence. */
export interface EvidenceItem {
  date: string;
  kind: "note" | "event" | "analysis";
  text: string;
}

export interface LabImport {
  rows: LabRow[];
  evidence: EvidenceItem[];
  /** Facts that correct Bloom's own records, applied only if she keeps them ticked. */
  lossDate: string | null;
  negativeTest: string | null;
  warnings: string[];
}

const empty = (): LabImport => ({ rows: [], evidence: [], lossDate: null, negativeTest: null, warnings: [] });

const numOrNull = (v: unknown) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

/** "0.45-4.5", ">60", "<199", "0.45 - 4.50" → low/high. */
export function parseRange(raw: string): { low: number | null; high: number | null } {
  const s = raw.replace(/\s+/g, "");
  let m = s.match(/^(-?\d*\.?\d+)[-–](-?\d*\.?\d+)$/);
  if (m) return { low: Number(m[1]), high: Number(m[2]) };
  m = s.match(/^[>≥](=?)(-?\d*\.?\d+)$/);
  if (m) return { low: Number(m[2]), high: null };
  m = s.match(/^[<≤](=?)(-?\d*\.?\d+)$/);
  if (m) return { low: null, high: Number(m[2]) };
  return { low: null, high: null };
}

const flagOf = (raw: string): LabRow["flag"] => {
  const f = raw.trim().toLowerCase();
  return f === "h" || f === "high" ? "high" : f === "l" || f === "low" ? "low" : null;
};

/** The transcription format: "Date: YYYY-MM-DD" lines and "Test | value | unit | range | flag" rows. */
export function parseLabLines(text: string, fallbackDate: string | null = null): LabImport {
  const out = empty();
  let date = fallbackDate;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const dm = line.match(/^date\s*[:=]\s*(.+)$/i);
    if (dm) {
      const d = normalizeDate(dm[1].trim());
      if (d) date = d;
      else out.warnings.push(`Couldn't read the date "${dm[1].trim()}".`);
      continue;
    }
    if (!line.includes("|")) continue;
    const [test, value = "", unit = "", range = "", flag = ""] = line.split("|").map((x) => x.trim());
    if (!test || !value) {
      out.warnings.push(`Skipped "${line}".`);
      continue;
    }
    if (!date) {
      out.warnings.push("No date found: set the date before saving.");
      date = "";
    }
    const r = parseRange(range);
    const pending = /^pending$/i.test(value);
    out.rows.push({
      date: date ?? "", panel: null, test, value: pending ? "" : value, unit: unit || null,
      refLow: r.low, refHigh: r.high, flag: flagOf(flag) ?? autoFlag(value, r.low, r.high), status: pending ? "pending" : "final",
    });
  }
  if (!out.rows.length) out.warnings.push("No results found. Check the file, or paste the results as text.");
  return out;
}

/** Flag against the range when the report didn't. */
function autoFlag(value: string, low: number | null, high: number | null): LabRow["flag"] {
  const n = Number(value.replace(/[<>\s]/g, ""));
  if (!Number.isFinite(n) || /[<>]/.test(value)) return null;
  if (low !== null && n < low) return "low";
  if (high !== null && n > high) return "high";
  return null;
}

/** CSV with a header row: date,test,value,unit,ref_low,ref_high,flag (panel and status optional). */
export function parseLabCsv(text: string): LabImport {
  const out = empty();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    out.warnings.push("The CSV has no rows.");
    return out;
  }
  const cells = (l: string) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  const head = cells(lines[0]).map((h) => h.toLowerCase().replace(/[\s-]+/g, "_"));
  const col = (name: string) => head.indexOf(name);
  for (const l of lines.slice(1)) {
    const c = cells(l);
    const get = (n: string) => (col(n) >= 0 ? c[col(n)] ?? "" : "");
    const date = normalizeDate(get("date"));
    const test = get("test");
    if (!date || !test) {
      out.warnings.push(`Skipped "${l}".`);
      continue;
    }
    const value = get("value");
    out.rows.push({
      date, panel: get("panel") || null, test, value: /^pending$/i.test(value) ? "" : value, unit: get("unit") || null,
      refLow: numOrNull(get("ref_low")), refHigh: numOrNull(get("ref_high")), flag: flagOf(get("flag")),
      status: /^pending$/i.test(value) || get("status") === "pending" ? "pending" : "final",
    });
  }
  return out;
}

/** The labs-and-ovulation JSON export: results, prior values, cycle events and an outside analysis. */
export function parseLabJson(raw: unknown): LabImport {
  const out = empty();
  const j = raw as any;
  const panel = j?.lab_panel ?? j;
  const date = isISODate(panel?.service_date) ? panel.service_date : null;
  for (const r of Array.isArray(panel?.results) ? panel.results : []) {
    if (!r?.test || !date) continue;
    out.rows.push({
      date, panel: r.panel ?? null, test: String(r.test), value: String(r.value ?? ""), unit: r.unit ?? null,
      refLow: numOrNull(r.ref_low), refHigh: numOrNull(r.ref_high), flag: r.flag === "low" || r.flag === "high" ? r.flag : null, status: "final",
    });
  }
  for (const t of Array.isArray(panel?.pending_known) ? panel.pending_known : []) {
    if (date && typeof t === "string") out.rows.push({ date, panel: null, test: t, value: "", unit: null, refLow: null, refHigh: null, flag: null, status: "pending" });
  }
  for (const p of Array.isArray(j?.prior_values_for_trends) ? j.prior_values_for_trends : []) {
    for (const [d, v] of Array.isArray(p?.points) ? p.points : []) {
      if (isISODate(d) && d !== date && p.test) out.rows.push({ date: d, panel: null, test: String(p.test), value: String(v), unit: null, refLow: null, refHigh: null, flag: null, status: "final" });
    }
  }
  const ctx = j?.cycle_context;
  if (ctx) {
    if (isISODate(ctx.loss_date)) out.lossDate = ctx.loss_date;
    if (isISODate(ctx.home_pregnancy_test_negative)) out.negativeTest = ctx.home_pregnancy_test_negative;
    for (const [k, v] of Object.entries(ctx)) {
      const m = k.match(/^hcg_(\d{4}-\d{2}-\d{2})$/);
      if (m && Number.isFinite(Number(v))) out.rows.push({ date: m[1], panel: "Reproductive", test: "hCG", value: String(v), unit: "mIU/mL", refLow: null, refHigh: null, flag: null, status: "final" });
    }
    for (const e of Array.isArray(ctx.events) ? ctx.events : []) {
      if (!isISODate(e?.date)) continue;
      const text = [e.type?.replace(/_/g, " "), e.value !== undefined ? `${e.value}${e.unit ? ` ${e.unit}` : ""}` : "", e.note, e.interpretation ? `(${e.interpretation})` : ""].filter(Boolean).join(": ").replace(/: \(/, " (");
      out.evidence.push({ date: e.date, kind: "event", text });
    }
  }
  const pred = j?.ovulation_prediction;
  if (pred && isISODate(pred.as_of)) {
    const scen = (Array.isArray(pred.scenarios) ? pred.scenarios : [])
      .map((s: any) => `${s.label} (${s.likelihood}): ovulation ${s.ovulation_window?.join(" to ")}. ${s.rationale ?? ""}`)
      .join(" ");
    const rules = (Array.isArray(pred.update_rules) ? pred.update_rules : []).map((r: any) => `${r.signal} → ${r.effect}`).join("; ");
    out.evidence.push({ date: pred.as_of, kind: "analysis", text: `Outside analysis. ${scen} ${pred.confidence_note ?? ""} Update rules: ${rules}`.slice(0, 2000) });
  }
  const interp = j?.interpretation?.headline;
  if (date && typeof interp === "string") out.evidence.push({ date, kind: "analysis", text: interp });
  if (!out.rows.length && !out.evidence.length) out.warnings.push("Nothing recognisable in this JSON.");
  return out;
}

/** Pick the right reader for a pasted text or a file's text. */
export function parseLabText(text: string, fallbackDate: string | null = null): LabImport {
  const t = text.trim();
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      return parseLabJson(JSON.parse(t));
    } catch {
      const out = empty();
      out.warnings.push("That JSON couldn't be read.");
      return out;
    }
  }
  if (/^[^\n]*\btest\b[^\n]*,/i.test(t) && t.split("\n")[0].includes(",")) return parseLabCsv(t);
  return parseLabLines(t, fallbackDate);
}
