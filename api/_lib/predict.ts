import { createHash } from "node:crypto";
import { buildModel, phaseFor, type CycleModel } from "../../shared/cycle.js";
import { addDays, diffDays, isISODate } from "../../shared/dates.js";
import { lhPattern } from "../../shared/lhPattern.js";
import { sameCall, type Confidence, type OvState, type PredPhase, type Prediction, type PredictionHistoryItem } from "../../shared/prediction.js";
import { DEFAULT_SETTINGS, type DayLog, type LhTest, type Settings } from "../../shared/types.js";
import type { WearableDay } from "../../shared/wearable.js";
import { askJson, fakeAi } from "./claude.js";
import { getPool, q } from "./db.js";
import { DAY_COLS } from "./rows.js";

/** Bump when the prompt or the facts change, so the next open re-predicts. */
const VERSION = "p1";

const SYSTEM = `You keep the fertility prediction for one person's private cycle tracker. She recently had a pregnancy loss and her body is resetting, so her cycle may not follow her old pattern. Your job is to read ALL the evidence and give one honest, current prediction. Think like a reproductive endocrinologist reading a chart.

Weigh the evidence:
- Objective signals carry the most weight: lab results (progesterone > 3 ng/mL after a surge confirms ovulation; low progesterone with mid-range estradiol means follicular, not yet ovulated; hCG should fall to < 5 after a loss), a sustained temperature rise (3+ nights above her recent low, ignoring nights she notes alcohol or illness), LH strips read against her own baseline (a clear rise from her quiet level matters more than the strip's fixed "Peak" line; a rise that fades without a temperature rise was likely a false start), cervical mucus (egg-white means ovulation within ~1–3 days), a period starting.
- Her notes and any outside analysis (kind "analysis") are useful context and hypotheses, not verdicts. Use them, but let the data decide when they disagree.
- Her history (average cycle, usual ovulation day, luteal length) is a prior. After a loss it is weaker than current data. After a false start, a new follicle usually needs about 10–14 days.

Give:
- phase: where she is now (menstrual, follicular, ovulation, luteal, unknown).
- ovulation: "not_yet", "likely_happened" (strong signs but not confirmed) or "confirmed" (temperature rise held, or progesterone > 3).
- likelyStart / likelyEnd: the most likely ovulation window (YYYY-MM-DD), 3–7 days wide unless the evidence is very sharp. If ovulation already happened, the window it happened in. If not yet, it can't start before today.
- backupStart / backupEnd: a second window only if a real alternative scenario is in play; otherwise "".
- confidence: low, medium or high.
- ovulationDate: the day it happened when confirmed or likely_happened; otherwise "".
- periodStart / periodEnd: the expected next period range (ovulation + her luteal length, as a range); "" if it can't be estimated yet.
- change: if there's a previous prediction, one short sentence on what changed and which new evidence caused it (e.g. "Moved later: the new progesterone result shows no ovulation yet."). "" if nothing meaningful changed.
- reason: one short sentence naming the main evidence behind this prediction.
- today: one concrete thing to do today (under 70 characters), e.g. "Test LH twice, noon–6pm" or "Have sex today or tomorrow".
- flag: a gentle note only if a doctor should hear about something (e.g. no ovulation by a date the evidence makes concerning); otherwise "".

Stability matters: if nothing new arrived since the previous prediction ("newSincePrevious" is empty), keep the same windows and confidence unless the passage of time itself changes things (e.g. she has moved into the window, or a window passed with no surge). Don't swing on one noisy reading. Never promise pregnancy. Plain words, no jargon in change/reason/today.`;

export const PREDICT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["phase", "ovulation", "likelyStart", "likelyEnd", "backupStart", "backupEnd", "confidence", "ovulationDate", "periodStart", "periodEnd", "change", "reason", "today", "flag"],
  properties: {
    phase: { type: "string", enum: ["menstrual", "follicular", "ovulation", "luteal", "unknown"] },
    ovulation: { type: "string", enum: ["not_yet", "likely_happened", "confirmed"] },
    likelyStart: { type: "string" },
    likelyEnd: { type: "string" },
    backupStart: { type: "string" },
    backupEnd: { type: "string" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    ovulationDate: { type: "string" },
    periodStart: { type: "string" },
    periodEnd: { type: "string" },
    change: { type: "string" },
    reason: { type: "string" },
    today: { type: "string" },
    flag: { type: "string" },
  },
};

interface Stored extends Prediction {
  keys: string[];
}

interface Loaded {
  settings: Settings;
  logs: DayLog[];
  lh: LhTest[];
  wearable: WearableDay[];
  evidence: { id: number; date: string; kind: string; text: string }[];
  labs: { id: number; date: string; panel: string | null; test: string; value_num: number | null; value_text: string | null; unit: string | null; status: string }[];
}

async function load(): Promise<Loaded> {
  const [s, d, l, w, e, lb] = await Promise.all([
    q<{ value: Settings }>("SELECT value FROM settings WHERE key='main'"),
    q<DayLog>(`SELECT ${DAY_COLS} FROM day_logs ORDER BY date`),
    q<LhTest>("SELECT date, taken_at, ratio, level FROM lh_tests ORDER BY date, id"),
    q<WearableDay>(`SELECT date, temp_dev AS "tempDev", rhr, hrv FROM wearable_days WHERE date > now() - interval '400 days' ORDER BY date`),
    q<Loaded["evidence"][number]>("SELECT id, date, kind, text FROM evidence ORDER BY date, id"),
    q<Loaded["labs"][number]>("SELECT id, date, panel, test, value_num, value_text, unit, status FROM lab_results ORDER BY date, id"),
  ]);
  return {
    settings: { ...DEFAULT_SETTINGS, ...(s.rows[0]?.value ?? {}) },
    logs: d.rows, lh: l.rows, wearable: w.rows, evidence: e.rows, labs: lb.rows,
  };
}

/** Every piece of evidence as a short stable key, to see what's new since the last prediction. */
function evidenceKeys(data: Loaded, model: CycleModel, today: string): string[] {
  const since = addDays(today, -75);
  const keys: string[] = [];
  for (const l of data.logs) {
    if (l.date < since) continue;
    const bits = [l.flow && l.flow !== "none" ? `flow ${l.flow}` : "", l.cervical_mucus ? `mucus ${l.cervical_mucus}` : "", l.pregnancy_test ? `pregnancy test ${l.pregnancy_test}` : "", l.ovulation ? "marked ovulation" : ""].filter(Boolean);
    if (bits.length) keys.push(`${l.date}: ${bits.join(", ")}`);
  }
  for (const t of data.lh) if (t.date >= since) keys.push(`${t.date}: LH ${t.ratio ?? t.level}`);
  for (const n of model.wearable) if (n.date >= since && n.tempDev !== null) keys.push(`${n.date}: temp ${n.tempDev}`);
  for (const e of data.evidence) keys.push(`${e.date}: ${e.kind} #${e.id}: ${e.text.slice(0, 160)}`);
  for (const lb of data.labs) keys.push(`${lb.date}: lab ${lb.test} ${lb.value_num ?? lb.value_text ?? ""} ${lb.unit ?? ""}${lb.status === "pending" ? " (pending)" : ""}`.trim());
  const ended = data.settings.pregnancy?.ended;
  if (ended) keys.push(`pregnancy ended ${ended.date} (${ended.reason})`);
  return keys;
}

/** The compact picture Claude reads: the cycle, the engine's computed facts, and every piece of evidence. */
function facts(data: Loaded, model: CycleModel, today: string) {
  const info = phaseFor(today, model);
  const c = info.cycle;
  const from = c ? c.start : addDays(today, -35);
  const lhHere = data.lh.filter((t) => t.date >= from);
  const pattern = lhPattern(lhHere);
  return {
    today,
    history: {
      averageCycleLength: model.avgCycleLength,
      averagePeriodLength: model.avgPeriodLength,
      averageLutealLength: model.avgLutealLength,
      usualOvulationCycleDay: model.typicalOvulationDay,
      recentCycles: model.cycles.filter((x) => !x.pregnancy).slice(-6).map((x) => ({ start: x.start, length: x.length, ovulationCycleDay: diffDays(x.ovulation, x.start) + 1, ovulationFrom: x.ovulationSource })),
    },
    pregnancyEnded: data.settings.pregnancy?.ended ?? null,
    currentCycle: c ? { start: c.start, cycleDay: info.cycleDay, periodEnded: c.periodEnd, firstCycleAfterLoss: c.firstAfterLoss } : null,
    lh: {
      yourBaseline: pattern.baseline,
      surgeLine: pattern.threshold,
      surgesFound: pattern.surges,
      readings: lhHere.map((t) => ({ date: t.date, time: t.taken_at, ratio: t.ratio, level: t.level })),
    },
    temperature: {
      nights: model.wearable.filter((n) => n.date >= from).map((n) => ({ date: n.date, deviationC: n.tempDev, restingHr: n.rhr })),
      sustainedRise: c?.tempShift ?? null,
    },
    logs: data.logs.filter((l) => l.date >= from).map(({ date, flow, cervical_mucus, intercourse, pregnancy_test, ovulation, notes, symptoms }) =>
      Object.fromEntries(Object.entries({ date, flow, cervical_mucus, intercourse, pregnancy_test, markedOvulation: ovulation, notes, symptoms }).filter(([, v]) => v != null && v !== false && !(Array.isArray(v) && !v.length)))),
    notesAndAnalyses: data.evidence.filter((e) => e.date >= addDays(today, -90)).map((e) => ({ date: e.date, kind: e.kind, text: e.text })),
    labs: data.labs.filter((x) => x.date >= addDays(today, -120)).map((x) => ({ date: x.date, panel: x.panel, test: x.test, value: x.value_num ?? x.value_text, unit: x.unit, status: x.status })),
  };
}

const iso = (v: unknown) => (typeof v === "string" && isISODate(v) ? v : null);

/** The engine's own estimate: used without AI, or if the AI call fails. */
export function enginePrediction(model: CycleModel, today: string): Omit<Prediction, "status" | "madeAt" | "change"> {
  const info = phaseFor(today, model);
  const ov = info.ovulation ?? addDays(today, 7);
  const confirmed = info.ovulationConfirmed && !!info.cycle?.tempShift;
  const past = ov < today;
  const phase: PredPhase = info.phase === "menstrual" ? "menstrual" : info.phase === "unknown" ? "unknown" : info.phase === "ovulation" ? "ovulation" : past ? "luteal" : "follicular";
  const start = confirmed ? addDays(ov, -1) : addDays(ov, -2);
  return {
    date: today,
    phase,
    ovulation: confirmed ? "confirmed" : "not_yet",
    likely: { start: past || confirmed ? start : start < today ? today : start, end: addDays(ov, confirmed ? 1 : 2) },
    backup: null,
    confidence: confirmed ? "high" : "low",
    ovulationDate: confirmed ? ov : null,
    period: info.nextPeriod ? { start: addDays(info.nextPeriod, -1), end: addDays(info.nextPeriod, 1) } : null,
    reason: confirmed ? "Your temperature rose and held, which confirms ovulation." : "Based on your usual timing; add strips and check-ins to sharpen it.",
    today: phase === "follicular" ? "Test LH once a day" : phase === "luteal" ? "Nothing to time today" : "Rest; nothing to time today",
    flag: "",
    by: "engine",
  };
}

async function aiPrediction(data: Loaded, model: CycleModel, today: string, previous: Stored | null, fresh: string[]) {
  const out = await askJson<Record<string, string>>({
    system: SYSTEM,
    effort: "medium",
    maxTokens: 4000,
    schema: PREDICT_SCHEMA,
    content: [{
      type: "text",
      text: JSON.stringify({
        ...facts(data, model, today),
        previousPrediction: previous ? {
          madeAt: previous.madeAt, phase: previous.phase, ovulation: previous.ovulation, likely: previous.likely, backup: previous.backup,
          confidence: previous.confidence, ovulationDate: previous.ovulationDate, period: previous.period, reason: previous.reason,
        } : null,
        newSincePrevious: previous ? fresh : "first prediction",
      }),
    }],
  });
  const likelyStart = iso(out.likelyStart);
  const likelyEnd = iso(out.likelyEnd);
  if (!likelyStart || !likelyEnd) throw new Error("Prediction came back without a window");
  const ovulation = (["not_yet", "likely_happened", "confirmed"].includes(out.ovulation) ? out.ovulation : "not_yet") as OvState;
  const pred: Omit<Prediction, "status" | "madeAt"> = {
    date: today,
    phase: (["menstrual", "follicular", "ovulation", "luteal", "unknown"].includes(out.phase) ? out.phase : "unknown") as PredPhase,
    ovulation,
    likely: likelyStart <= likelyEnd ? { start: likelyStart, end: likelyEnd } : { start: likelyEnd, end: likelyStart },
    backup: iso(out.backupStart) && iso(out.backupEnd) ? { start: out.backupStart, end: out.backupEnd } : null,
    confidence: (["low", "medium", "high"].includes(out.confidence) ? out.confidence : "low") as Confidence,
    ovulationDate: ovulation === "not_yet" ? null : iso(out.ovulationDate),
    period: iso(out.periodStart) && iso(out.periodEnd) ? { start: out.periodStart, end: out.periodEnd } : null,
    change: String(out.change ?? "").slice(0, 220),
    reason: String(out.reason ?? "").slice(0, 220),
    today: String(out.today ?? "").slice(0, 90),
    flag: String(out.flag ?? "").slice(0, 220),
    by: "ai",
  };
  return pred;
}

/** Guardrails that hold whatever the reasoning says. */
export function guard(p: Omit<Prediction, "status" | "madeAt">, model: CycleModel, today: string): Omit<Prediction, "status" | "madeAt"> {
  const info = phaseFor(today, model);
  const shift = info.cycle?.tempShift;
  // A temperature rise that held is a hard fact: ovulation happened, the day before the first warm night.
  if (shift && p.ovulation !== "confirmed") {
    p = { ...p, ovulation: "confirmed", ovulationDate: shift.ovulation, likely: { start: addDays(shift.ovulation, -1), end: addDays(shift.ovulation, 1) }, confidence: "high" };
  }
  // Not yet ovulated: the window can't sit in the past.
  if (p.ovulation === "not_yet" && p.likely.start < today) {
    const width = Math.max(2, diffDays(p.likely.end, p.likely.start));
    p = { ...p, likely: { start: today, end: p.likely.end > today ? p.likely.end : addDays(today, width) } };
  }
  return p;
}

const fingerprint = (keys: string[], today: string) => createHash("sha256").update(VERSION + "|" + today + "|" + keys.join("\n")).digest("hex");

function toHistory(p: Prediction): PredictionHistoryItem {
  return { madeAt: p.madeAt, date: p.date, likely: p.likely, ovulation: p.ovulation, confidence: p.confidence, change: p.change, status: p.status };
}

async function latest(): Promise<Stored | null> {
  const { rows } = await q<{ content: Stored }>("SELECT content FROM predictions ORDER BY id DESC LIMIT 1");
  return rows[0]?.content ?? null;
}

export async function predictionHistory(): Promise<PredictionHistoryItem[]> {
  const { rows } = await q<{ content: Stored }>("SELECT content FROM predictions ORDER BY id DESC LIMIT 30");
  return rows.map((r) => toHistory(r.content));
}

/**
 * Today's prediction. Re-predicts on the first open of a day and whenever the evidence changed
 * since the last one; otherwise returns the saved one. Only one runs at a time.
 */
export async function predict(today: string, force = false): Promise<{ prediction: Prediction; history: PredictionHistoryItem[]; fresh: boolean }> {
  const data = await load();
  const model = buildModel(data.logs, data.lh, data.settings, data.wearable);
  const keys = evidenceKeys(data, model, today);
  const fp = fingerprint(keys, today);
  const prev = await latest();
  const { rows: same } = await q<{ id: number }>("SELECT id FROM predictions WHERE fingerprint=$1 ORDER BY id DESC LIMIT 1", [fp]);
  if (prev && same[0] && !force) return { prediction: stripKeys(prev), history: await predictionHistory(), fresh: false };

  const client = await getPool().connect();
  try {
    const { rows: lock } = await client.query<{ ok: boolean }>("SELECT pg_try_advisory_lock(727276) AS ok");
    if (!lock[0].ok) {
      if (prev) return { prediction: stripKeys(prev), history: await predictionHistory(), fresh: false };
    }
    try {
      const prevKeys = new Set(prev?.keys ?? []);
      const freshKeys = keys.filter((k) => !prevKeys.has(k));
      let made: Omit<Prediction, "status" | "madeAt">;
      try {
        if (fakeAi()) throw new Error("fake AI");
        made = await aiPrediction(data, model, today, prev, freshKeys);
      } catch (e) {
        if (!fakeAi()) console.error(`Prediction fell back to the engine: ${(e as Error).message}`);
        made = { ...enginePrediction(model, today), change: "" };
      }
      made = guard(made, model, today);
      const status: Prediction["status"] = !prev ? "new" : sameCall(prev, made) ? "stable" : "adjusted";
      const pred: Stored = { ...made, change: status === "adjusted" ? made.change : "", status, madeAt: new Date().toISOString(), keys };
      await q("INSERT INTO predictions (date, fingerprint, content) VALUES ($1,$2,$3)", [today, fp, JSON.stringify(pred)]);
      return { prediction: stripKeys(pred), history: await predictionHistory(), fresh: true };
    } finally {
      if (lock[0].ok) await client.query("SELECT pg_advisory_unlock(727276)");
    }
  } finally {
    client.release();
  }
}

function stripKeys(p: Stored): Prediction {
  const { keys: _k, ...rest } = p;
  return rest;
}
