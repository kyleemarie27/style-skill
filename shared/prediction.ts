/**
 * Dynamic predictions. Every input is evidence; each morning, and whenever new evidence arrives,
 * Bloom re-reads all of it and posts one prediction: a date range (never a single day), how sure it
 * is, the phase, and whether it's stable or adjusted, with one sentence on what changed.
 */
export type PredPhase = "menstrual" | "follicular" | "ovulation" | "luteal" | "unknown";
export type Confidence = "low" | "medium" | "high";
export type OvState = "not_yet" | "likely_happened" | "confirmed";

export interface Prediction {
  /** The day this prediction is for. */
  date: string;
  phase: PredPhase;
  ovulation: OvState;
  /** Likely ovulation window (or, once it's happened, the window it happened in). */
  likely: { start: string; end: string };
  /** A second, less likely window, when one is genuinely in play. */
  backup: { start: string; end: string } | null;
  confidence: Confidence;
  /** The day ovulation happened, when confirmed or likely. */
  ovulationDate: string | null;
  /** Expected next period range. */
  period: { start: string; end: string } | null;
  /** One sentence: what changed since the last prediction. Empty when stable. */
  change: string;
  /** One sentence: the main evidence behind this prediction. */
  reason: string;
  /** One thing to do today. */
  today: string;
  /** A gentle medical note, when one is warranted. */
  flag: string;
  /** "new" (first one), "stable" or "adjusted" versus the previous prediction. */
  status: "new" | "stable" | "adjusted";
  /** When this prediction was made, and from what. */
  madeAt: string;
  by: "ai" | "engine";
}

export interface PredictionHistoryItem {
  madeAt: string;
  date: string;
  likely: { start: string; end: string };
  ovulation: OvState;
  confidence: Confidence;
  change: string;
  status: Prediction["status"];
}

/** Did anything a person would care about change between two predictions? */
export function sameCall(a: Pick<Prediction, "phase" | "ovulation" | "likely" | "confidence" | "backup">, b: Pick<Prediction, "phase" | "ovulation" | "likely" | "confidence" | "backup">): boolean {
  return (
    a.phase === b.phase && a.ovulation === b.ovulation && a.confidence === b.confidence &&
    a.likely.start === b.likely.start && a.likely.end === b.likely.end &&
    (a.backup?.start ?? "") === (b.backup?.start ?? "") && (a.backup?.end ?? "") === (b.backup?.end ?? "")
  );
}
