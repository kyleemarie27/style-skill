import { addDays, diffDays } from "./dates.js";

/**
 * The Daily Duel: both of you get the same three questions each day. Two quiz questions (one about
 * where you are right now, one from this week's theme) and one "guess me": one of you answers about
 * yourself and the other guesses. You see each other's picks only after you've both played.
 * Friendly scoring: 1 point per right quiz answer, 1 for a right guess. The streak counts days you
 * both played.
 */
export type Author = "me" | "partner";

export interface DuelQuiz {
  q: string;
  options: string[];
  /** Index of the right option. Hidden from a player until they've answered. */
  answer: number;
  /** One short line on why, shown after answering. */
  explain: string;
  topic: string;
}

export interface DuelGuess {
  /** Whose answer it is: that person answers for real, the other guesses. */
  about: Author;
  /** Asked to the person it's about ("What sounds best tonight?"). */
  self: string;
  /** Asked to the guesser ("What would Kylee pick tonight?"). */
  guess: string;
  options: string[];
}

export interface DuelDay {
  date: string;
  /** The level badge: where you are ("Window week", "Week 12"). */
  level: string;
  /** This week's theme. */
  theme: string;
  quiz: DuelQuiz[];
  guess: DuelGuess;
}

export interface DuelPicks {
  quiz: number[];
  guess: number;
}

export interface DuelRecord {
  date: string;
  day: DuelDay;
  picks: Partial<Record<Author, DuelPicks>>;
}

export const other = (a: Author): Author => (a === "me" ? "partner" : "me");

/** Points one person scored on one day. A guess only scores once the other has answered. */
export function dayPoints(r: DuelRecord, who: Author): number {
  const p = r.picks[who];
  if (!p) return 0;
  let n = r.day.quiz.reduce((s, q, i) => s + (p.quiz[i] === q.answer ? 1 : 0), 0);
  const subject = r.picks[r.day.guess.about];
  if (r.day.guess.about !== who && subject && subject.guess === p.guess) n++;
  return n;
}

/** Monday of the week a date falls in. */
export function weekStart(date: string): string {
  const dow = (new Date(date + "T00:00:00Z").getUTCDay() + 6) % 7;
  return addDays(date, -dow);
}

export interface DuelScores {
  week: Record<Author, number>;
  lastWeek: Record<Author, number>;
  all: Record<Author, number>;
  /** Days in a row you both played, ending today (or yesterday, if today isn't done yet). */
  streak: number;
}

export function scores(records: DuelRecord[], today: string): DuelScores {
  const zero = () => ({ me: 0, partner: 0 });
  const out: DuelScores = { week: zero(), lastWeek: zero(), all: zero(), streak: 0 };
  const ws = weekStart(today);
  const lastWs = addDays(ws, -7);
  for (const r of records) {
    for (const who of ["me", "partner"] as Author[]) {
      const pts = dayPoints(r, who);
      out.all[who] += pts;
      if (r.date >= ws && r.date <= today) out.week[who] += pts;
      else if (r.date >= lastWs && r.date < ws) out.lastWeek[who] += pts;
    }
  }
  const both = new Set(records.filter((r) => r.picks.me && r.picks.partner).map((r) => r.date));
  let d = both.has(today) ? today : addDays(today, -1);
  while (both.has(d)) {
    out.streak++;
    d = addDays(d, -1);
  }
  return out;
}

/** Text normalized for duplicate checks: lowercase letters and digits only, names removed. */
export function norm(s: string, names: string[] = []): string {
  let t = s.toLowerCase();
  for (const n of names.filter(Boolean)) t = t.split(n.toLowerCase()).join("");
  return t.replace(/[^a-z0-9]+/g, "");
}

/** Whose turn it is to be guessed: alternates by day. */
export function guessAbout(date: string): Author {
  return Math.abs(diffDays(date, "2026-01-05")) % 2 === 0 ? "me" : "partner";
}

export type Stage = "ttc" | "pregnancy" | "baby";

/** Weekly themes for the second quiz question, per stage. Each week moves to the next. */
export const THEMES: Record<Stage, string[]> = {
  ttc: [
    "How the fertile window works",
    "LH, mucus and temperature",
    "Sperm health",
    "Hormones through the cycle",
    "Food, sleep and stress",
    "What happens at conception",
    "The two-week wait",
    "Early pregnancy basics",
    "Fertility myths",
    "When to see a fertility doctor",
  ],
  pregnancy: [
    "Prenatal tests and scans",
    "Food and medicine safety",
    "How the baby grows",
    "Signs of labor",
    "Stages of labor",
    "Pain relief options",
    "The partner's role at the birth",
    "The first hours after birth",
    "Feeding a newborn",
    "Safe sleep",
    "Postpartum recovery",
    "Baby care basics",
  ],
  baby: [
    "Newborn sleep",
    "Feeding and growth",
    "Milestones",
    "Postpartum recovery",
    "Soothing and crying",
    "Baby health and checkups",
    "Play and development",
    "Teamwork as new parents",
  ],
};

export function themeFor(stage: Stage, date: string): string {
  const list = THEMES[stage];
  const wk = Math.floor(diffDays(weekStart(date), "2026-01-05") / 7);
  return list[((wk % list.length) + list.length) % list.length];
}

/** Hand-written questions used only when AI is off. Picked so none repeat until they run out. */
export const FALLBACK_QUIZ: DuelQuiz[] = [
  { q: "How long can sperm survive in fertile cervical mucus?", options: ["About 12 hours", "Up to 5 days", "About 2 weeks"], answer: 1, explain: "That's why the days before ovulation count most.", topic: "fertile window" },
  { q: "How long does an egg live after ovulation?", options: ["12–24 hours", "3 days", "A week"], answer: 0, explain: "Short, so sperm waiting ahead of time gives the best odds.", topic: "fertile window" },
  { q: "Which days give the best odds of conceiving?", options: ["The week after the period", "The 2 days before ovulation and ovulation day", "The day the period is due"], answer: 1, explain: "The three days ending on ovulation.", topic: "fertile window" },
  { q: "After an LH Peak, ovulation usually follows within…", options: ["12–36 hours", "3–4 days", "A week"], answer: 0, explain: "The surge triggers the egg's release.", topic: "LH" },
  { q: "What does a temperature rise that holds for 3 nights tell you?", options: ["Ovulation is tomorrow", "Ovulation already happened", "A period is coming"], answer: 1, explain: "Progesterone after ovulation lifts temperature.", topic: "temperature" },
  { q: "What does egg-white cervical mucus mean?", options: ["Infection", "Peak fertility", "Period starting"], answer: 1, explain: "Stretchy, clear mucus helps sperm swim.", topic: "mucus" },
  { q: "How long does it take the body to make new sperm?", options: ["About 3 days", "About 3 weeks", "About 3 months"], answer: 2, explain: "Habits now pay off a few cycles from now.", topic: "sperm health" },
  { q: "Which lowers sperm quality?", options: ["Hot tubs and saunas", "Drinking water", "Daily walks"], answer: 0, explain: "Sperm like it a few degrees cooler than the body.", topic: "sperm health" },
  { q: "How often should you have sex in the fertile window?", options: ["Only on ovulation day", "Every 1–2 days", "Three times a day"], answer: 1, explain: "Every other day works about as well as daily.", topic: "timing" },
  { q: "When does implantation usually happen?", options: ["1–2 days after ovulation", "6–10 days after ovulation", "On the day the period is due"], answer: 1, explain: "Most often around 8–9 days past ovulation.", topic: "two-week wait" },
  { q: "When is a home pregnancy test reasonably reliable?", options: ["5 days after ovulation", "About 12–14 days after ovulation", "Only after a missed period by 2 weeks"], answer: 1, explain: "hCG needs time to build up.", topic: "testing" },
  { q: "Which vitamin matters most before and in early pregnancy?", options: ["Folic acid", "Vitamin K", "Vitamin E"], answer: 0, explain: "It protects early neural tube development.", topic: "nutrition" },
  { q: "What share of healthy couples conceive in any one cycle?", options: ["About 1 in 5", "About 1 in 2", "About 9 in 10"], answer: 0, explain: "Most take a few cycles, even with perfect timing.", topic: "odds" },
  { q: "Which hormone rises after ovulation and keeps the uterine lining?", options: ["Estrogen", "Progesterone", "Testosterone"], answer: 1, explain: "It's also why temperature goes up.", topic: "hormones" },
  { q: "What causes period cramps?", options: ["Prostaglandins", "Low iron", "Progesterone"], answer: 0, explain: "They make the uterus contract.", topic: "period" },
];

export const FALLBACK_GUESS: Omit<DuelGuess, "about">[] = [
  { self: "Pick tonight:", guess: "What would {name} pick tonight?", options: ["Couch and a movie", "A walk", "Dinner out"] },
  { self: "Your perfect Saturday morning:", guess: "{name}'s perfect Saturday morning?", options: ["Sleep in", "Coffee out", "A workout", "Breakfast in bed"] },
  { self: "Comfort food right now:", guess: "{name}'s comfort food right now?", options: ["Pizza", "Pasta", "Soup", "Something sweet"] },
  { self: "Dream trip this year:", guess: "{name}'s dream trip this year?", options: ["Beach", "Mountains", "A city", "Staycation"] },
  { self: "Best way to end a hard day:", guess: "How would {name} end a hard day?", options: ["Talk it out", "Alone time", "A hug", "A show"] },
  { self: "First thing you'd teach our kid:", guess: "First thing {name} would teach your kid?", options: ["Kindness", "A sport", "Cooking", "Music"] },
  { self: "Your love language this week:", guess: "{name}'s love language this week?", options: ["Words", "Touch", "Help with things", "Time together", "A small gift"] },
  { self: "Most excited about as a parent:", guess: "What is {name} most excited about as a parent?", options: ["First smile", "First words", "Family trips", "Bedtime stories"] },
];
