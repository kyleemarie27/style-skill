import type { Phase } from "../../shared/cycle";

/**
 * The partner's guide to the cycle, written to the partner. "{name}" is the first name of the person
 * tracking (Settings → Pregnancy names), or "your partner". No pronouns for either of them.
 * General information, evidence-based where it makes a claim (ASRM, ACOG, NHS). Edit freely.
 */
export interface PartnerPhase {
  /** Short label, e.g. "Period week". */
  label: string;
  /** One or two sentences on what's going on. */
  summary: string;
  /** What to expect from {name} this phase. */
  expect: string[];
  /** How to support. */
  support: string[];
  /** What tends to land badly. */
  avoid: string[];
  /** One idea for the two of you. */
  together: string;
}

export const PARTNER_PHASES: Partial<Record<Phase, PartnerPhase>> = {
  menstrual: {
    label: "Period week",
    summary: "{name}'s hormones are at their lowest and the uterus is shedding its lining. Low energy is normal this week: it's reset week.",
    expect: [
      "Cramps, back ache and tiredness, strongest on days 1–2.",
      "Quieter and less up for plans. That's hormones, not a signal about you.",
      "Mood often lifts once bleeding starts, after the dip in the days before.",
    ],
    support: [
      "Bring the heat pad and pain relief early, before the cramps peak. That works better than waiting.",
      "Take dinner off the list for a night or two.",
      "If the last cycle ended in a negative test, let it be sad. You don't have to fix it; being there is the job.",
    ],
    avoid: ["Booking a big social weekend for days 1–2.", "Starting the next cycle's plan before the last one has been felt."],
    together: "A movie night at home with zero plans attached.",
  },
  follicular: {
    label: "Build-up",
    summary: "Estrogen is rising, so energy, mood and confidence climb day by day. The fertile window is coming.",
    expect: [
      "More energy, more social, more up for plans and new things.",
      "Optimism and a 'let's go' feeling.",
      "LH strips start soon, once a day at first.",
    ],
    support: [
      "This is the week for adventures, dates and anything that needs energy.",
      "Your prep counts too: sleep, go easy on alcohol, and skip hot tubs, saunas and a laptop on your lap. Heat lowers sperm quality.",
      "Keep things flowing: sex or ejaculating every 2–3 days keeps sperm fresh. More than 5 days off lowers quality.",
      "If you use lubricant, switch to a sperm-friendly one (like Pre-Seed). Many regular ones slow sperm down.",
    ],
    avoid: ["Talking about the coming window like a deadline."],
    together: "Try something neither of you has done before: a new restaurant, a hike, a class.",
  },
  fertile: {
    label: "The window",
    summary: "The fertile window is open. Estrogen is near its peak, and desire, confidence and closeness often peak with it.",
    expect: [
      "A higher sex drive and more flirting. That's real, and it's hormonal.",
      "LH strips getting darker; {name} may test twice a day now.",
      "Some pressure or nerves about timing, for both of you. Very common.",
    ],
    support: [
      "Make it a date, not a task: you initiate, you flirt, you plan the evening.",
      "Every 1–2 days from now until the day after the LH peak covers it. Every other day works about as well as every day.",
      "Missed a day? The next one counts too. No single day makes or breaks a cycle.",
    ],
    avoid: ["\"We have to tonight.\" Scheduling language is a mood killer; flirt instead.", "Keeping score of days."],
    together: "Phones in another room, something good for dinner, nowhere to be.",
  },
  ovulation: {
    label: "Peak days",
    summary: "The egg is released around now. These are the highest-odds days of the cycle.",
    expect: [
      "Peak energy and confidence.",
      "Maybe a one-sided twinge low in the belly. Ovulation pain is common and harmless.",
      "An LH Peak on the strip: ovulation usually follows within 12–36 hours.",
    ],
    support: [
      "Today and tomorrow are the ones that matter most. Keep it relaxed and fun.",
      "From ovulation day, {name}'s wait list starts. Join in where you can.",
    ],
    avoid: ["Making tonight feel like a test."],
    together: "A proper date night. Not a task, a date.",
  },
  tww_early: {
    label: "The wait begins",
    summary: "Your part is done. Progesterone is rising, which tends to make {name} calmer, cozier and more of a homebody.",
    expect: [
      "Lower energy than last week and a pull toward home.",
      "A warmer body temperature (Oura shows it). That rise confirms ovulation happened.",
      "{name} is protecting the wait: the list below.",
    ],
    support: [
      "Join the wait list where you can: mocktails together, skip the sauna together.",
      "Plan cozy, not loud.",
      "Talk about anything but the wait sometimes.",
    ],
    avoid: ["Asking about symptoms every day.", "Reading anything into cramps, tiredness or moods this early."],
    together: "Cook something slow together on a weeknight.",
  },
  tww_mid: {
    label: "Middle of the wait",
    summary: "Progesterone is at its peak. If an embryo is there, this is when it implants, and nothing can be felt or tested yet.",
    expect: [
      "Steady but tired, sometimes bloated or a bit sore.",
      "Waiting is hard on both of you, even when it doesn't show.",
    ],
    support: [
      "Keep life normal and fun: plans, friends, distractions.",
      "If {name} wants to talk about it, listen. If not, don't bring it up.",
    ],
    avoid: ["Symptom spotting (\"sore? that's a sign!\"). Early pregnancy and PMS feel the same."],
    together: "Something absorbing: a game night, a long walk, a series to binge.",
  },
  tww_late: {
    label: "The hard part of the wait",
    summary: "The days before a period. If there's no pregnancy, hormones drop now, which can bring PMS, sensitivity and nerves about testing.",
    expect: [
      "A shorter fuse, tears, tender breasts or bloating. PMS and early pregnancy look the same, so none of it is a sign either way.",
      "Nerves about the test.",
    ],
    support: [
      "Extra patience. A short fuse this week isn't about you.",
      "Ask how {name} wants test day to go: together, alone, first thing or later.",
      "Plan something nice for the day after test day, whatever it says.",
    ],
    avoid: ["Pushing to test early. A test before the date often says negative when it's too soon to know."],
    together: "An early night, and something warm.",
  },
  late: {
    label: "Test day",
    summary: "The period is late, so a test now gives a clear answer.",
    expect: ["Big feelings either way."],
    support: [
      "Be there for the test if {name} wants you there.",
      "If it's negative: it's a real loss of hope. Sit with it; you don't need to say anything clever. A new window opens in about two weeks.",
      "If it's positive: celebrate, then let Bloom switch over (Settings → I got a positive test).",
    ],
    avoid: ["Jumping straight to \"next month\" if it's negative."],
    together: "Whatever {name} needs today.",
  },
};

/** How to help with what {name} logged today. Keys match the check-in's symptoms and moods. */
export const CYCLE_HELP: Record<string, string> = {
  Cramps: "Heat pad, pain relief and a lighter evening.",
  Headache: "Water, a dark quiet room, and fewer plans.",
  Bloating: "Comfy clothes, a lighter dinner, a short walk together.",
  "Tender breasts": "Go gentle with hugs.",
  Acne: "Say nothing about it. Seriously.",
  Tired: "Cover chores tonight and protect an early bedtime.",
  "Back pain": "Offer a lower-back rub and do the lifting.",
  Nausea: "Plain snacks, fresh air, and keep strong smells away.",
  Cravings: "Bring the thing. No commentary.",
  "Ovulation pain": "A one-sided twinge around ovulation is normal. Heat helps.",
  "High libido": "Take the hint.",
  Anxious: "Ask what's on {name}'s mind, then just listen.",
  Irritable: "Give space, keep it light, don't take it personally.",
  Sad: "Sit together. Fixing isn't the job; company is.",
  Sensitive: "Softer words and fewer jokes at {name}'s expense today.",
  Happy: "Enjoy it together.",
  Calm: "A good night for a slow evening together.",
  Energetic: "Suggest something active together.",
};

/** For the first cycle after a pregnancy loss. */
export const PARTNER_AFTER_LOSS =
  "This is your first cycle after the loss. Grief tends to come back around the fertile window and test day, for partners too. Excitement and sadness can sit side by side; it helps to say both out loud.";

export const fillName = (t: string, name: string) => t.replace(/\{name\}/g, name || "your partner").replace(/^your partner/, "Your partner");
