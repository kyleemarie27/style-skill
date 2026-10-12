import type { VercelRequest } from "@vercel/node";
import { isISODate } from "../shared/dates.js";
import { method, route } from "./_lib/auth.js";
import { askJson, fakeAi } from "./_lib/claude.js";
import { HttpError, q } from "./_lib/db.js";

export interface DeepDive {
  title: string;
  minutes: number;
  sections: { heading: string; body: string }[];
  takeaways: string[];
}

const ANGLES = [
  "how the baby is developing right now, explained like a great science writer",
  "what is happening in her body this week (hormones, organs, blood volume, the uterus) and why it causes the symptoms she has",
  "nutrition and supplements that matter at this exact stage, with specific foods, amounts and why",
  "a test, appointment or decision coming up soon (or just done), explained clearly: what it is, what results mean, what to ask",
  "emotional health: the common feelings at this stage, what's normal, and practical ways to cope and connect",
  "practical preparation and her partner: what to plan, buy, learn or share around this stage",
  "one popular pregnancy myth or confusing topic relevant to this stage, and what the evidence actually says",
];

const SYSTEM = `You write the daily deep dive in a private pregnancy app. The reader is pregnant and hungry for real, detailed, trustworthy information about what's happening, what to expect and how to look after herself and the baby.

Write a 450–650 word article on ONE topic matched to her exact gestational age and today's angle (given in the context). Use her recent logs when relevant (for example, if she logged nausea, the article can explain the science of nausea and what helps).

Rules:
- Evidence-based and specific: draw on ACOG, NHS, CDC, SMFM and Mayo Clinic guidance. Use real numbers (sizes, amounts, timings) where they help. Don't invent statistics; say when evidence is limited or when things vary a lot.
- Warm, clear and direct, like a friend who is an excellent OB nurse and science writer. No fluff, no toxic positivity, no promises about outcomes.
- Never diagnose. If the topic touches warning signs, or her logs include bleeding, strong pain, fever, severe vomiting or (after 20 weeks) high blood pressure, headache or vision changes, include a clear line about when to call her doctor.
- 3–5 sections, each with a short heading and 1–3 paragraphs of plain text (no markdown, no bullet characters inside bodies; separate paragraphs with a blank line).
- 3–4 short key takeaways.
- Don't repeat the app's weekly summary verbatim; go deeper than it.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "minutes", "sections", "takeaways"],
  properties: {
    title: { type: "string" },
    minutes: { type: "integer" },
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
  title: "The placenta: the organ you're building right now",
  minutes: 4,
  sections: [
    { heading: "A temporary organ with a big job", body: "Right now, the outer layer of cells around your embryo is growing into the placenta. Over the next few weeks it will take over feeding the baby, delivering oxygen and removing waste.\n\nIt also becomes a hormone factory, making hCG now and, from around 10–12 weeks, all of the progesterone that keeps the pregnancy going." },
    { heading: "Why it makes you so tired", body: "Building a whole new organ takes energy, and the progesterone it helps maintain has a sedating effect. That's a big part of first-trimester exhaustion." },
    { heading: "When to call your doctor", body: "Light spotting can be normal, but heavy bleeding, strong cramps or one-sided pain need a same-day call." },
  ],
  takeaways: ["The placenta takes over around 10–12 weeks", "Tiredness now is your body doing real work", "Heavy bleeding or one-sided pain: call the same day"],
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

  const dow = Number(context?.dayOfWeek) || 0;
  const angle = ANGLES[Math.abs(dow) % ANGLES.length];
  const dive = fakeAi()
    ? FAKE
    : await askJson<DeepDive>({
        system: SYSTEM,
        schema: SCHEMA,
        effort: "medium",
        maxTokens: 8000,
        content: [{ type: "text", text: `Today's angle: ${angle}\n\nContext (JSON):\n${JSON.stringify(context ?? {}).slice(0, 8000)}` }],
      });

  await q(
    `INSERT INTO deep_dives (date, key, content) VALUES ($1,$2,$3)
     ON CONFLICT (date) DO UPDATE SET key=$2, content=$3, created_at=now()`,
    [date, String(key ?? ""), JSON.stringify(dive)],
  );
  return { ...dive, cached: false };
});
