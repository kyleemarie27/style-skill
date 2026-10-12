import Anthropic from "@anthropic-ai/sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { method, route } from "./_lib/auth.js";
import { apiKey, fakeAi, MODEL, requireClaude } from "./_lib/claude.js";
import { HttpError } from "./_lib/db.js";

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
- Plain text with simple markdown (**bold**, "- " bullets). No headings, no tables.`;

interface Msg {
  role: "user" | "assistant";
  content: string;
}

/**
 * POST /api/ask {messages, context} → streams the answer as plain text.
 * The browser sends a compact summary of the user's data as `context`.
 */
export default route(async (req: VercelRequest, res: VercelResponse) => {
  method(req, "POST");
  const raw: unknown[] = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages: Msg[] = raw
    .filter((m): m is Msg => !!m && typeof m === "object" && ["user", "assistant"].includes((m as Msg).role) && typeof (m as Msg).content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    .slice(-20);
  if (!messages.length || messages.at(-1)!.role !== "user") throw new HttpError(400, "Ask a question first.");
  const context = JSON.stringify(req.body?.context ?? {}).slice(0, 20_000);

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Accel-Buffering", "no");

  if (fakeAi()) {
    const answer = req.body?.context?.pregnant
      ? "Mild cramping in early pregnancy is very common: your uterus is growing and the ligaments around it are stretching.\n\n- Rest, drink water and try a warm (not hot) shower\n- Acetaminophen is fine if you need it\n\nCall your doctor today if the cramps are strong, one-sided, or come with bleeding."
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
      system: `${req.body?.context?.pregnant ? PREGNANT_SYSTEM : SYSTEM}\n\nHer data (JSON, as of today):\n${context}`,
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
