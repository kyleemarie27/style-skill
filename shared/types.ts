export type Flow = "none" | "spotting" | "light" | "medium" | "heavy";
export type Mucus = "dry" | "sticky" | "creamy" | "watery" | "egg_white";
export type LhLevel = "low" | "high" | "peak";
export type PregnancyTest = "negative" | "positive" | "faint";

export interface DayLog {
  date: string; // YYYY-MM-DD
  flow?: Flow | null;
  intercourse?: boolean | null;
  symptoms?: string[] | null;
  mood?: string | null;
  cervical_mucus?: Mucus | null;
  bbt?: number | null;
  pregnancy_test?: PregnancyTest | null;
  notes?: string | null;
  source?: string | null;
}

export interface LhTest {
  id?: number;
  date: string; // YYYY-MM-DD (local day the test was taken)
  taken_at?: string | null; // ISO timestamp if known
  ratio: number | null;
  level: LhLevel;
  ai_ratio?: number | null;
  ai_level?: LhLevel | null;
  has_photo?: boolean;
  source?: string | null;
}

export interface Settings {
  cycleLength: number;
  lutealLength: number;
  periodLength: number;
  ttc: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  cycleLength: 28,
  lutealLength: 14,
  periodLength: 5,
  ttc: true,
};

/** What an importer (or the AI extractor) produces before anything is saved. */
export interface ImportBundle {
  dayLogs: DayLog[];
  lhTests: LhTest[];
  warnings: string[];
}
