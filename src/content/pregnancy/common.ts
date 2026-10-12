import type { Item } from "./types";

/**
 * Trimester-wide pools mixed into each week's guide (rotated by day so they stay fresh).
 * General information drawn from ACOG, the NHS, CDC and Mayo Clinic guidance. Not medical advice.
 */
export interface TrimesterPool {
  name: string;
  tagline: string;
  food: Item[];
  movement: Item[];
  rest: Item[];
  watchouts: Item[];
}

export const TRIMESTERS: Record<1 | 2 | 3, TrimesterPool> = {
  1: {
    name: "First trimester",
    tagline: "Weeks 1–13: the foundation weeks. Huge changes you can't see yet.",
    food: [
      { t: "Prenatal vitamin with 400–800 mcg folic acid, every day.", why: "Folate protects the neural tube, which closes by about week 6." },
      { t: "Small meals every 2–3 hours, and a few crackers before you get out of bed.", why: "An empty stomach makes nausea worse." },
      { t: "Protein at every meal: eggs, Greek yogurt, beans, chicken, tofu.", why: "Baby's cells are dividing fast; protein is the raw material." },
      { t: "Ginger: tea, chews, or real ginger ale.", why: "Ginger has good evidence for easing pregnancy nausea." },
      { t: "Cold foods are often easier than hot ones when you're queasy.", why: "They smell less, and smell is a big nausea trigger." },
      { t: "Caffeine under 200 mg a day: about one 12-oz coffee.", why: "ACOG's limit. Higher intake is linked to a higher miscarriage risk." },
      { t: "Skip: raw or undercooked meat, fish, and eggs; unpasteurized milk and soft cheeses; deli meat unless steaming hot.", why: "Listeria, salmonella and toxoplasma are riskier in pregnancy." },
      { t: "Fish is good, just low-mercury: salmon, sardines, cod, shrimp, canned light tuna. Avoid shark, swordfish, king mackerel, bigeye tuna.", why: "Omega-3s (DHA) build baby's brain and eyes." },
      { t: "No alcohol. There's no known safe amount.", why: "Alcohol crosses the placenta. If you drank before you knew, that's very common; mention it to your doctor and move on." },
      { t: "Sip water all day: aim for 8–12 cups.", why: "Your blood volume is starting to rise, and dehydration worsens nausea and headaches." },
      { t: "Vitamin B6 (10–25 mg, up to 3× a day) can help nausea.", why: "Recommended by ACOG as a first step. Ask your doctor before starting." },
    ],
    movement: [
      { t: "Keep doing what you did before, at an easier pace.", why: "Exercise is safe and helps energy, mood and sleep." },
      { t: "Aim for 150 minutes a week of moderate activity, broken up however you like.", why: "ACOG's recommendation for healthy pregnancies." },
      { t: "Use the talk test: you should be able to hold a conversation.", why: "A simple way to keep intensity moderate." },
      { t: "Walking after meals can settle nausea and blood sugar." },
      { t: "Avoid contact sports, hot yoga, and anything with a high fall risk.", why: "Overheating and falls are the main exercise risks." },
      { t: "Start pelvic floor exercises (Kegels): 10 squeezes, 3 times a day.", why: "A stronger pelvic floor helps with bladder control now and recovery later." },
    ],
    rest: [
      { t: "Nap without guilt. First-trimester exhaustion is real.", why: "Progesterone is a sedative, and your body is building a placenta." },
      { t: "Go to bed earlier rather than pushing through the evening." },
      { t: "Fresh air and an open window help both nausea and fatigue." },
      { t: "Tell one or two people you trust, even if you're waiting to share widely.", why: "Support makes the hard days lighter." },
      { t: "Lower the bar on chores and plans for now. This phase passes." },
    ],
    watchouts: [
      { t: "Medications: check before taking anything new, including supplements. Acetaminophen (Tylenol) is the usual go-to for pain; avoid ibuprofen and aspirin unless your doctor says otherwise." },
      { t: "Hot tubs and saunas: skip them.", why: "Raising your core temperature above 102°F in early pregnancy is linked to birth defects." },
      { t: "Cat litter: hand it off, or wear gloves and wash up.", why: "Toxoplasmosis spreads through cat feces." },
      { t: "Smoking and vaping: stop for both of you. Ask for help if it's hard." },
      { t: "Call your doctor about heavy bleeding, strong cramps or one-sided pain, a fever, or vomiting so bad you can't keep fluids down." },
      { t: "Miscarriage worries are normal. Most pregnancies that reach a heartbeat on ultrasound continue.", why: "The risk drops sharply after 8 weeks, and again after 12." },
    ],
  },
  2: {
    name: "Second trimester",
    tagline: "Weeks 14–27: often the easiest stretch. Energy returns and you start to show.",
    food: [
      { t: "You need about 340 extra calories a day now: roughly a yogurt and a handful of nuts.", why: "Baby's growth speeds up." },
      { t: "Iron: lean red meat, beans, lentils, spinach, fortified cereal, with vitamin C.", why: "Your blood volume rises by up to 50%; low iron causes fatigue and breathlessness." },
      { t: "Calcium: about 1,000 mg a day (dairy, fortified milks, tofu, almonds).", why: "Baby's bones are hardening." },
      { t: "Fiber and water to keep things moving.", why: "Progesterone slows digestion; iron in prenatals can add to constipation." },
      { t: "Small meals and not lying down after eating help heartburn." },
      { t: "Two servings a week of low-mercury fish for DHA." },
      { t: "Keep washing produce and heating deli meats until steaming." },
    ],
    movement: [
      { t: "This is the sweet spot for exercise: swimming, walking, prenatal yoga, strength training.", why: "Energy is up and your bump is still manageable." },
      { t: "After 20 weeks, avoid long stretches lying flat on your back during workouts.", why: "Your uterus can press on a large vein and make you dizzy." },
      { t: "Squats and glute bridges build strength for carrying baby (and the car seat)." },
      { t: "Swimming is a gift: it takes the weight off your joints." },
      { t: "Watch your balance as your bump grows. Choose stable ground." },
    ],
    rest: [
      { t: "Start sleeping on your side; a pregnancy pillow helps.", why: "Side-sleeping, especially left, improves blood flow to the placenta in later pregnancy." },
      { t: "Moisturize your belly if it feels itchy.", why: "Stretching skin can itch. Stretch marks are mostly genetic, but moisturizer helps comfort." },
      { t: "Plan a babymoon or a weekend of rest while traveling is easy.", why: "Most providers prefer travel before 28–32 weeks." },
      { t: "Put your feet up when you can to ease swelling." },
    ],
    watchouts: [
      { t: "Call about any bleeding, fluid leaking, regular cramping or tightening, or a fever." },
      { t: "Round ligament pain (a sharp jab low on one side when you move) is common. Strong, constant pain isn't; call about that." },
      { t: "Dizziness: stand up slowly, eat regularly and drink water." },
      { t: "Itching all over, especially palms and soles, can be cholestasis. Tell your doctor." },
      { t: "After 20 weeks: a bad headache, vision changes, or sudden swelling of face or hands need a same-day call." },
    ],
  },
  3: {
    name: "Third trimester",
    tagline: "Weeks 28–40: the home stretch. Baby gains weight and gets ready to meet you.",
    food: [
      { t: "About 450 extra calories a day now.", why: "Baby gains about half a pound a week near the end." },
      { t: "Smaller meals more often as your stomach gets squished." },
      { t: "Keep up iron and protein; ask whether you need extra iron.", why: "Anemia is common late in pregnancy." },
      { t: "Dates in the last weeks: some studies link 6 a day from 36 weeks to an easier early labor.", why: "The evidence is small but promising, and they're a good snack anyway." },
      { t: "Plenty of fluids, especially in hot weather.", why: "Dehydration can trigger Braxton Hicks contractions." },
    ],
    movement: [
      { t: "Keep moving gently: walking, swimming, prenatal yoga.", why: "Staying active is linked to shorter labors and less back pain." },
      { t: "Hands-and-knees rocking and pelvic tilts ease back pain." },
      { t: "Birth ball bouncing opens your hips and is comfy to sit on." },
      { t: "Stop and call if you feel chest pain, dizziness, fluid leaking or painful contractions while exercising." },
    ],
    rest: [
      { t: "Side-sleep with a pillow between your knees and one under your bump.", why: "Going to sleep on your side from 28 weeks is linked to a lower stillbirth risk." },
      { t: "Wake to pee? Keep the lights dim to fall back asleep faster." },
      { t: "Get to know baby's movement pattern and check in with it every day.", why: "A change in pattern is the signal, not a specific number." },
      { t: "Pack a little calm into each day: a bath (warm, not hot), a walk, a nap." },
    ],
    watchouts: [
      { t: "Movements slowing or changing: call labor & delivery the same day. Don't wait." },
      { t: "Severe headache, vision changes, pain under the right ribs, or sudden swelling: call now (preeclampsia signs)." },
      { t: "Before 37 weeks: regular contractions, pelvic pressure, or a gush or trickle of fluid can be preterm labor. Call." },
      { t: "Bleeding at any point: call." },
      { t: "Severe itching, especially palms and soles: tell your doctor (cholestasis)." },
    ],
  },
};

/** Always-on: when to call. Shown in the "Watch for" tab under the week's notes. */
export const CALL_NOW: Item[] = [
  { t: "Heavy bleeding, or bleeding with strong cramps or pain." },
  { t: "Strong one-sided belly pain, shoulder-tip pain, or fainting (especially before 12 weeks)." },
  { t: "Fever of 100.4°F (38°C) or higher." },
  { t: "Vomiting so much you can't keep fluids down for 24 hours." },
  { t: "After 20 weeks: severe headache, vision changes, or sudden swelling of face or hands." },
  { t: "Fluid leaking, regular contractions before 37 weeks, or baby moving less than usual." },
];

/** What the first prenatal visit usually covers (for the Doctor page). */
export const FIRST_VISIT: Item[] = [
  { t: "The first day of your last period, and how regular your cycles are.", why: "This dates the pregnancy. Bloom has it for you." },
  { t: "Your health history: conditions, past pregnancies, surgeries, mental health." },
  { t: "Every medication and supplement you take, including doses." },
  { t: "Family history on both sides (genetic conditions, twins, diabetes, high blood pressure)." },
  { t: "Bleeding, cramping, nausea and vomiting since your positive test.", why: "Bloom's visit summary lists all of it." },
  { t: "Lifestyle: alcohol, smoking, caffeine, exercise, work hazards, and your safety at home." },
  { t: "They'll usually do blood work, a urine test, blood pressure and weight, and often an early ultrasound." },
  { t: "Bring your questions. Nothing is too small to ask." },
];
