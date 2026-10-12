import type { Item } from "../phases";

export type { Item };
export type SizeTheme = "fruit" | "object" | "animal";

export interface SizeRef {
  /** "a lentil" — reads after "about the size of". */
  name: string;
  /** Key into the illustration map for its theme. */
  art: string;
}

/**
 * One week of the pregnancy guide. Week N means N weeks + 0–6 days since the last period.
 * Week-specific lists are short; the trimester pools in common.ts are mixed in on screen.
 */
export interface WeekContent {
  week: number;
  /** One sentence that sums up the week. */
  headline: string;
  size: Record<SizeTheme, SizeRef>;
  baby: Item[];
  body: Item[];
  mind: Item[];
  care: { food?: Item[]; movement?: Item[]; rest?: Item[] };
  watchouts: Item[];
  todo: Item[];
  partner: Item[];
  /** One line per day of the week (day 0–6), so every day brings something new. */
  days: [string, string, string, string, string, string, string];
}

/** The in-depth layer for a week: long-form explainers, FAQs and decisions coming up. */
export interface WeekDeep {
  /** What's happening with the baby and how it works. Paragraphs separated by blank lines. */
  baby: string;
  /** What your body and hormones are doing, and why symptoms happen. */
  body: string;
  faq: { q: string; a: string }[];
  decisions?: Item[];
}
