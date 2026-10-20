import { T1 } from "./t1";
import { T2 } from "./t2";
import { T3 } from "./t3";
import { DEEP_T1 } from "./deep1";
import { DEEP_T2 } from "./deep2";
import { DEEP_T3 } from "./deep3";
import type { WeekContent, WeekDeep } from "./types";

export { CALL_NOW, FIRST_VISIT, TRIMESTERS } from "./common";
export type { SizeRef, SizeTheme, WeekContent, WeekDeep } from "./types";
export * from "./library";

export const DEEP: Record<number, WeekDeep> = { ...DEEP_T1, ...DEEP_T2, ...DEEP_T3 };

/** The in-depth layer for a week, clamped like weekContent. */
export function weekDeep(week: number): WeekDeep {
  return DEEP[Math.max(4, Math.min(42, week))];
}

export const WEEKS: WeekContent[] = [...T1, ...T2, ...T3];
export const FIRST_WEEK = WEEKS[0].week;
export const LAST_WEEK = WEEKS[WEEKS.length - 1].week;

/** The guide for a week, clamped to the weeks we have (4–42). */
export function weekContent(week: number): WeekContent {
  const w = Math.max(FIRST_WEEK, Math.min(LAST_WEEK, week));
  return WEEKS.find((x) => x.week === w)!;
}

export { trimesterOf } from "./bites";

export { CHANGES, changesAt, type Change, type ChangeNow, type ChangeStatus } from "./changes";
export { HABITS, MILESTONES, dailyTodos, nextMilestone, type DailyTodo } from "./bites";
export { MOMENTS, PARTNER_MOMENTS, PARTNER_QUESTIONS, QUESTIONS, todaysPrompt, type Prompt } from "./journal";
export { HOW_TO_HELP, PARTNER_DAILY, PARTNER_FEELINGS, fillName, moodsOf, partnerFeeling, partnerItems, partnerMove } from "./partner";
