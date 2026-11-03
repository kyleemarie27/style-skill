import { addDays, isISODate } from "./dates.js";
import { gestation, TERM_DAYS } from "./pregnancy.js";
import type { Pregnancy, Scan } from "./types.js";

/**
 * Reading ultrasound results. Pure functions, shared by the app and the API.
 *
 * Dating follows ACOG Committee Opinion 700 ("Methods for estimating the due date"):
 * - Crown-to-rump length (CRL) before 14 weeks is the most accurate way to date a pregnancy.
 *   The due date changes only if it differs from the current one by more than 5 days before
 *   9w0d, or more than 7 days from 9w0d to 13w6d.
 * - The gestational sac alone isn't used to change a due date; dating waits for a CRL.
 * - Once a pregnancy is dated by an early scan, later scans don't change the due date: a later
 *   difference is about growth, which is the doctor's to interpret.
 *
 * Checks never diagnose. Each measurement is "typical" for the stage, "info" (good to know,
 * often just early), or "ask" (worth raising at the next visit). Nothing here says something is
 * wrong; the care team reads the whole picture, often with a repeat scan.
 */

/** Days of gestation from mean sac diameter: about MSD (mm) + 30 days. Rough; used only as context. */
export const daysFromMsd = (msd: number) => Math.round(msd + 30);

/** Days of gestation from crown-to-rump length (Robinson & Fleming): 8.052·√CRL + 23.73. */
export const daysFromCrl = (crl: number) => Math.round(8.052 * Math.sqrt(crl) + 23.73);

/** Mean sac diameter from the three dimensions on a report (e.g. 10 × 12 × 8 mm → 10). */
export const meanOf = (dims: number[]) => Math.round((dims.reduce((a, b) => a + b, 0) / dims.length) * 10) / 10;

export type AgeMethod = "crl" | "report" | "msd";

/** The best age estimate the scan gives, in total days, and what it's based on. */
export function scanAge(s: Scan): { days: number; method: AgeMethod } | null {
  if (s.crl && s.crl >= 2 && s.crl <= 84) return { days: daysFromCrl(s.crl), method: "crl" };
  if (s.reportedDays && s.reportedDays > 20) return { days: s.reportedDays, method: "report" };
  if (s.msd && s.msd >= 2 && s.msd <= 30) return { days: daysFromMsd(s.msd), method: "msd" };
  return null;
}

export const fmtDays = (d: number) => `${Math.floor(d / 7)}w ${d % 7}d`;

export interface DatingRead {
  /** Gestational age on the scan date by the current due date. */
  expectedDays: number;
  measuredDays: number | null;
  method: AgeMethod | null;
  /** measured − expected: negative means measuring behind. */
  diff: number | null;
  /** What to do about the due date. */
  verdict: "redate" | "keep" | "wait" | "growth" | "none";
  /** The due date the scan points to, when verdict is "redate". */
  suggestedDue: string | null;
  /** One or two plain sentences about the dating. */
  text: string;
}

/** Earlier scans that dated this pregnancy by CRL (so later ones never redate). */
const datedEarlier = (preg: Pregnancy, s: Scan) =>
  (preg.scans ?? []).some((x) => x.id !== s.id && x.date < s.date && x.crl && x.crl <= 84);

export function readDating(s: Scan, preg: Pregnancy): DatingRead {
  const expectedDays = gestation(s.date, preg).totalDays;
  const age = scanAge(s);
  const base = { expectedDays, measuredDays: age?.days ?? null, method: age?.method ?? null, suggestedDue: null };
  const growth = preg.datedBy !== s.id && (expectedDays >= 14 * 7 || preg.dueDateSource === "scan" || datedEarlier(preg, s));
  if (!age && growth) {
    return { ...base, diff: null, verdict: "growth", text: `You were ${fmtDays(expectedDays)} at this scan. Your due date stays the same: later measurements are about growth, and your doctor reads them in context.` };
  }
  if (!age) {
    return { ...base, diff: null, verdict: "none", text: `By your due date you were ${fmtDays(expectedDays)} at this scan.` };
  }
  const diff = age.days - expectedDays;
  const gap = Math.abs(diff);
  const how = gap <= 1
    ? "right on your current dates"
    : `${gap} day${gap === 1 ? "" : "s"} ${diff < 0 ? "behind" : "ahead of"} your current dates`;
  const measured = `Measured ${fmtDays(age.days)} ${age.method === "crl" ? "by baby's length (CRL)" : age.method === "msd" ? "by the size of the sac" : "on the report"}, ${how}.`;

  if (preg.datedBy === s.id) {
    return { ...base, diff, verdict: "keep", text: `${measured} This scan set your due date.` };
  }
  if (growth) {
    return {
      ...base, diff, verdict: "growth",
      text: `${measured} Your due date stays the same: after an early dating scan, later measurements are about growth, and your doctor reads them in context.`,
    };
  }
  if (age.method !== "crl") {
    return {
      ...base, diff, verdict: "wait",
      text: `${measured} Doctors don't change a due date from the sac alone. They wait until baby's length can be measured, usually at the next scan.${diff < -3 ? " Measuring a little behind period dates is very common, especially if you ovulated later than day 14." : ""}`,
    };
  }
  const limit = expectedDays < 9 * 7 ? 5 : 7;
  if (gap > limit) {
    const suggestedDue = addDays(s.date, TERM_DAYS - age.days);
    return {
      ...base, diff, verdict: "redate", suggestedDue,
      text: `${measured} That's more than the ${limit}-day difference doctors use to update a due date at this stage, so yours will likely move. This is about dating, not a sign anything is wrong.`,
    };
  }
  return {
    ...base, diff, verdict: "keep",
    text: `${measured} That's within the ${limit} days doctors allow at this stage, so your due date stays the same.`,
  };
}

export type CheckStatus = "typical" | "info" | "ask";
export interface Check {
  label: string;
  value: string;
  status: CheckStatus;
  note: string;
}

/** Heart rate bands by gestational day: below `low` or above `high` is worth asking about. */
function fhrBand(days: number): { low: number; high: number; typical: string } {
  if (days < 45) return { low: 80, high: 190, typical: "early heartbeats often start around 90–120 bpm and climb quickly" };
  if (days < 50) return { low: 100, high: 190, typical: "about 100–130 bpm, rising every day" };
  if (days < 63) return { low: 110, high: 195, typical: "about 120–170 bpm, still climbing" };
  if (days < 14 * 7) return { low: 120, high: 190, typical: "about 140–180 bpm (it peaks around 9–10 weeks)" };
  return { low: 110, high: 165, typical: "about 110–160 bpm" };
}

/** Plain-language checks on what the scan saw and measured, for the stage it was taken at. */
export function scanChecks(s: Scan, preg: Pregnancy): Check[] {
  const out: Check[] = [];
  const age = scanAge(s);
  const days = age?.days ?? gestation(s.date, preg).totalDays;

  if (s.intrauterine === true) out.push({ label: "Location", value: "In the uterus", status: "typical", note: "This is where a pregnancy should be, which rules out the most important early worry (an ectopic pregnancy)." });
  if (s.intrauterine === false) out.push({ label: "Location", value: "Not confirmed in the uterus", status: "ask", note: "Follow your care team's plan closely, and get same-day care for one-sided pain, shoulder-tip pain, dizziness or heavy bleeding." });

  if (s.msd) out.push({ label: "Gestational sac", value: `${s.msd} mm`, status: "info", note: "The sac grows about 1 mm a day early on. Its size is a rough guide to age; baby's length is used for dating once it can be measured." });

  if (s.yolkSacSeen === true || s.yolkSac) {
    const big = !!s.yolkSac && s.yolkSac > 6;
    out.push({
      label: "Yolk sac", value: s.yolkSac ? `${s.yolkSac} mm` : "Seen",
      status: big ? "ask" : "typical",
      note: big ? "A little larger than the usual 3–6 mm. Often it means nothing on its own; your doctor will look at it alongside everything else." : "It feeds the embryo until the placenta takes over. Seeing it is a good early sign.",
    });
  }

  if (s.embryoSeen === false && !s.crl) {
    const early = !s.msd || s.msd < 16;
    out.push({
      label: "Embryo", value: "Not seen yet",
      status: early ? "info" : "ask",
      note: early
        ? "Very common at this size. The embryo usually becomes visible as the sac grows past about 16 mm, so a recheck in a week or two is the standard next step."
        : "Your care team will want to recheck. Follow the plan they gave you, and ask them anything that's on your mind.",
    });
  }
  if (s.crl) out.push({ label: "Baby's length (CRL)", value: `${s.crl} mm`, status: "typical", note: `That's about ${fmtDays(daysFromCrl(s.crl))}, the most accurate measure of age this early.` });

  if (s.fhr) {
    const b = fhrBand(days);
    const off = s.fhr < b.low || s.fhr > b.high;
    out.push({
      label: "Heartbeat", value: `${s.fhr} bpm`,
      status: off ? "ask" : "typical",
      note: off ? `Typical now is ${b.typical}. Heart rates vary and change fast this early; ask your doctor what they make of it and whether they'll recheck.` : `Right in range: ${b.typical}.`,
    });
  } else if (s.heartbeatSeen === true) {
    out.push({ label: "Heartbeat", value: "Seen", status: "typical", note: "A flicker of cardiac activity is one of the most reassuring early signs." });
  } else if (s.heartbeatSeen === false && (s.crl || s.embryoSeen)) {
    const early = !!s.crl && s.crl < 7;
    out.push({
      label: "Heartbeat", value: "Not seen yet",
      status: early ? "info" : "ask",
      note: early ? "With an embryo this small it can be too early to see. A recheck usually follows." : "Your care team will want to recheck. Follow the plan they gave you.",
    });
  }

  if (s.nt) {
    const high = s.nt >= 3;
    out.push({ label: "Nuchal translucency", value: `${s.nt} mm`, status: high ? "ask" : "typical", note: high ? "Above the usual cutoff of 3 mm. This is a screening number, not a diagnosis; your doctor will explain options, often combined with blood tests." : "Below the usual 3 mm cutoff." });
  }
  if (s.efwPercentile !== null && s.efwPercentile !== undefined) {
    const p = s.efwPercentile;
    const off = p < 10 || p > 90;
    out.push({
      label: "Estimated weight", value: `${s.efw ? `${s.efw} g, ` : ""}${p}th percentile`,
      status: off ? "ask" : "typical",
      note: off ? "Outside the 10th–90th percentile. Often that's just a smaller or bigger baby; your doctor may plan a follow-up scan to see the trend." : "Within the usual 10th–90th percentile range.",
    });
  } else if (s.efw) {
    out.push({ label: "Estimated weight", value: `${s.efw} g`, status: "info", note: "Weight estimates on ultrasound can be off by 10–15% either way; your doctor looks at the trend." });
  }
  for (const [k, label] of [["bpd", "Head width (BPD)"], ["hc", "Head circumference"], ["ac", "Belly circumference"], ["fl", "Thigh bone (FL)"]] as const) {
    if (s[k]) out.push({ label, value: `${s[k]} mm`, status: "info", note: "Used together to estimate size and weight." });
  }
  if (s.babies && s.babies > 1) out.push({ label: "Babies", value: String(s.babies), status: "info", note: "More than one! Your care team will talk about extra monitoring." });
  return out;
}

/** The headline for a scan, for Today and the Doctor tab. */
export function scanHeadline(s: Scan, preg: Pregnancy): string {
  const d = readDating(s, preg);
  const asks = scanChecks(s, preg).filter((c) => c.status === "ask").length;
  const size = d.measuredDays !== null ? `Measured ${fmtDays(d.measuredDays)}` : "Scan saved";
  return asks ? `${size} · ${asks} thing${asks === 1 ? "" : "s"} worth asking about` : `${size} · everything in the typical range for this stage`;
}

/** Latest scan first-class summary for the AI (daily note, plan, reads, Ask). */
export function scansForAi(preg: Pregnancy) {
  return (preg.scans ?? []).slice(-3).map((s) => {
    const d = readDating(s, preg);
    return {
      date: s.date,
      measured: d.measuredDays !== null ? fmtDays(d.measuredDays) : null,
      basedOn: d.method,
      vsDueDate: d.diff,
      dating: d.text,
      findings: scanChecks(s, preg).map((c) => `${c.label}: ${c.value} (${c.status === "ask" ? "worth asking the doctor" : c.status})`),
      followUp: s.followUp ?? null,
    };
  });
}

// ---- validation (shared by the API and the chat "save scan" button) ----

const num = (v: unknown, min: number, max: number) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 10) / 10 : null;
};
const bool = (v: unknown) => (typeof v === "boolean" ? v : null);
const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** Keep known fields with sane values. Returns null without a valid date or any content. */
export function cleanScan(raw: any, id?: string): Scan | null {
  if (!raw || typeof raw !== "object" || !isISODate(raw.date)) return null;
  const msd = num(raw.msd, 1, 60) ?? (Array.isArray(raw.sacDims) && raw.sacDims.length ? num(meanOf(raw.sacDims.map(Number).filter(Number.isFinite)), 1, 60) : null);
  const s: Scan = {
    id: text(raw.id, 40) ?? id ?? Math.random().toString(36).slice(2, 10),
    date: raw.date,
    msd,
    yolkSac: num(raw.yolkSac, 0.5, 15),
    crl: num(raw.crl, 0.5, 120),
    fhr: num(raw.fhr, 40, 250),
    nt: num(raw.nt, 0.2, 10),
    bpd: num(raw.bpd, 5, 120),
    hc: num(raw.hc, 20, 400),
    ac: num(raw.ac, 20, 450),
    fl: num(raw.fl, 2, 90),
    efw: num(raw.efw, 5, 6500),
    efwPercentile: num(raw.efwPercentile, 0, 100),
    intrauterine: bool(raw.intrauterine),
    yolkSacSeen: bool(raw.yolkSacSeen),
    embryoSeen: bool(raw.embryoSeen),
    heartbeatSeen: bool(raw.heartbeatSeen),
    babies: num(raw.babies, 1, 6),
    reportedDays: num(raw.reportedDays, 20, 300),
    reportedDue: isISODate(raw.reportedDue) ? raw.reportedDue : null,
    followUp: text(raw.followUp, 200),
    notes: text(raw.notes, 2000),
  };
  const kept = Object.fromEntries(Object.entries(s).filter(([, v]) => v !== null && v !== undefined)) as unknown as Scan;
  return Object.keys(kept).length > 2 ? kept : null;
}

// ---- reading pasted report text, instantly and without AI ----

const NUM = String.raw`(\d+(?:\.\d+)?)`;
const mm = (n: string, unit?: string) => Number(n) * (unit && /cm/i.test(unit) ? 10 : 1);

/**
 * Pull scan results out of the text of an ultrasound report, the way patient portals print them
 * ("Size 10.0 mm x 12.0 mm x 8.0 mm", "CRL 6.1 mm", "FHR 118 bpm", "Embryo: not visualized").
 * Returns raw fields for cleanScan, and how many it found; the app falls back to AI when few match.
 */
export function parseScanText(text: string, date: string): { raw: Record<string, unknown>; found: number } {
  // Text copied out of a screenshot can arrive as one long line: start a new line at each heading.
  const t = text.replace(/\r/g, "").replace(
    /\s+(?=(?:Gestational sac|Yolk sac|Embryo|Fetal pole|\bGS\b|\bCRL\b|\bFHR\b|Cardiac activity|Uterus|Right ovary|Left ovary|Cervix|Cul de sac|IMPRESSION|MATERNAL STRUCTURES|ASSESSMENT)\b)/gi,
    "\n",
  );
  const raw: Record<string, unknown> = { date };
  const pick = (re: RegExp) => t.match(re);
  const seen = (subject: string): boolean | undefined => {
    const m = t.match(new RegExp(`${subject}[^\\n:]*:?\\s*(not\\s+(?:visuali[sz]ed|seen|identified|present)|absent|visuali[sz]ed|seen|identified|present)`, "i"));
    return m ? !/^not|absent/i.test(m[1]) : undefined;
  };

  // Three dimensions on a line about the sac (or the line after its heading), never the uterus or an ovary.
  const lines = t.split("\n");
  for (let i = 0; i < lines.length && !raw.sacDims; i++) {
    const m = lines[i].match(new RegExp(`${NUM}\\s*(mm|cm)\\s*x\\s*${NUM}\\s*(?:mm|cm)?\\s*x\\s*${NUM}`, "i"));
    if (!m || /uterus|ovary|cervix/i.test(lines[i])) continue;
    if (/sac|\\bGS\\b/i.test(lines[i]) || /sac|\\bGS\\b/i.test(lines[i - 1] ?? "")) raw.sacDims = [mm(m[1], m[2]), mm(m[3], m[2]), mm(m[4], m[2])];
  }
  const dims = raw.sacDims;
  const msd = pick(new RegExp(`(?:\\bMSD\\b|mean sac diameter|\\bGS\\b)[:\\s]*${NUM}\\s*(mm|cm)`, "i"));
  if (msd && !dims) raw.msd = mm(msd[1], msd[2]);
  const crl = pick(new RegExp(`(?:\\bCRL\\b|crown[- ]rump(?: length)?)[:\\s]*${NUM}\\s*(mm|cm)`, "i"));
  if (crl) raw.crl = mm(crl[1], crl[2]);
  const ys = pick(new RegExp(`yolk sac[^\\n]{0,40}?${NUM}\\s*(mm|cm)`, "i"));
  if (ys) raw.yolkSac = mm(ys[1], ys[2]);
  const fhr = pick(/(?:\bFHR\b|fetal heart(?: rate| tones)?|heart rate|cardiac activity)[^\d\n]{0,25}(\d{2,3})\s*(?:bpm|beats)/i);
  if (fhr) raw.fhr = Number(fhr[1]);
  for (const [k, re] of [["nt", "\\bNT\\b|nuchal translucency"], ["bpd", "\\bBPD\\b"], ["hc", "\\bHC\\b|head circumference"], ["ac", "\\bAC\\b|abdominal circumference"], ["fl", "\\bFL\\b|femur length"]] as const) {
    const m = pick(new RegExp(`(?:${re})[:\\s]*${NUM}\\s*(mm|cm)`, "i"));
    if (m) raw[k] = mm(m[1], m[2]);
  }
  const efw = pick(/\bEFW\b[:\s]*(\d{2,4})\s*g/i);
  if (efw) raw.efw = Number(efw[1]);
  const pct = pick(/(\d{1,2})(?:st|nd|rd|th)?\s*(?:%ile|percentile)/i);
  if (pct && efw) raw.efwPercentile = Number(pct[1]);

  const ga = pick(/\b(\d{1,2})\s*w(?:ee)?k?s?\s*,?\s*(\d)\s*d(?:ays?)?\b/i);
  if (ga) raw.reportedDays = Number(ga[1]) * 7 + Number(ga[2]);
  const edd = pick(/\b(?:EDD|due date)[:\s]*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (edd) raw.reportedDue = `${edd[3]}-${edd[1].padStart(2, "0")}-${edd[2].padStart(2, "0")}`;

  if (/\bintrauterine\b/i.test(t) && !/\bno\s+intrauterine\b/i.test(t)) raw.intrauterine = true;
  const yolk = seen("yolk sac");
  if (yolk !== undefined) raw.yolkSacSeen = yolk;
  const embryo = seen("(?:embryo|fetal pole)");
  if (embryo !== undefined) raw.embryoSeen = embryo;
  const heart = seen("(?:cardiac activity|heart(?:beat| motion)|fetal heart)");
  if (heart !== undefined) raw.heartbeatSeen = heart;

  const fu = pick(/\b(?:return|recheck|repeat|follow[- ]?up)\b[^.\n]*?\bin\s+(\d+)\s*(days?|weeks?)/i);
  if (fu) raw.followUp = `Recheck in ${fu[1]} ${fu[2].toLowerCase()}`;

  return { raw, found: Object.keys(raw).length - 1 };
}

// ---- the body timeline: where development actually is, from the scans ----

export interface BodyTimeline {
  /** Days the body is ahead (+) or behind (−) the medical dates. */
  offset: number;
  /** The due date this timeline implies (for counting days only; the medical due date doesn't change). */
  dueDate: string;
  /** The scan it's based on, and how that scan measured age. */
  scan: Scan;
  method: AgeMethod;
}

const METHOD_RANK: Record<AgeMethod, number> = { crl: 3, report: 2, msd: 1 };

/**
 * A personal timeline for day-by-day content, separate from the medical dates. It follows the
 * most reliable first-trimester scan (baby's length beats the report's estimate beats the sac;
 * among equals, the newest), so every scan you add can move it. Scans from 14 weeks on are about
 * growth rather than age and are left out. Returns null when no scan gives an age.
 *
 * This never changes the due date: that still follows the ACOG rules in readDating.
 */
export function bodyTimeline(preg: Pregnancy): BodyTimeline | null {
  let best: { scan: Scan; method: AgeMethod; offset: number } | null = null;
  for (const s of preg.scans ?? []) {
    const age = scanAge(s);
    if (!age) continue;
    const expected = gestation(s.date, preg).totalDays;
    if (expected >= 14 * 7) continue;
    const better = !best || METHOD_RANK[age.method] > METHOD_RANK[best.method]
      || (METHOD_RANK[age.method] === METHOD_RANK[best.method] && s.date >= best.scan.date);
    if (better) best = { scan: s, method: age.method, offset: age.days - expected };
  }
  if (!best) return null;
  return { ...best, dueDate: addDays(preg.dueDate, -best.offset) };
}

/** The gestational age to write personal content for: the body timeline when there is one. */
export function personalGestation(date: string, preg: Pregnancy) {
  const body = bodyTimeline(preg);
  return gestation(date, body ? { dueDate: body.dueDate } : preg);
}

/** "6 days behind" / "2 days ahead of" / "in step with", for the timeline note. */
export function offsetPhrase(offset: number) {
  const n = Math.abs(offset);
  if (n === 0) return "in step with your dates";
  return `${n} day${n === 1 ? "" : "s"} ${offset < 0 ? "behind" : "ahead of"} your dates`;
}

/** What the AI needs to know about the two timelines. */
export function timelineForAi(date: string, preg: Pregnancy) {
  const body = bodyTimeline(preg);
  if (!body || body.offset === 0) return null;
  const g = gestation(date, { dueDate: body.dueDate });
  return {
    gestationalAgeByDates: fmtDays(gestation(date, preg).totalDays),
    gestationalAgeByBody: fmtDays(g.totalDays),
    basedOn: `${body.scan.date} scan (${body.method === "crl" ? "baby's length" : body.method === "msd" ? "sac size" : "the report's estimate"}), ${offsetPhrase(body.offset)}`,
    note: "Day-by-day personal content follows gestationalAgeByBody (where development measured). The due date, appointments and screening windows still follow gestationalAgeByDates. Measuring a few days off period dates is common (often later ovulation), not a problem.",
  };
}
