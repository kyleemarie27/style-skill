import { T1 } from "./t1";
import { T2 } from "./t2";
import { T3 } from "./t3";
import type { WeekContent } from "./types";

export { CALL_NOW, FIRST_VISIT, TRIMESTERS } from "./common";
export type { SizeRef, SizeTheme, WeekContent } from "./types";

export const WEEKS: WeekContent[] = [...T1, ...T2, ...T3];
export const FIRST_WEEK = WEEKS[0].week;
export const LAST_WEEK = WEEKS[WEEKS.length - 1].week;

/** The guide for a week, clamped to the weeks we have (4–42). */
export function weekContent(week: number): WeekContent {
  const w = Math.max(FIRST_WEEK, Math.min(LAST_WEEK, week));
  return WEEKS.find((x) => x.week === w)!;
}

export const trimesterOf = (week: number): 1 | 2 | 3 => (week < 14 ? 1 : week < 28 ? 2 : 3);
