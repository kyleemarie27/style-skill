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
  /** Marked as the day of ovulation (e.g. Premom's "Confirmed Ovulation"). */
  ovulation?: boolean | null;
  notes?: string | null;
  /** Pregnancy-only fields (nausea, bleeding, blood pressure...). */
  preg?: PregLog | null;
  source?: string | null;
}

export type Nausea = "none" | "mild" | "moderate" | "severe";
export type PregBleeding = "none" | "spotting" | "light" | "heavy";
export type PregPain = "none" | "mild" | "strong";

/** What a pregnant user logs for a day. Every field is optional. */
export interface PregLog {
  nausea?: Nausea | null;
  vomits?: number | null;
  bleeding?: PregBleeding | null;
  pain?: PregPain | null;
  painOneSided?: boolean | null;
  /** Pounds. */
  weight?: number | null;
  bpSys?: number | null;
  bpDia?: number | null;
  /** °F. */
  temp?: number | null;
  prenatal?: boolean | null;
  /** Glasses of water. */
  water?: number | null;
  /** Minutes it took to feel 10 movements (from 28 weeks). */
  kicks?: number | null;
  /** Contractions in the last hour (from 28 weeks). */
  contractions?: number | null;
  leaking?: boolean | null;
  meds?: string | null;
}

export interface PregQuestion {
  id: string;
  text: string;
  created: string;
  done?: string | null;
}

export interface Appointment {
  id: string;
  date: string;
  title: string;
  notes?: string | null;
}

export interface Pregnancy {
  positiveTestDate: string;
  /** First day of the last period. */
  lmp: string;
  dueDate: string;
  dueDateSource: "lmp" | "ovulation" | "doctor";
  ended?: { date: string; reason: "birth" | "loss" | "other" } | null;
  questions: PregQuestion[];
  appointments: Appointment[];
  /** First names, so the partner view can say "How Kylee is doing" instead of guessing pronouns. */
  momName?: string | null;
  partnerName?: string | null;
}

/** An answer to the daily question, kept as a keepsake. */
export interface JournalEntry {
  date: string;
  prompt: string;
  answer: string;
}

/** One bump photo per pregnancy week. The image itself is fetched separately. */
export interface BumpPhoto {
  week: number;
  date: string;
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
  /** YYYY-MM-DD you started trying to conceive, if set. */
  ttcSince?: string | null;
  /** 35 or older: doctors suggest a check-up after 6 months of trying instead of 12. */
  over35?: boolean;
  /** Set once a positive test is confirmed. Bloom switches to pregnancy mode while it's active. */
  pregnancy?: Pregnancy | null;
}

export const DEFAULT_SETTINGS: Settings = {
  cycleLength: 28,
  lutealLength: 14,
  periodLength: 5,
  ttc: true,
  ttcSince: null,
  over35: false,
  pregnancy: null,
};

/** What an importer (or the AI extractor) produces before anything is saved. */
export interface ImportBundle {
  dayLogs: DayLog[];
  lhTests: LhTest[];
  warnings: string[];
}
