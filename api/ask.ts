import Anthropic from "@anthropic-ai/sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { method, requireRole, route } from "./_lib/auth.js";
import { apiKey, askJson, fakeAi, MODEL, requireClaude } from "./_lib/claude.js";
import { HttpError } from "./_lib/db.js";
import { factsPrompt, loadFacts, saveFacts, type Fact } from "./_lib/memory.js";

const SYSTEM = `You are Bloom, the assistant inside a private cycle and fertility tracker. The user is trying to conceive and is asking about her own cycle, her data, or reproductive health in general.

You get a JSON snapshot of her data (cycle history, today's phase, health checks against normal ranges, recent logs and LH tests). Use it: answer about her specifically, quote her actual numbers, and say when the data is too thin to tell.

How to answer:
- Warm, direct and practical, like a knowledgeable friend who happens to know reproductive health well. Short paragraphs; a few bullets when listing steps. Usually 80–200 words unless she asks for depth.
- Be accurate and evidence-based (ACOG, ASRM, FIGO, NICE). Say when something is uncertain or varies a lot between people. Don't invent statistics.
- You give general information, not a diagnosis. When something in her data or question genuinely warrants a doctor, say so plainly and say why, without alarm.
- Urgent: severe one-sided pelvic pain, especially with a positive pregnancy test, shoulder-tip pain, fainting or heavy bleeding, can be an ectopic pregnancy. Tell her to seek urgent care now. Likewise for soaking a pad or tampon every hour for several hours.
- Use her timeline language: cycle day (CD), days past ovulation (DPO), fertile window. Premom-scale LH readings are T/C ratios: Low < 0.5, High 0.5–0.99, Peak ≥ 1.0.
- Never shame or pressure; the two-week wait and negative tests are hard.
- Plain text with simple markdown (**bold**, "- " bullets). No headings, no tables.`;

const PREGNANT_SYSTEM = `You are Bloom, the assistant inside a private pregnancy tracker. The user is pregnant and is asking about her pregnancy, her symptoms, what to expect, or how to look after herself and the baby.

You get a JSON snapshot of her data (gestational age, due date, the last two weeks of logged symptoms, nausea, bleeding, pain, blood pressure and weight, any warning flags, appointments and open questions). Use it: answer about her specifically, refer to what she logged, and say when you can't tell from the data.

How to answer:
- Warm, calm, direct and practical, like a friend who is an experienced OB nurse. Short paragraphs; a few bullets when listing steps. Usually 80–200 words unless she asks for depth.
- Be accurate and evidence-based (ACOG, NHS, CDC, SMFM). Say when something varies a lot between people. Don't invent statistics. Use gestational age in weeks + days (e.g. 6w 2d).
- Food and medication safety: be specific (e.g. acetaminophen is the usual choice for pain or fever; avoid NSAIDs unless her doctor says otherwise; caffeine under 200 mg/day; no alcohol). Tell her to check new medications with her doctor or pharmacist.
- Early-pregnancy anxiety is common. Be reassuring where the evidence supports it, without false promises; never guarantee an outcome.
- Urgent: heavy bleeding, bleeding with strong cramps, severe one-sided pain, shoulder-tip pain or fainting (possible ectopic, especially before 12 weeks); fever ≥ 100.4°F; can't keep fluids down for 24 hours; after 20 weeks a severe headache, vision changes, sudden swelling or BP ≥ 140/90; fluid leaking; regular contractions before 37 weeks; reduced fetal movement after 28 weeks. Tell her plainly to call her provider or go to labor & delivery / the ER now, and why.
- If something would be good to raise at her next appointment, suggest adding it to her "Questions for my doctor" list in Bloom.
- She's curious and excited, so feed that: when it fits, end with one thing to look forward to or one small thing she could try today.
- Plain text with simple markdown (**bold**, "- " bullets). No headings, no tables.`;

const PARTNER_SYSTEM = `You are Bloom, the assistant inside a private pregnancy tracker. You're talking with the PARTNER of the pregnant person (the data below is the pregnant person's). They want to understand what's going on and, above all, how to be useful.

How to answer:
- Talk to the partner directly. Refer to the pregnant person by first name when you have it (momName), otherwise "your partner". Don't guess pronouns for either of them; use names.
- Lead with what they can do: concrete, specific actions for today or this week, then a short "why" so it makes sense. Usually 80–180 words.
- Explain symptoms and stages in plain language using the snapshot (gestational age, what was logged lately), without being clinical or alarmist. Accurate and evidence-based (ACOG, NHS, CDC).
- Partners have feelings too (nerves, feeling useless, money worries). Acknowledge them briefly when it fits.
- Urgent warning signs are the same as for the pregnant person (heavy bleeding, severe or one-sided pain, fever ≥ 100.4°F, after 20 weeks a severe headache, vision changes, sudden swelling; fluid leaking; regular contractions before 37 weeks; reduced movement after 28 weeks): say plainly to call the provider or go to labor & delivery now.
- Plain text with simple markdown (**bold**, "- " bullets). No headings, no tables.`;

const PREG_SYMPTOMS = "Fatigue, Tender breasts, Frequent peeing, Food aversions, Cravings, Bloating, Constipation, Heartburn, Headache, Dizziness, Discharge change, Insomnia, Back pain, Leg cramps, Round ligament pain, Braxton Hicks, Swollen feet, Itching, Severe headache, Vision changes, Sudden swelling";
const MOODS = "Happy, Calm, Energetic, Anxious, Irritable, Sad, Sensitive";

/** How the model offers save-buttons. The app hides these lines and shows a button for each; nothing saves until she taps. */
function actionsPrompt(pregnant: boolean, today: string) {
  return `

Saving things from the chat: the app can turn suggestions into one-tap buttons. When she mentions something she'd plausibly want saved, add up to 3 lines at the very end of your answer, each exactly in this form (valid JSON, one per line, nothing after them):
[[bloom:{"type":"log","date":"YYYY-MM-DD","symptoms":["Fatigue"],"mood":"Anxious","notes":"short note"${pregnant ? ',"nausea":"mild","bleeding":"spotting","pain":"mild","prenatal":true' : ""}}]]${pregnant ? `
[[bloom:{"type":"question","text":"A clear question for her doctor, in her voice"}]]
[[bloom:{"type":"appointment","date":"YYYY-MM-DD","title":"Anatomy scan"}]]` : ""}
Rules: "log" is for things she says happened to her (today is ${today}; resolve "yesterday" etc. to real dates); include only the fields she actually mentioned. symptoms must come from: ${PREG_SYMPTOMS}. mood from: ${MOODS}.${pregnant ? ` nausea: none|mild|moderate|severe; bleeding: none|spotting|light|heavy; pain: none|mild|strong.` : ""} ${pregnant ? `Offer a "question" when something is worth raising at her next visit, and an "appointment" only when she mentions a specific date. ` : ""}If she explicitly asks you to log or save something, always include the matching line. Never mention this markup or say "I've logged it"; say something like "Tap below to save it" instead. Most answers need no lines at all.`;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const LEARN_SYSTEM = `You maintain the memory for Bloom, a private cycle and pregnancy app. Read the latest chat exchange and decide what is worth remembering about the user for future conversations.

Remember durable, personal things she says about herself: her history (first pregnancy, previous losses, IVF, conditions), medications and allergies, diet (vegetarian, aversions), her body and how it tends to react, work and routine, partner and family, her care provider and birth plans, preferences for how she likes information, and recurring worries or hopes.

Don't remember: anything only the assistant said, general facts, one-off daily symptoms (the app logs those), or anything already in memory. Write each fact as one short third-person line ("First pregnancy", "Vegetarian; eats eggs and dairy", "Partner is Sam", "Nervous about the glucose test"). If she corrects or contradicts a remembered fact, put its id in "forget" and add the corrected version. Usually there is nothing new: return empty lists.`;

const LEARN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["add", "forget"],
  properties: {
    add: { type: "array", items: { type: "string" } },
    forget: { type: "array", items: { type: "string" } },
  },
};

/** POST /api/ask {learn: true, messages} → {added, facts}: update the memory from the latest exchange. */
async function learn(messages: Msg[]) {
  const facts = await loadFacts();
  const exchange = messages.slice(-4).map((m) => `${m.role === "user" ? "Her" : "Bloom"}: ${m.content}`).join("\n\n");
  if (!messages.some((m) => m.role === "user")) return { added: [], facts };
  const out = fakeAi()
    ? { add: /first (pregnancy|baby)/i.test(exchange) ? ["First pregnancy"] : [], forget: [] }
    : await askJson<{ add: string[]; forget: string[] }>({
        system: LEARN_SYSTEM,
        schema: LEARN_SCHEMA,
        effort: "low",
        maxTokens: 2000,
        content: [{ type: "text", text: `Current memory (JSON):\n${JSON.stringify(facts.map(({ id, text }) => ({ id, text })))}\n\nLatest exchange:\n${exchange}` }],
      });
  const known = new Set(facts.map((f) => f.text.toLowerCase()));
  const added = out.add.map((t) => t.trim()).filter((t) => t && !known.has(t.toLowerCase())).slice(0, 5);
  if (!added.length && !out.forget.length) return { added, facts };
  const today = new Date().toISOString().slice(0, 10);
  const next: Fact[] = [
    ...facts.filter((f) => !out.forget.includes(f.id)),
    ...added.map((text) => ({ id: Math.random().toString(36).slice(2, 10), text, added: today })),
  ];
  return { added, facts: await saveFacts(next) };
}

/**
 * POST /api/ask {messages, context} → streams the answer as plain text.
 * The browser sends a compact summary of the user's data as `context`; what Bloom remembers
 * about her from earlier chats is added here.
 * GET /api/ask → {facts}; PUT /api/ask {facts} → {facts} (view and edit the memory);
 * POST /api/ask {learn: true, messages} → learn from the latest exchange.
 */
export default route(async (req: VercelRequest, res: VercelResponse) => {
  const m = method(req, "GET", "PUT", "POST");
  // What Bloom remembers is hers: only the main account can see, edit or add to it.
  if (m !== "POST" || req.body?.learn) await requireRole(req, "me");
  if (m === "GET") return { facts: await loadFacts() };
  if (m === "PUT") return { facts: await saveFacts(Array.isArray(req.body?.facts) ? req.body.facts : []) };
  const raw: unknown[] = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages: Msg[] = raw
    .filter((m): m is Msg => !!m && typeof m === "object" && ["user", "assistant"].includes((m as Msg).role) && typeof (m as Msg).content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    .slice(-20);
  if (req.body?.learn) return learn(messages);
  if (!messages.length || messages.at(-1)!.role !== "user") throw new HttpError(400, "Ask a question first.");
  const context = JSON.stringify(req.body?.context ?? {}).slice(0, 20_000);
  const memory = factsPrompt(await loadFacts());
  const pregnant = !!req.body?.context?.pregnant;
  const partner = pregnant && req.body?.context?.viewer === "partner";
  const today = typeof req.body?.context?.today === "string" ? req.body.context.today.slice(0, 10) : new Date().toISOString().slice(0, 10);

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Accel-Buffering", "no");

  if (fakeAi()) {
    const answer = req.body?.context?.pregnant
      ? `Mild cramping in early pregnancy is very common: your uterus is growing and the ligaments around it are stretching.\n\n- Rest, drink water and try a warm (not hot) shower\n- Acetaminophen is fine if you need it\n\nCall your doctor today if the cramps are strong, one-sided, or come with bleeding. Tap below to save it.\n[[bloom:{"type":"log","date":"${req.body?.context?.today ?? "2026-01-01"}","pain":"mild","symptoms":["Fatigue"]}]]\n[[bloom:{"type":"question","text":"Is the mild cramping I've been having normal at this stage?"}]]`
      : "Your cycles look healthy: they average **30 days**, which sits right inside the normal 24–38 range.\n\n- Most of yours land around 29 days\n- A couple ran longer (34 and 36 days), which usually just means you ovulated later that month\n\nKeep testing LH twice a day around your usual ovulation days so Bloom can confirm it.";
    res.status(200);
    for (const word of answer.split(/(?<= )/)) {
      res.write(word);
      await new Promise((r) => setTimeout(r, 8));
    }
    return res.end();
  }

  requireClaude();
  const client = new Anthropic({ apiKey: apiKey() });
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: `${partner ? PARTNER_SYSTEM : pregnant ? PREGNANT_SYSTEM : SYSTEM}${actionsPrompt(pregnant, today)}${partner ? "\nThe person chatting is the partner: only offer a \"log\" line when they explicitly ask to log something for the pregnant person, and write doctor questions in the pregnant person's voice." : ""}\n\n${partner ? "The pregnant person's" : "Her"} data (JSON, as of today):\n${context}${memory}`,
      messages,
    });
    res.status(200);
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") res.write(event.delta.text);
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") res.write("\n\nSorry, I can't help with that one. Your doctor is the best person to ask.");
    if (final.stop_reason === "max_tokens") res.write("…");
    res.end();
  } catch (err) {
    if (err instanceof Anthropic.APIError) console.error(`Anthropic API error ${err.status ?? "network"}: ${err.message}`);
    if (!res.headersSent) {
      if (err instanceof Anthropic.AuthenticationError) throw new HttpError(503, "The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.");
      if (err instanceof Anthropic.RateLimitError) throw new HttpError(429, "Bloom is busy right now. Try again in a minute.");
      throw new HttpError(502, "Bloom couldn't answer right now. Try again in a moment.");
    }
    res.write("\n\n(Sorry, the answer was cut off. Try asking again.)");
    res.end();
  }
});
