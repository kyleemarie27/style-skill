import { useMemo } from "react";
import { localToday } from "../../shared/dates";
import { activePregnancy, gestation, pregnancyFlags } from "../../shared/pregnancy";
import type { Pregnancy } from "../../shared/types";
import { weekContent } from "../content/pregnancy";
import { useStore } from "./store";

/** The active pregnancy plus today's gestational age, guide and warning flags. */
export function usePregnancy() {
  const { settings, dayLogs } = useStore();
  const preg = activePregnancy(settings);
  const today = localToday();
  return useMemo(() => {
    if (!preg) return null;
    const g = gestation(today, preg);
    return { preg, today, g, week: weekContent(g.weeks), flags: pregnancyFlags(dayLogs, preg, today) };
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
