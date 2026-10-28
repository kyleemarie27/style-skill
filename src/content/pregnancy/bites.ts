import { SYMPTOMS } from "./library";
import type { Item, WeekContent } from "./types";

export const trimesterOf = (week: number): 1 | 2 | 3 => (week < 14 ? 1 : week < 28 ? 2 : 3);

/**
 * Little things for today: a short to-do list to check off.
 * Everything rotates by gestational day, so each day of the week brings something new.
 */

export interface Habit extends Item {
  /** Only suggest from this week on. */
  minWeek?: number;
}

/** Small things to do today. Kept tiny on purpose: each takes minutes. */
export const HABITS: Record<1 | 2 | 3, Habit[]> = {
  1: [
    { t: "Drink a big glass of water before lunch", why: "Dehydration makes nausea and headaches worse." },
    { t: "Have a protein snack mid-morning", why: "An empty stomach is a nausea trigger, and protein keeps you steady." },
    { t: "Get 10 minutes of fresh air", why: "Light movement and air help with both queasiness and tiredness." },
    { t: "Do 10 Kegels, three times today", why: "A strong pelvic floor helps bladder control now and recovery later." },
    { t: "Go to bed 30 minutes earlier tonight", why: "Your body is building a placenta. It needs the sleep." },
    { t: "Put crackers by your bed for tomorrow morning", why: "A few bites before you stand up can blunt morning nausea." },
    { t: "Eat one folate-rich food: greens, beans, lentils or an orange", why: "Folate supports the baby's brain and spinal cord." },
    { t: "Ask someone to take one chore off your plate this week" },
    { t: "Check the label of any supplement or medicine you're unsure about", why: "Your pharmacist can tell you in a minute what's fine in pregnancy." },
  ],
  2: [
    { t: "Drink a big glass of water before lunch", why: "Your blood volume is up 30–50%; water keeps up with it." },
    { t: "Pair an iron-rich food with vitamin C", why: "Vitamin C helps you absorb iron. Think beans with peppers or spinach with orange." },
    { t: "Take a 20-minute walk", why: "Helps energy, sleep, mood and blood sugar." },
    { t: "Do 10 Kegels, three times today" },
    { t: "Practice side-sleeping with a pillow between your knees", why: "Getting used to it now makes the third trimester easier." },
    { t: "Moisturize your belly and hips", why: "It won't prevent stretch marks, but it helps with itchy, stretching skin." },
    { t: "Get two servings of calcium: yogurt, milk, cheese or fortified tofu", why: "Baby's bones are hardening fast." },
    { t: "Talk or sing to the baby for a minute", why: "From around 18 weeks, baby can start to hear sounds.", minWeek: 18 },
    { t: "Write down one question for your next appointment" },
    { t: "Do 5 minutes of cat-cow stretches for your back" },
  ],
  3: [
    { t: "Do a kick count after a meal", why: "Most babies make 10 movements within 2 hours. Learn your baby's normal.", minWeek: 28 },
    { t: "Put your feet up for 15 minutes", why: "Helps swelling in your feet and ankles." },
    { t: "Pack one thing in your hospital bag", minWeek: 32 },
    { t: "Do 10 Kegels, three times today" },
    { t: "Practice slow breathing for 5 minutes", why: "In for 4, out for 6. You'll use it in labor and on sleepless nights." },
    { t: "Take a gentle 15-minute walk" },
    { t: "Eat a fiber-rich snack: prunes, pears, oats or chia", why: "Constipation tends to peak now." },
    { t: "Sleep on your side tonight", why: "Side-sleeping from 28 weeks is linked to a lower stillbirth risk." },
    { t: "Hand off one task to your partner or a friend" },
    { t: "Read up on one sign of labor", why: "Knowing what's normal makes it easier to know when to call." },
    { t: "Drink water with every meal and snack" },
  ],
};

export interface DailyTodo extends Item {
  /** Where the check mark is stored: today's list, or the week's to-do list (shared with the guide). */
  scope: "day" | "week";
}

/** Rotate by `seed` and take `n`. */
function take<T>(pool: T[], n: number, seed: number): T[] {
  if (!pool.length) return [];
  const k = ((seed % pool.length) + pool.length) % pool.length;
  return [...pool.slice(k), ...pool.slice(0, k)].slice(0, Math.min(n, pool.length));
}

/**
 * Today's to-dos when AI isn't writing them: one from this week's list (spread across the week),
 * one for a symptom logged lately (from its "what helps" list), and small habits to make three.
 */
export function dailyTodos(week: WeekContent, day: number, totalDays: number, symptoms: string[] = []): DailyTodo[] {
  const pool = HABITS[trimesterOf(week.week)].filter((h) => !h.minWeek || week.week >= h.minWeek);
  const weekly = week.todo.length ? [{ ...week.todo[day % week.todo.length], scope: "week" as const }] : [];
  const known = symptoms.filter((s) => SYMPTOMS[s]?.helps.length);
  const symptom = known.length ? known[totalDays % known.length] : null;
  const forSymptom: DailyTodo[] = symptom
    ? [{ t: take(SYMPTOMS[symptom].helps, 1, totalDays)[0], why: `For the ${symptom.toLowerCase()} you've logged lately.`, scope: "day" }]
    : [];
  const habits = take(pool, 3 - weekly.length - forSymptom.length, totalDays * 2).map((h) => ({ t: h.t, why: h.why, scope: "day" as const }));
  return [...weekly, ...forSymptom, ...habits];
}

/** Things to look forward to, so there's always a countdown to something. Week = the day that week starts. */
export const MILESTONES: { week: number; icon: string; t: string }[] = [
  { week: 6, icon: "💓", t: "Baby's heart starts to beat. It can flicker on an ultrasound from about now." },
  { week: 8, icon: "🫀", t: "Every major organ has started to form." },
  { week: 10, icon: "🌱", t: "Officially a fetus. The riskiest stretch of development is behind you." },
  { week: 12, icon: "📣", t: "Lots of people share their news around now, once the risk of miscarriage has dropped a lot." },
  { week: 14, icon: "🌤️", t: "Second trimester! For many, nausea fades and energy comes back." },
  { week: 18, icon: "👂", t: "Baby can start to hear your voice, and the first flutters could come any day." },
  { week: 20, icon: "🎉", t: "Halfway there, and usually the anatomy scan." },
  { week: 24, icon: "🫁", t: "A big milestone: babies born from now on have a real chance with intensive care." },
  { week: 28, icon: "🌙", t: "Third trimester. Baby can open their eyes and blink." },
  { week: 32, icon: "🤸", t: "Baby is practising breathing and most have turned head-down or will soon." },
  { week: 37, icon: "🧳", t: "Early term. Bag packed, car seat in." },
  { week: 39, icon: "✨", t: "Full term. Baby is ready whenever they decide." },
  { week: 40, icon: "📅", t: "Your due date." },
];

/** The next milestone after today, and how many days away it is. */
export function nextMilestone(totalDays: number) {
  const m = MILESTONES.find((x) => x.week * 7 > totalDays);
  return m ? { ...m, inDays: m.week * 7 - totalDays } : null;
}
