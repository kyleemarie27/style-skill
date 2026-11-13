import { isISODate } from "../../shared/dates.js";
import {
  FALLBACK_GUESS, FALLBACK_QUIZ, guessAbout, norm, other, scores, themeFor,
  type Author, type DuelDay, type DuelGuess, type DuelPicks, type DuelQuiz, type DuelRecord, type Stage,
} from "../../shared/duel.js";
import { askJson, fakeAi } from "./claude.js";
import { HttpError, q } from "./db.js";

const SYSTEM = `You write the Daily Duel for a couple's private fertility and pregnancy app: a tiny daily game they both play, then compare. It should be quick, fun and teach them something true.

Write:
- "quiz": exactly 2 multiple-choice questions with 3 or 4 short options each and one right answer ("answer" is the 0-based index of the right option). Question 1 is about where they are right now ("now" in the context). Question 2 is about this week's theme ("theme"). Mix up which position the right answer is in.
- "explain": one short line (under 110 characters) on why the answer is right. Plain, friendly, no sources.
- "topic": 1–3 words.
- "guess": one light "guess me" question. "self" is asked to the person it's about (you'll get their name as "aboutName"); "guess" is the same question asked to the other person, using aboutName (e.g. "What would Kylee pick tonight?"). 3–4 short options, any of which could be true. Make it about them as a couple or as future parents, preferences, memories or little hopes. Never about fertility outcomes, bodies, sex or whether a test will be positive.

Rules:
- Accurate and evidence-based (ACOG, ASRM, NHS, WHO, AAP). If a fact is debated, don't use it. Options short (under 45 characters), questions under 110 characters.
- Never repeat or lightly reword anything in "alreadyAsked". Pick a fresh angle each day.
- Address both of them as a team; no pronouns for either person, use names or "you".
- If "gentle" is true (a recent pregnancy loss, or test day), keep the quiz to general knowledge that isn't about miscarriage, pregnancy odds or test results, and keep the guess question warm and light.`;

const QUIZ_ITEM = {
  type: "object",
  additionalProperties: false,
  required: ["q", "options", "answer", "explain", "topic"],
  properties: {
    q: { type: "string" },
    options: { type: "array", items: { type: "string" } },
    answer: { type: "integer" },
    explain: { type: "string" },
    topic: { type: "string" },
  },
};

export const DUEL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["quiz", "guess"],
  properties: {
    quiz: { type: "array", items: QUIZ_ITEM },
    guess: {
      type: "object",
      additionalProperties: false,
      required: ["self", "guess", "options"],
      properties: { self: { type: "string" }, guess: { type: "string" }, options: { type: "array", items: { type: "string" } } },
    },
  },
};

export interface DuelContext {
  stage: Stage;
  level: string;
  /** One line on where they are right now, e.g. "Cycle day 12, fertile window open, LH rising". */
  now: string;
  gentle: boolean;
  names: { me: string; partner: string };
}

function cleanContext(raw: any): DuelContext {
  const t = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  return {
    stage: ["ttc", "pregnancy", "baby"].includes(raw?.stage) ? raw.stage : "ttc",
    level: t(raw?.level, 40) || "This week",
    now: t(raw?.now, 300),
    gentle: raw?.gentle === true,
    names: { me: t(raw?.names?.me, 40), partner: t(raw?.names?.partner, 40) },
  };
}

const validQuiz = (x: DuelQuiz) =>
  typeof x?.q === "string" && Array.isArray(x.options) && x.options.length >= 3 && x.options.length <= 4 &&
  Number.isInteger(x.answer) && x.answer >= 0 && x.answer < x.options.length;

async function history(): Promise<DuelDay[]> {
  const { rows } = await q<{ content: DuelDay }>("SELECT content FROM duel_days ORDER BY date DESC LIMIT 400");
  return rows.map((r) => r.content);
}

/** Today's questions: written once, by AI when it's on, never repeating an earlier one. */
async function generate(date: string, ctx: DuelContext): Promise<DuelDay> {
  const past = await history();
  const names = [ctx.names.me, ctx.names.partner];
  const seen = new Set(past.flatMap((d) => [...d.quiz.map((x) => norm(x.q, names)), norm(d.guess.self, names)]));
  const about = guessAbout(date);
  const aboutName = (about === "me" ? ctx.names.me : ctx.names.partner) || "your partner";
  const theme = themeFor(ctx.stage, date);
  let quiz: DuelQuiz[] = [];
  let guess: Omit<DuelGuess, "about"> | null = null;

  if (!fakeAi()) {
    const alreadyAsked = past.slice(0, 150).flatMap((d) => [...d.quiz.map((x) => x.q), d.guess.self]);
    for (let attempt = 0; attempt < 2 && (quiz.length < 2 || !guess); attempt++) {
      try {
        const out = await askJson<{ quiz: DuelQuiz[]; guess: Omit<DuelGuess, "about"> }>({
          system: SYSTEM,
          effort: "low",
          maxTokens: 3000,
          content: [{ type: "text", text: JSON.stringify({ date, stage: ctx.stage, level: ctx.level, now: ctx.now, theme, gentle: ctx.gentle, names: ctx.names, aboutName, alreadyAsked }) }],
          schema: DUEL_SCHEMA,
        });
        const fresh = (out.quiz ?? []).filter((x) => validQuiz(x) && !seen.has(norm(x.q, names)));
        for (const x of fresh) if (quiz.length < 2 && !quiz.some((y) => norm(y.q) === norm(x.q))) quiz.push(x);
        const g = out.guess;
        if (!guess && g && typeof g.self === "string" && Array.isArray(g.options) && g.options.length >= 2 && g.options.length <= 5 && !seen.has(norm(g.self, names))) guess = g;
      } catch (e) {
        console.error(`Duel generation failed: ${(e as Error).message}`);
        break;
      }
    }
  }
  // Fill anything missing from the hand-written bank, never reusing one already asked.
  for (const x of FALLBACK_QUIZ) {
    if (quiz.length >= 2) break;
    if (!seen.has(norm(x.q, names)) && !quiz.some((y) => norm(y.q) === norm(x.q))) quiz.push(x);
  }
  for (const x of FALLBACK_QUIZ) if (quiz.length < 2) quiz.push(x); // bank exhausted: reuse rather than break
  if (!guess) {
    guess = FALLBACK_GUESS.find((g) => !seen.has(norm(g.self, names))) ?? FALLBACK_GUESS[Math.abs(Number(date.replace(/-/g, ""))) % FALLBACK_GUESS.length];
    guess = { ...guess, guess: guess.guess.replace(/\{name\}/g, aboutName) };
  }
  const clip = (s: string, n: number) => s.trim().slice(0, n);
  return {
    date,
    level: ctx.level,
    theme,
    quiz: quiz.slice(0, 2).map((x) => ({ q: clip(x.q, 200), options: x.options.map((o) => clip(o, 80)), answer: x.answer, explain: clip(x.explain ?? "", 200), topic: clip(x.topic ?? "", 40) })),
    guess: { about, self: clip(guess.self, 200), guess: clip(guess.guess, 200), options: guess.options.slice(0, 5).map((o) => clip(o, 80)) },
  };
}

async function records(): Promise<DuelRecord[]> {
  const [days, picks] = await Promise.all([
    q<{ date: string; content: DuelDay }>("SELECT date, content FROM duel_days ORDER BY date"),
    q<{ date: string; author: Author; picks: DuelPicks }>("SELECT date, author, picks FROM duel_picks"),
  ]);
  const byDate = new Map<string, DuelRecord>(days.rows.map((d) => [d.date, { date: d.date, day: d.content, picks: {} }]));
  for (const p of picks.rows) {
    const r = byDate.get(p.date);
    if (r) r.picks[p.author] = p.picks;
  }
  return [...byDate.values()];
}

/** What a player may see: no right answers until they've played, no partner picks until both have. */
function view(r: DuelRecord, me: Author, all: DuelRecord[], today: string) {
  const mine = r.picks[me] ?? null;
  const theirs = r.picks[other(me)] ?? null;
  const day = mine ? r.day : { ...r.day, quiz: r.day.quiz.map(({ answer: _a, explain: _e, ...rest }) => rest) };
  return {
    day,
    mine,
    theirs: mine ? theirs : null,
    theyPlayed: !!theirs,
    scores: scores(all, today),
  };
}

export async function duelRoute(method: string, body: any, me: Author) {
  const date = body?.date;
  if (!isISODate(date)) throw new HttpError(400, "Missing the date.");
  if (method === "POST") {
    let { rows } = await q<{ content: DuelDay }>("SELECT content FROM duel_days WHERE date=$1", [date]);
    if (!rows[0]) {
      const day = await generate(date, cleanContext(body?.context));
      await q("INSERT INTO duel_days (date, content) VALUES ($1,$2) ON CONFLICT (date) DO NOTHING", [date, JSON.stringify(day)]);
    }
    const all = await records();
    return view(all.find((r) => r.date === date)!, me, all, date);
  }
  if (method === "PUT") {
    const all0 = await records();
    const r = all0.find((x) => x.date === date);
    if (!r) throw new HttpError(404, "No duel for that day yet.");
    const p = body?.picks;
    const okIdx = (v: unknown, n: number) => Number.isInteger(v) && (v as number) >= 0 && (v as number) < n;
    if (!p || !Array.isArray(p.quiz) || p.quiz.length !== r.day.quiz.length || !p.quiz.every((v: unknown, i: number) => okIdx(v, r.day.quiz[i].options.length)) || !okIdx(p.guess, r.day.guess.options.length)) {
      throw new HttpError(400, "Answer every question first.");
    }
    // Answers are final: the first submit counts.
    await q("INSERT INTO duel_picks (date, author, picks) VALUES ($1,$2,$3) ON CONFLICT (date, author) DO NOTHING", [date, me, JSON.stringify({ quiz: p.quiz, guess: p.guess })]);
    const all = await records();
    return view(all.find((x) => x.date === date)!, me, all, date);
  }
  throw new HttpError(405, "Method not allowed");
}
