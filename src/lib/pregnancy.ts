import { useMemo } from "react";
import { addDays, localToday } from "../../shared/dates";
import { activePregnancy, gestation, pregnancyFlags, type Gestation } from "../../shared/pregnancy";
import { bodyTimeline, type BodyTimeline } from "../../shared/scans";
import type { DayLog, Pregnancy } from "../../shared/types";
import { weekContent } from "../content/pregnancy";
import { useStore } from "./store";

export interface Timeline {
  /** The one Today follows. "body" only when a scan gives an age. */
  view: "dates" | "body";
  /** The medical timeline (last period, or the due date your doctor or a dating scan set). */
  dates: Gestation;
  /** Where development measured on your scans, if any scan gives an age. */
  body: (BodyTimeline & { g: Gestation }) | null;
  /** The due date the shown timeline counts from (for week start dates). Not the medical due date. */
  countFrom: string;
}

/**
 * The active pregnancy plus today's gestational age, guide and warning flags.
 * `g` and `week` follow the chosen timeline; warnings, the schedule and the due date always use the
 * medical dates.
 */
export function usePregnancy() {
  const { settings, dayLogs } = useStore();
  const preg = activePregnancy(settings);
  const today = localToday();
  return useMemo(() => {
    if (!preg) return null;
    const dates = gestation(today, preg);
    const b = bodyTimeline(preg);
    const body = b ? { ...b, g: gestation(today, { dueDate: b.dueDate }) } : null;
    const view = preg.timeline === "body" && body ? "body" : "dates";
    const g = view === "body" ? body!.g : dates;
    const timeline: Timeline = { view, dates, body, countFrom: view === "body" ? body!.dueDate : preg.dueDate };
    return { preg, today, g, timeline, week: weekContent(g.weeks), flags: pregnancyFlags(dayLogs, preg, today) };
  }, [preg, today, dayLogs]);
}

/** Save a change to the pregnancy object (questions, appointments, due date...). */
export function useSavePregnancy() {
  const { settings, setSettings } = useStore();
  return (patch: Partial<Pregnancy> | null) =>
    setSettings({
      ...settings,
      ttc: patch === null ? settings.ttc : false,
      pregnancy: patch === null ? null : ({ ...settings.pregnancy, ...patch } as Pregnancy),
    });
}

export const newId = () => Math.random().toString(36).slice(2, 10);

/** Per-viewer conveniences (theme, checked to-dos). Storage may be unavailable. */
export function readLocal<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}
export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode etc. */
  }
}

/** Symptom names logged in the last week, including nausea, spotting and cramping from the pregnancy fields. */
export function recentSymptoms(logs: DayLog[], today: string, days = 7): string[] {
  const since = addDays(today, -(days - 1));
  const seen = new Set<string>();
  for (const l of logs) {
    if (l.date < since || l.date > today) continue;
    for (const s of l.symptoms ?? []) seen.add(s);
    if (l.preg?.nausea && l.preg.nausea !== "none") seen.add("Nausea");
    if (l.preg?.bleeding && l.preg.bleeding !== "none") seen.add("Spotting");
    if (l.preg?.pain && l.preg.pain !== "none") seen.add("Cramping");
  }
  return [...seen];
}
