import type { LhLevel } from "./types.js";

/**
 * Premom-style LH scale: the reading is the test-line / control-line intensity ratio (T/C).
 *   Low  < 0.5        – little LH
 *   High 0.5 – 0.99   – LH rising
 *   Peak ≥ 1.0        – test line as dark as or darker than control: surge, ovulation likely in ~24–36h
 * Change these thresholds in one place if you want them tighter or looser.
 */
export const LH_BANDS = { high: 0.5, peak: 1.0 } as const;

export function levelForRatio(ratio: number): LhLevel {
  if (ratio >= LH_BANDS.peak) return "peak";
  if (ratio >= LH_BANDS.high) return "high";
  return "low";
}

/**
 * Premom exports and screenshots sometimes show the ratio as a percentage (e.g. 85 or "85%")
 * or as 0–1.x. Bring everything onto the 0–1.x ratio scale.
 */
export function normalizeRatio(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).replace("%", "").trim();
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  const ratio = n > 3 ? n / 100 : n;
  return Math.round(ratio * 100) / 100;
}

export function levelFromText(raw: unknown): LhLevel | null {
  const s = String(raw ?? "").toLowerCase();
  if (!s) return null;
  if (s.includes("peak") || s.includes("positive") || s === "+") return "peak";
  if (s.includes("high")) return "high";
  if (s.includes("low") || s.includes("negative") || s === "-") return "low";
  return null;
}

export const LH_LABEL: Record<LhLevel, string> = { low: "Low", high: "High", peak: "Peak" };
