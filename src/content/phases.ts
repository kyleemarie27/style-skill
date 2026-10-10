import type { Phase } from "../../shared/cycle";

/**
 * The curated daily-note library. Each phase has a pool of lines per section; the note
 * rotates through them by cycle day so it doesn't read the same every morning.
 * Written to be general and gentle. It's information, not medical advice.
 */
export interface PhaseContent {
  title: string;
  tagline: string;
  hormones: string;
  expect: string[];
  superpowers: string[];
  watchouts: string[];
  care: string[];
  makeTheMost: string[];
  ttc: string[];
}

export const PHASES: Record<Phase, PhaseContent> = {
  menstrual: {
    title: "Menstrual phase",
    tagline: "Your winter: rest, reset, and let the new cycle begin.",
    hormones: "Estrogen and progesterone are at their lowest, which is why energy can dip.",
    expect: [
      "Cramps, lower-back ache, and feeling tired or heavy are common in the first 1–2 days.",
      "Bloating and looser digestion are usually easing off now that progesterone has dropped.",
      "Headaches can happen as estrogen bottoms out. Water and steady meals help.",
      "Your mood often lifts once the heaviest days pass. Many people feel relief here.",
      "You may feel cold more easily and want extra sleep. That's normal.",
    ],
    superpowers: [
      "Clear-eyed reflection: this is a good time to review what's working and what isn't.",
      "Your intuition and gut-checks tend to feel sharper. Listen to them.",
      "It's easier to say no and protect your time.",
      "It's a good moment to set intentions for the cycle ahead.",
    ],
    watchouts: [
      "Iron dips with blood loss. Lean on leafy greens, beans, red meat or lentils, with vitamin C.",
      "Don't schedule your most draining meetings on day 1–2 if you can help it.",
      "Hard HIIT may feel extra punishing. Go easier on yourself.",
      "Very heavy bleeding (soaking a pad or tampon every hour) or severe pain is worth a call to your doctor.",
    ],
    care: [
      "Heat on your belly or lower back and a slow walk can ease cramps.",
      "Warm, iron-rich meals: soups, stews, lentils, dark chocolate (it counts).",
      "Magnesium-rich foods (pumpkin seeds, spinach, almonds) can help cramps and sleep.",
      "Give yourself an earlier bedtime and a no-plans evening.",
      "Gentle movement such as yoga, stretching or walking beats nothing and beats overdoing it.",
    ],
    makeTheMost: [
      "Journal: what do you want this cycle to feel like?",
      "Do low-stakes admin and planning rather than big launches.",
      "Edit and review rather than create from scratch.",
      "Batch the to-do list for the high-energy days coming next week.",
    ],
    ttc: [
      "A new cycle is a fresh start. Log day 1 so your fertile-window prediction stays sharp.",
      "Keep taking your prenatal vitamin (folate!) every day.",
      "Restock ovulation strips so you're ready to start testing around day {lhStart}.",
      "If last cycle was a disappointment, let yourself feel it. You're doing everything right by showing up.",
    ],
  },

  follicular: {
    title: "Follicular phase",
    tagline: "Your spring: energy is rising and so is your optimism.",
    hormones: "Estrogen climbs as follicles mature. Mood, energy and focus usually rise with it.",
    expect: [
      "Energy, motivation and mood are on the way up.",
      "Skin often looks clearer and brighter.",
      "You may feel more social and more curious, and want to try new things.",
      "Cervical mucus starts to shift from dry to sticky or creamy as you get closer to ovulation.",
      "Sleep usually feels more restorative.",
    ],
    superpowers: [
      "Creativity and brainstorming: big-picture ideas come easily.",
      "Learning: your brain soaks up new skills faster right now.",
      "You're more willing to take on challenges and try new things.",
      "Planning and starting new projects.",
    ],
    watchouts: [
      "It's easy to overcommit when you feel great. Leave buffer for the second half of your cycle.",
      "Don't skip meals because you're busy. Steady fuel keeps the good energy going.",
      "Watch for over-scheduling your social calendar right before the two-week wait.",
    ],
    care: [
      "Try a harder workout: strength training and cardio feel easier now.",
      "Fresh, light foods such as salads, fermented foods and lean protein suit this phase.",
      "Get outside in the morning light. It anchors sleep and mood.",
      "Keep caffeine moderate; fewer than 200 mg/day is the usual TTC guidance.",
    ],
    makeTheMost: [
      "Start the thing: kick off a project, pitch an idea, or try a new class.",
      "Schedule brainstorms and creative work this week.",
      "Learn something new. This is your best time for it.",
      "Plan date nights for the fertile window coming up.",
    ],
    ttc: [
      "Start LH testing around cycle day {lhStart}. Afternoon testing catches the surge best.",
      "Check cervical mucus daily. Watch for it turning creamy, then wet.",
      "Sex every 2–3 days now keeps sperm healthy and on standby.",
      "Your fertile window is predicted to open in {daysToFertile} days.",
    ],
  },

  fertile: {
    title: "Fertile window",
    tagline: "Your summer begins: peak confidence, peak connection.",
    hormones: "Estrogen is near its peak and testosterone gets a small bump too.",
    expect: [
      "Higher libido is common, and it's on cue.",
      "Cervical mucus gets wetter and stretchier, like raw egg white at its most fertile.",
      "Energy, confidence and verbal fluency feel high.",
      "Some people notice mild one-sided pelvic twinges as a follicle grows.",
      "LH strips start getting darker. Watch for High readings.",
    ],
    superpowers: [
      "Communication: conversations, negotiations and presentations land well.",
      "Magnetism: you tend to feel (and come across) more confident and attractive.",
      "Collaboration: it's a great time for team work and hard conversations.",
      "Big asks: pitch, interview, or ask for the thing.",
    ],
    watchouts: [
      "Don't let fertile-window pressure kill the fun. Keep it connected, not clinical.",
      "Lubricants matter: many are sperm-unfriendly. Use a fertility-friendly one (like Pre-Seed) if needed.",
      "Skip hot tubs and saunas for your partner; heat isn't great for sperm.",
    ],
    care: [
      "Hydrate well. It helps fertile cervical mucus.",
      "Keep workouts strong but don't run yourself down.",
      "Protect sleep; it's easy to stay up late when you're buzzing.",
    ],
    makeTheMost: [
      "Book your presentations, pitches and tricky conversations for today.",
      "Plan something social or a date night. You'll enjoy it.",
      "Network and reach out. You'll come across at your best.",
    ],
    ttc: [
      "Fertile window day {fertileDay} of {fertileLength}: aim for sex today or every other day.",
      "Test LH once or twice a day (around 2pm and 8pm) so you don't miss a short surge.",
      "The 2 days before ovulation are the most fertile. Don't wait for a positive test to start.",
      "Sperm can live up to 5 days, so sex now still counts toward ovulation day.",
    ],
  },

  ovulation: {
    title: "Ovulation",
    tagline: "Peak summer: this is the main event.",
    hormones: "LH surges, triggering egg release within about 24–36 hours. Estrogen peaks, then dips.",
    expect: [
      "LH strips at High or Peak, with the test line as dark as or darker than control.",
      "Egg-white cervical mucus, and a high libido.",
      "Possible mild cramp on one side (mittelschmerz), light spotting, or breast tenderness.",
      "BBT will rise 0.3–0.5°F a day or so after ovulation, confirming it happened.",
      "Energy and confidence at their highest.",
    ],
    superpowers: [
      "Charisma: social energy and verbal skills peak.",
      "Courage: it's a great time to ask for what you want.",
      "Connection: intimacy and empathy come naturally.",
    ],
    watchouts: [
      "If you've only seen High (not Peak), keep testing. Some surges are short.",
      "Pressure on 'the day' is real. Remember, the day before counts just as much.",
      "Sharp or severe one-sided pain isn't typical; check in with a doctor if it happens.",
    ],
    care: [
      "Keep it fun: plan intimacy around connection, not just timing.",
      "Eat protein and fiber to steady the post-peak estrogen dip.",
      "Get a good night's sleep tonight.",
    ],
    makeTheMost: [
      "Have the big conversation, do the pitch, ask for the raise.",
      "Say yes to the social thing.",
      "Record a video, give a talk, do the podcast.",
    ],
    ttc: [
      "This is prime time: sex today and tomorrow gives the best odds.",
      "Got a Peak? Ovulation is likely in the next 24–36 hours. Log it so Bloom can confirm your window.",
      "After a Peak, you can stop testing LH for this cycle.",
      "Lying down for 10–15 minutes afterwards won't hurt and might help.",
    ],
  },

  tww_early: {
    title: "Two-week wait: early luteal",
    tagline: "Your autumn begins: settle in and nest.",
    hormones: "Progesterone rises to support a possible implantation, which can make you warmer and sleepier.",
    expect: [
      "Feeling warmer (BBT up), a little sleepier, and calmer.",
      "Breast tenderness or bloating as progesterone rises. This happens whether or not you're pregnant.",
      "Appetite may increase slightly.",
      "Energy steady but less bouncy than last week.",
    ],
    superpowers: [
      "Focus and follow-through: great for finishing what you started.",
      "Detail work: editing, organizing and wrapping up loose ends.",
      "A calm, steady mood for many people.",
    ],
    watchouts: [
      "Symptom-spotting is tempting, but early symptoms are almost all progesterone, pregnant or not.",
      "Avoid alcohol and limit caffeine as if you might be pregnant.",
      "Skip the very-early tests; a negative now means nothing and can sting.",
    ],
    care: [
      "Moderate exercise is great: walking, pilates, steady strength.",
      "Complex carbs and protein keep blood sugar and mood steady.",
      "Plan distractions you'll actually enjoy for the next two weeks.",
    ],
    makeTheMost: [
      "Finish projects and tie up loose ends.",
      "Deep-focus work blocks suit you now.",
      "Clean up, organize and nest at home.",
    ],
    ttc: [
      "{dpo} DPO. If an egg was fertilized, it's travelling toward the uterus right now.",
      "Keep taking your prenatal vitamin.",
      "Implantation usually happens 6–10 DPO, so testing is still too early.",
    ],
  },

  tww_mid: {
    title: "Two-week wait: mid luteal",
    tagline: "Steady autumn: progesterone is at its peak.",
    hormones: "Progesterone peaks, with a second, smaller estrogen rise.",
    expect: [
      "Possible bloating, breast tenderness, and feeling extra tired.",
      "Some people notice light spotting or cramping around 6–10 DPO (it can be implantation, or nothing).",
      "Cravings may start to show up.",
      "Sleep may get lighter.",
    ],
    superpowers: [
      "Getting things done: admin and systems feel satisfying.",
      "Nesting energy: home projects and meal prep.",
      "Your inner editor is sharp, which helps with quality control on your work.",
    ],
    watchouts: [
      "Anxiety can creep up mid-wait. Name it, then do something kind for yourself.",
      "Watch blood-sugar swings. Snack before you're starving.",
      "Testing now often gives false negatives. Hold off if you can.",
    ],
    care: [
      "Magnesium and B6-rich foods (bananas, salmon, chickpeas) may ease PMS-type symptoms.",
      "Gentle exercise and an earlier wind-down at night.",
      "Lower the bar on social plans if you're feeling depleted.",
    ],
    makeTheMost: [
      "Do tasks that need attention to detail.",
      "Meal-prep and plan the week ahead.",
      "Do something absorbing (a book, a puzzle, a project) to make the wait fly.",
    ],
    ttc: [
      "{dpo} DPO: implantation window. Nothing to do but be kind to yourself.",
      "Earliest reliable test: around {testDate}.",
      "Keep logging how you feel. It's useful pattern data either way.",
    ],
  },

  tww_late: {
    title: "Two-week wait: late luteal",
    tagline: "Late autumn: turn inward and be gentle.",
    hormones: "If no pregnancy, progesterone and estrogen fall, which brings on PMS. If pregnant, hCG keeps them up.",
    expect: [
      "PMS-type symptoms: irritability, cravings, bloating, breakouts or low mood.",
      "Breast soreness and tiredness. Pregnancy and PMS look the same here.",
      "More sensitive to stress and to sleep loss.",
    ],
    superpowers: [
      "Truth-telling: you notice what's not working. Write it down for next week.",
      "Wrapping up: closing loops feels great.",
      "Self-awareness and honest reflection.",
    ],
    watchouts: [
      "Test anxiety is real. Decide your test day in advance and stick to it.",
      "Don't make big decisions on the hardest PMS day.",
      "Salty and sugary cravings can worsen bloating and mood dips.",
    ],
    care: [
      "Warm, grounding foods and complex carbs.",
      "Extra sleep, a bath, and fewer obligations.",
      "Line up support: tell your partner or a friend how you're feeling.",
    ],
    makeTheMost: [
      "Clean out, close out, cancel what drains you.",
      "Solo work rather than big group sessions.",
      "Rest is productive this week.",
    ],
    ttc: [
      "{dpo} DPO. A first-morning test from {testDate} is reasonably reliable.",
      "If you test negative but your period hasn't come, test again in 2 days.",
      "Whatever the result, you did everything right this cycle.",
    ],
  },

  late: {
    title: "Period due",
    tagline: "Your period is due. Time to find out.",
    hormones: "If your period hasn't come, hCG may be holding progesterone up.",
    expect: [
      "Either PMS winding into your period, or a missed period.",
      "Cramping, tiredness and breast tenderness can mean either.",
    ],
    superpowers: [
      "Resilience: you've made it through the wait.",
    ],
    watchouts: [
      "Cycles vary by a few days even when regular. A late period alone isn't a diagnosis.",
      "If you've had several negative tests and no period for over a week, check in with your doctor.",
    ],
    care: [
      "Be extra gentle with yourself today, whichever way it goes.",
      "Plan something comforting for this evening.",
    ],
    makeTheMost: [
      "Keep your schedule light if you can.",
    ],
    ttc: [
      "Time to test: use first-morning urine.",
      "Positive? Log it, then call your doctor to book your first appointment. 💛",
      "Period arrived? Log day 1 and Bloom starts the next cycle's predictions.",
    ],
  },

  unknown: {
    title: "Welcome to Bloom",
    tagline: "Log your last period (or import your history) to unlock your daily note.",
    hormones: "",
    expect: ["Once Bloom knows your last period, you'll see what to expect each day."],
    superpowers: ["Importing your Clue or Premom history gives you predictions from day one."],
    watchouts: [],
    care: [],
    makeTheMost: [],
    ttc: ["Tap “Import history” or log your last period start to begin."],
  },
};

/** Pick `n` lines from a pool, rotating daily so the note feels fresh. */
export function pick(pool: string[], seed: number, n = 2): string[] {
  if (pool.length <= n) return pool;
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(pool[(seed + i * 3) % pool.length]);
  return [...new Set(out)];
}

export function fill(line: string, vars: Record<string, string | number | null | undefined>): string {
  return line.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? "—").toString());
}
