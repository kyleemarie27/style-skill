import type { VercelRequest } from "@vercel/node";
import { isISODate } from "../shared/dates.js";
import { method, route } from "./_lib/auth.js";
import { askJson, fakeAi } from "./_lib/claude.js";
import { HttpError, q } from "./_lib/db.js";
import { factsPrompt, loadFacts } from "./_lib/memory.js";

const SYSTEM = `You write the short personal line at the top of a private cycle and fertility tracker's daily note. The user is trying to conceive.

Write 2–3 warm, specific sentences, like a knowledgeable friend:
- Mention one concrete thing from yesterday's log or the recent trend (an LH reading going up, intercourse timing in the fertile window, a symptom, or what she logged). If nothing was logged, gently invite a quick check-in.
- Then give one practical focus for today that fits the phase.
- Keep it encouraging but honest. Never promise pregnancy, never diagnose, and avoid toxic positivity. If you mention timing, be accurate: the most fertile days are the 2–3 days before ovulation and ovulation day itself.
- Plain text only, no emoji, no greeting like "Good morning".`;

const PREGNANT_SYSTEM = `You write the short personal line at the top of a private pregnancy tracker's daily page. The user is pregnant; the context gives her gestational age, what's happening with the baby this week, and what she logged over the last few days (symptoms, nausea, bleeding, pain, mood, vitals).

Write 2–3 warm, specific sentences, like a knowledgeable friend:
- Mention one concrete thing from her recent logs (nausea easing or worse, a symptom, taking her prenatal, a mood). If nothing was logged, gently invite a quick check-in.
- Connect it to what's happening this week, or give one practical, evidence-based thing to do today.
- Calm and honest: never promise outcomes, never diagnose. If her logs include bleeding, strong pain, fever or other warning signs, kindly tell her to call her doctor today.
- Plain text only, no emoji, no greeting like "Good morning".`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["line"],
  properties: { line: { type: "string" } },
};

/**
 * Pregnancy mode also gets today's plan: small actions for her, one move for her partner and a few
 * questions worth asking Bloom, all fitted to her exact gestational day and what she's logged.
 */
const PLAN_PROMPT = `

Also write today's plan, alongside the line:
- "todos": exactly 3 small things for her to do today, each doable in minutes. Make them specific to her exact gestational day and to what she logged in the last few days. If she logged a symptom, at least one should directly help with it (a concrete remedy, food, position or habit with the reason). Use the week's to-do list and upcoming appointments when something is due. Each has "t" (an imperative under 90 characters, e.g. "Eat a few almonds before you get out of bed") and "why" (one short sentence with the reason or the science).
- "partner": one thing her partner can do today, written to the partner, matched to how she's doing (e.g. if she logged nausea: take over dinner and keep the kitchen smell-free). Refer to her by first name if given, otherwise "your partner"; no pronouns for her. "t" and "why" as above.
- "ask": 3 short questions she might want to ask Bloom today, in her voice, about her symptoms or this exact stage (e.g. "Is it normal to be this bloated at 6 weeks?").
- Never repeat or lightly reword anything in "recentlySuggested". Vary the kind of action day to day: food, movement, rest, body care, a practical task, connection, joy.
- Evidence-based and safe in pregnancy (ACOG, NHS, CDC). Nothing that needs a doctor's sign-off without saying so.`;

const PLAN_ITEM = {
  type: "object",
  additionalProperties: false,
  required: ["t", "why"],
  properties: { t: { type: "string" }, why: { type: "string" } },
};

const PREGNANT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["line", "todos", "partner", "ask"],
  properties: {
    line: { type: "string" },
    todos: { type: "array", items: PLAN_ITEM },
    partner: PLAN_ITEM,
    ask: { type: "array", items: { type: "string" } },
  },
};

interface PlanItem { t: string; why: string }
export interface DayPlan { todos: PlanItem[]; partner: PlanItem | null; ask: string[] }

const item = (x: any): PlanItem | null =>
  x && typeof x.t === "string" && x.t.trim() ? { t: x.t.trim().slice(0, 160), why: typeof x.why === "string" ? x.why.trim().slice(0, 300) : "" } : null;

/** Keep what's usable; null when there aren't at least two to-dos. */
export function cleanPlan(raw: any): DayPlan | null {
  const todos = (Array.isArray(raw?.todos) ? raw.todos : []).map(item).filter(Boolean).slice(0, 3) as PlanItem[];
  if (todos.length < 2) return null;
  const ask = (Array.isArray(raw?.ask) ? raw.ask : []).filter((q: unknown) => typeof q === "string" && q.trim()).map((q: string) => q.trim().slice(0, 120)).slice(0, 4);
  return { todos, partner: item(raw?.partner), ask };
}

const FAKE_PLANS: DayPlan[] = [
  {
    todos: [
      { t: "Eat a few almonds or crackers before you get out of bed", why: "An empty stomach makes morning nausea worse." },
      { t: "Sip cold ginger tea through the afternoon", why: "Ginger has decent evidence for easing pregnancy nausea." },
      { t: "Book your first prenatal visit if it isn't on the calendar", why: "Most first visits happen between 8 and 10 weeks." },
    ],
    partner: { t: "Take over dinner tonight and keep strong smells out of the kitchen", why: "Cooking smells are a top nausea trigger right now." },
    ask: ["Is it normal to feel this tired at 6 weeks?", "What helps nausea that isn't just crackers?", "When will we hear the heartbeat?"],
  },
  {
    todos: [
      { t: "Take a 15-minute walk after lunch", why: "Light movement helps bloating and evens out energy dips." },
      { t: "Add a vitamin C food to your iron-rich dinner", why: "Vitamin C helps you absorb iron from plants." },
      { t: "Put your feet up for 10 minutes this evening", why: "Your blood volume is climbing; rest helps you keep up." },
    ],
    partner: { t: "Plan a cozy night in with an early bedtime", why: "First-trimester fatigue is as draining as a bad flu." },
    ask: ["Why am I so bloated already?", "Which cheeses are actually safe?", "Is cramping normal this week?"],
  },
];

async function recentlySuggested(date: string): Promise<string[]> {
  const { rows } = await q<{ extra: DayPlan | null }>(
    "SELECT extra FROM daily_notes WHERE date < $1 AND date >= ($1::date - 10) AND extra IS NOT NULL",
    [date],
  );
  return rows.flatMap((r) => [...(r.extra?.todos ?? []).map((t) => t.t), ...(r.extra?.partner ? [r.extra.partner.t] : [])]);
}

/**
 * POST /api/daily-note {date, phase, context} → {line, plan?}
 * In pregnancy mode it also returns today's plan (to-dos, the partner's move, questions to ask).
 * Cached per day, so Claude is called at most once a day (pass refresh=true to regenerate).
 */
export default route(async (req: VercelRequest) => {
  method(req, "POST");
  const { date, phase, context, refresh } = req.body ?? {};
  if (!isISODate(date)) throw new HttpError(400, "Missing date.");

  const pregnant = !!context?.pregnant;
  if (!refresh) {
    const cached = await q<{ ai_line: string; phase: string; extra: DayPlan | null }>("SELECT ai_line, phase, extra FROM daily_notes WHERE date=$1", [date]);
    const hit = cached.rows[0];
    // A pregnancy note from before plans existed (or whose plan failed) is written again.
    if (hit?.ai_line && hit.phase === phase && (!pregnant || hit.extra)) return { line: hit.ai_line, plan: hit.extra ?? null, cached: true };
  }

  let line: string;
  let plan: DayPlan | null = null;
  if (!pregnant) {
    line = fakeAi()
      ? "Yesterday's LH reading was higher than the day before, so your surge may be close. Keep testing this afternoon and plan some time together tonight."
      : (
          await askJson<{ line: string }>({
            system: SYSTEM + factsPrompt(await loadFacts()),
            schema: SCHEMA,
            effort: "low",
            maxTokens: 2000,
            content: [{ type: "text", text: `Today's context (JSON):\n${JSON.stringify(context ?? {}).slice(0, 6000)}` }],
          })
        ).line.trim();
  } else {
    const avoid = await recentlySuggested(date);
    const write = async () =>
      fakeAi()
        ? { line: "You logged mild nausea yesterday but still took your prenatal, which is a win. This week baby's heart is beating fast; keep crackers by the bed and sip water through the morning.", ...FAKE_PLANS[Number(date.slice(-2)) % FAKE_PLANS.length] }
        : askJson<{ line: string } & DayPlan>({
            system: PREGNANT_SYSTEM + PLAN_PROMPT + factsPrompt(await loadFacts()),
            schema: PREGNANT_SCHEMA,
            effort: "low",
            maxTokens: 4000,
            content: [{ type: "text", text: `Today's context (JSON):\n${JSON.stringify({ ...(context ?? {}), recentlySuggested: avoid }).slice(0, 9000)}` }],
          });
    let out = await write();
    plan = cleanPlan(out);
    if (!plan) {
      console.error(`Daily plan for ${date} came back unusable; retrying.`);
      out = await write();
      plan = cleanPlan(out);
    }
    line = out.line.trim();
  }

  await q(
    `INSERT INTO daily_notes (date, phase, ai_line, extra) VALUES ($1,$2,$3,$4)
     ON CONFLICT (date) DO UPDATE SET phase=$2, ai_line=$3, extra=$4, created_at=now()`,
    [date, String(phase ?? ""), line, plan ? JSON.stringify(plan) : null],
  );
  return { line, plan, cached: false };
});
