import type { VercelRequest } from "@vercel/node";
import { isISODate } from "../shared/dates.js";
import { method, route } from "./_lib/auth.js";
import { askJson, fakeAi } from "./_lib/claude.js";
import { HttpError, q } from "./_lib/db.js";
import { factsPrompt, loadFacts } from "./_lib/memory.js";

export interface DeepDive {
  title: string;
  minutes: number;
  /** A friendly first line, like the start of a message from a friend. */
  opener?: string;
  sections: { heading: string; body: string }[];
  takeaways: string[];
  /** A short warm closing line. */
  signoff?: string;
  /** One line teasing tomorrow's topic. */
  tomorrow?: string;
}

const ANGLES = [
  "how the baby is developing right now: the coolest, most vivid details of what's being built today",
  "what's going on in her body this week (hormones, organs, blood volume, the uterus) and why it explains how she feels",
  "food and supplements that matter at this exact stage: specific foods, amounts and why, plus easy ideas she can actually eat today",
  "a test, appointment or decision coming up soon (or just done): what it is, what results mean, and good questions to ask",
  "how she might be feeling: the common emotions at this stage, what's normal, and small ways to cope, connect and enjoy it",
  "getting ready, with her partner: what to plan, buy, learn or talk about around this stage, and what can wait",
  "one popular pregnancy myth or confusing topic for this stage, and what the evidence actually says",
];

const SYSTEM = `You write the daily deep dive in a private pregnancy app. The reader is pregnant, excited, and hungry for real, detailed, trustworthy information. She reads this every day, so it should feel like a long, thoughtful message from a friend who happens to be a brilliant OB nurse and science writer. It should not read like a textbook or a patient leaflet.

Write about 450–600 words on ONE topic matched to her exact gestational age and today's angle (given in the context). Use what she's logged recently and what she's told Bloom about herself when relevant (for example, if she logged nausea, explain the science of nausea and what helps; if it's her first pregnancy, say so naturally).

Voice:
- Talk to her directly as "you". Use contractions, short sentences and the odd aside in parentheses. Sound curious and a bit delighted by how amazing this is, without being saccharine.
- Open with a one or two sentence "opener" that feels like the start of a message ("Okay, today's one is wild: ..."). Vary it every day; no "Hey mama", no "Hi there".
- Section headings are the questions she'd actually ask, in her words ("Wait, why am I so tired?", "So what can I actually eat?"), not textbook labels.
- Explain the science with vivid comparisons and real numbers (sizes, amounts, timings), then say what it means for her day.
- Evidence-based: draw on ACOG, NHS, CDC, SMFM and Mayo Clinic guidance. Don't invent statistics; say when evidence is limited or when it varies a lot. No toxic positivity and no promises about outcomes.
- Never diagnose. If the topic touches warning signs, or her logs include bleeding, strong pain, fever, severe vomiting or (after 20 weeks) high blood pressure, headache or vision changes, include a clear, calm line about when to call her doctor.

Format:
- 3–5 sections, each with a question-style heading and 1–3 short paragraphs of plain text (no markdown, no bullet characters; separate paragraphs with a blank line).
- "takeaways": 3 short "if you only remember this" lines, written casually.
- "signoff": one warm closing sentence.
- "tomorrow": one sentence teasing tomorrow's topic (given in the context), to give her something to look forward to.
- Don't repeat the app's weekly summary; go deeper than it.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "minutes", "opener", "sections", "takeaways", "signoff", "tomorrow"],
  properties: {
    title: { type: "string" },
    minutes: { type: "integer" },
    opener: { type: "string" },
    signoff: { type: "string" },
    tomorrow: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["heading", "body"],
        properties: { heading: { type: "string" }, body: { type: "string" } },
      },
    },
    takeaways: { type: "array", items: { type: "string" } },
  },
};

const FAKE: DeepDive = {
  title: "You're building a whole new organ right now",
  minutes: 4,
  opener: "Okay, today's one is honestly kind of wild: on top of everything else, your body is building an organ from scratch. And it's going to be thrown away in about nine months.",
  sections: [
    { heading: "Wait, I'm making an organ?", body: "Yep. The outer layer of cells around your embryo is turning into the placenta. Over the next few weeks it takes over feeding the baby, delivering oxygen and clearing waste (basically lungs, kidneys and a kitchen in one).\n\nIt's also a hormone factory. Right now it's pumping out hCG, and from around 10–12 weeks it makes all the progesterone that keeps the pregnancy going." },
    { heading: "Is that why I'm so tired?", body: "A big part of it, yes. Building a new organ takes real energy, and progesterone has a sedating effect. So if you're falling asleep on the couch at 8pm, that's not you being lazy. That's your body working a night shift." },
    { heading: "When should I call someone?", body: "Light spotting can be normal this early. Heavy bleeding, strong cramps or pain on one side are worth a same-day call, every time." },
  ],
  takeaways: ["The placenta takes over around 10–12 weeks", "Tired = your body doing real work, so rest without guilt", "Heavy bleeding or one-sided pain: call the same day"],
  signoff: "Go easy on yourself today. You're doing more than it looks like.",
  tomorrow: "Tomorrow: why your sense of smell suddenly feels like a superpower.",
};

/**
 * POST /api/deep-dive {date, key, context} → DeepDive
 * One article per day, cached; regenerated only if the gestational-day key changes (or refresh=true).
 */
export default route(async (req: VercelRequest) => {
  method(req, "POST");
  const { date, key, context, refresh } = req.body ?? {};
  if (!isISODate(date)) throw new HttpError(400, "Missing date.");

  if (!refresh) {
    const cached = await q<{ key: string; content: DeepDive }>("SELECT key, content FROM deep_dives WHERE date=$1", [date]);
    if (cached.rows[0] && cached.rows[0].key === String(key)) return { ...cached.rows[0].content, cached: true };
  }

  const dow = Math.abs(Number(context?.dayOfWeek) || 0);
  const angle = ANGLES[dow % ANGLES.length];
  const tomorrow = ANGLES[(dow + 1) % ANGLES.length];
  const dive = fakeAi()
    ? FAKE
    : await askJson<DeepDive>({
        system: SYSTEM + factsPrompt(await loadFacts()),
        schema: SCHEMA,
        effort: "medium",
        maxTokens: 8000,
        content: [{ type: "text", text: `Today's angle: ${angle}\nTomorrow's angle (for the teaser only): ${tomorrow}\n\nContext (JSON):\n${JSON.stringify(context ?? {}).slice(0, 8000)}` }],
      });

  await q(
    `INSERT INTO deep_dives (date, key, content) VALUES ($1,$2,$3)
     ON CONFLICT (date) DO UPDATE SET key=$2, content=$3, created_at=now()`,
    [date, String(key ?? ""), JSON.stringify(dive)],
  );
  return { ...dive, cached: false };
});
