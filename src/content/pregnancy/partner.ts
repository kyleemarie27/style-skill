import { trimesterOf } from "./bites";
import type { Item, WeekContent } from "./types";

/**
 * The partner view: what's going on, and what to actually do about it. Written to the partner.
 * {name} becomes the pregnant partner's first name (or "your partner"), so nothing here
 * needs a pronoun for them.
 */

/** One small, concrete thing to do each day, rotated within the trimester. */
export const PARTNER_DAILY: Record<1 | 2 | 3, Item[]> = {
  1: [
    { t: "Keep a stash of plain crackers or pretzels on {name}'s nightstand.", why: "A few bites before getting up can blunt morning nausea." },
    { t: "Cook or order dinner tonight without asking what to make. Keep it bland and low-smell.", why: "Cooking smells are a top nausea trigger right now." },
    { t: "Take the trash and recycling out before it smells.", why: "A heightened sense of smell is real in the first trimester." },
    { t: "Ask \"What's one thing I can take off your plate this week?\" and then do it." },
    { t: "Refill {name}'s water bottle and leave it within reach.", why: "Dehydration makes nausea and headaches worse." },
    { t: "Plan a cozy night in: a movie, a blanket, an early bedtime.", why: "First-trimester exhaustion is as tiring as a bad flu." },
    { t: "Ask how {name} is feeling, then listen without trying to fix it." },
    { t: "Pick up ginger chews, ginger ale or peppermint tea on your way home.", why: "Ginger has decent evidence for easing nausea." },
    { t: "Handle tonight's dishes and the kitchen cleanup." },
    { t: "Put the next prenatal appointment in your own calendar and plan to go if you can." },
    { t: "Take over cleaning the litter box, if you have a cat.", why: "Cat feces can carry toxoplasmosis, which is risky in pregnancy." },
    { t: "Read this week's guide in Bloom so you know what's happening without being told." },
    { t: "Say out loud one thing you're excited about. It helps to hear it." },
    { t: "Let {name} nap without guilt. Cover whatever needs covering." },
    { t: "Agree together on who you'll tell and when, so nobody's caught off guard.", why: "Many couples wait until around 12 weeks; there's no wrong answer." },
    { t: "Make a protein-rich snack and bring it over before it's asked for.", why: "An empty stomach makes nausea worse." },
    { t: "Do a grocery run so the fridge has the foods {name} can actually stomach this week." },
    { t: "Give a back or foot rub tonight, no strings attached." },
    { t: "Skip the strong cologne, garlic-heavy lunch or smoky clothes for a while." },
    { t: "Ask \"Is anything worrying you about the pregnancy?\" and make space for the answer." },
    { t: "Check in on how you're feeling, too. Talk to a friend who's been through it." },
    { t: "Look up the doctor's after-hours number and save it in your phone." },
    { t: "Send {name} a midday text that has nothing to do with the pregnancy." },
    { t: "Make the bedroom extra dark and quiet tonight.", why: "Sleep is doing a lot of the work of growing a placenta right now." },
  ],
  2: [
    { t: "Plan a date this week. Energy often comes back in the second trimester, so make the most of it." },
    { t: "Put your hand on the bump and talk to the baby for a minute.", why: "From around 18 weeks, the baby can start to hear voices." },
    { t: "Book the anatomy scan off in your calendar and go together if you can.", why: "Around 20 weeks, it's often the most memorable appointment." },
    { t: "Take a 20-minute walk together after dinner." },
    { t: "Ask {name} what still feels hard, now that the first trimester is done." },
    { t: "Pick one baby-prep task and own it start to finish: research car seats, strollers or daycare." },
    { t: "Rub lotion on the bump tonight.", why: "Stretching skin gets itchy; it won't stop stretch marks, but it feels good." },
    { t: "Get a pregnancy pillow, or set up extra pillows for side sleeping.", why: "Side sleeping gets more comfortable with support between the knees and behind the back." },
    { t: "Make a list of baby names you love and compare notes." },
    { t: "Take a bump photo of {name} this week, somewhere with nice light." },
    { t: "Sign up for a childbirth or newborn-care class together." },
    { t: "Ask {name} what the birth should feel like, and what support looks like on the day." },
    { t: "Take over one recurring chore for the rest of the pregnancy. Say which one out loud." },
    { t: "Read to the bump: anything works, even the sports section." },
    { t: "Plan a babymoon or a night away, even a small one." },
    { t: "Ask how {name} is sleeping, and what would help." },
    { t: "Look into your parental leave and write down the dates.", why: "Knowing how much time you'll have makes planning easier." },
    { t: "Make sure you're up to date on your Tdap and flu shots.", why: "Anyone close to a newborn should be, to help protect the baby." },
    { t: "Notice the baby kicking? Ask to feel it. Kicks are often felt from the outside around 20–24 weeks." },
    { t: "Make {name}'s favorite meal this week." },
    { t: "Tell {name} one specific thing {name} will be great at as a parent." },
    { t: "Start clearing out the room or corner where the baby will sleep." },
    { t: "Put together the baby registry with {name}, or offer to handle the boring parts." },
    { t: "Ask your own family what you were like as a baby. Share the stories." },
  ],
  3: [
    { t: "Practice the drive to the hospital, and figure out where to park." },
    { t: "Install the car seat and get it checked.", why: "Many fire stations and hospitals will check it for free." },
    { t: "Pack your own hospital bag: snacks, charger, a change of clothes, toothbrush." },
    { t: "Learn the signs of labor and when to call the hospital.", why: "Often regular contractions about 5 minutes apart for an hour, or waters breaking." },
    { t: "Take over anything that means bending, lifting or crouching." },
    { t: "Give a foot rub and prop up {name}'s feet tonight.", why: "It helps with swelling in the feet and ankles." },
    { t: "Ask what would help most during labor: words, touch, quiet, music?" },
    { t: "Batch-cook and freeze two meals for after the birth." },
    { t: "Keep your phone charged and on loud from 37 weeks." },
    { t: "Ask how the baby has been moving today.", why: "From 28 weeks, fewer movements than usual is a reason to call the doctor the same day." },
    { t: "Set up the bassinet or crib and wash a first load of baby clothes." },
    { t: "Plan who'll handle visitors, and how you'll protect quiet time after the birth." },
    { t: "Learn how to swaddle and change a diaper. Practice on a stuffed animal." },
    { t: "Help {name} get comfortable in bed: pillows, water, and the phone charger in reach." },
    { t: "Sort out a plan for pets and other kids for when labor starts." },
    { t: "Go to the next appointment if you can, and bring one question of your own." },
    { t: "Write down what you're feeling about becoming a parent. Share it if you want." },
    { t: "Ask \"What are you worried about for the birth?\" and just listen." },
    { t: "Take a slow walk together in the evening." },
    { t: "Learn the signs of postpartum depression and anxiety, in both of you.", why: "It's common, treatable, and partners are often first to notice." },
    { t: "Line up help for the first two weeks: who's bringing food, who's walking the dog." },
    { t: "Plan one last date as a twosome." },
    { t: "Practice the breathing from your class together for five minutes." },
    { t: "Tell {name} what you love about watching this pregnancy unfold." },
  ],
};

/** What partners often feel themselves, by trimester. It's part of the job to look after you too. */
export const PARTNER_FEELINGS: Record<1 | 2 | 3, Item[]> = {
  1: [
    { t: "Excited and a bit useless at the same time. That's common: most of the first trimester happens out of sight." },
    { t: "Worried about money, or about being ready. Talk it through with a friend who's a parent." },
    { t: "Unsure what to say about nausea and exhaustion. You don't have to fix it; showing up is the help." },
  ],
  2: [
    { t: "Like it's finally real, especially after the anatomy scan or the first kick you can feel." },
    { t: "Pulled between work and baby prep. Pick one project to own so it doesn't all blur together." },
    { t: "Curious about your own parents' choices. It's a good time to talk about what you want to repeat and what you don't." },
  ],
  3: [
    { t: "Nervous about the birth and whether you'll know what to do. A class and a practice drive help more than you'd think." },
    { t: "Protective, and a bit on edge. Normal. Keep your phone charged and your plan simple." },
    { t: "Ready, and also not. Both at once is how most people feel." },
  ],
};

/** How to help, for what was logged today. Keys are symptom names and moods from the log. */
export const HOW_TO_HELP: Record<string, string> = {
  Nausea: "Keep plain snacks nearby, take over cooking, and keep strong smells away.",
  Fatigue: "Cover chores tonight and protect an early bedtime.",
  "Tender breasts": "Go gentle with hugs, and maybe hold off on surprise squeezes.",
  "Frequent peeing": "Pick aisle seats, plan bathroom stops, and leave a night light on.",
  "Food aversions": "Ask what sounds good right now, and don't take it personally if your cooking doesn't.",
  Heartburn: "Smaller dinners, earlier, and an extra pillow to prop up in bed.",
  Constipation: "Stock up on water, pears, prunes and oats, and suggest a walk together.",
  Bloating: "Keep it relaxed: comfy clothes, smaller meals, a short walk.",
  "Back pain": "Offer a lower-back rub, and handle anything heavy.",
  Headache: "Water, a dark room, and quiet. Acetaminophen is the usual choice if needed.",
  Spotting: "Spotting is common, but check that the doctor knows. Offer to make the call.",
  Cramping: "Mild cramping is usually normal. Strong or one-sided pain is a call-the-doctor-today thing.",
  Anxious: "Ask what's on {name}'s mind and listen. Offer to come to the next appointment.",
  Sad: "A hug, a walk, or just company. Mention it to the doctor if it lasts two weeks.",
  Irritable: "Hormones are real. Don't take it personally; take something off the list instead.",
  Sensitive: "Gentle words today. Say something kind out loud.",
  Happy: "A good day. Make a plan to enjoy it together.",
  Energetic: "Good energy today. A walk or a small outing together could be nice.",
};

/** Moods logged today that have a tip. */
export const moodsOf = (mood: string | null | undefined) =>
  (mood ?? "").split(",").map((m) => m.trim()).filter((m) => HOW_TO_HELP[m]);

/** Today's thing to do, new each day of the trimester. */
export function partnerMove(totalDays: number): Item {
  const pool = PARTNER_DAILY[trimesterOf(Math.floor(totalDays / 7))];
  return pool[((totalDays % pool.length) + pool.length) % pool.length];
}

/** A partner feeling for the week, so it changes slowly. */
export function partnerFeeling(week: number): Item {
  const pool = PARTNER_FEELINGS[trimesterOf(week)];
  return pool[week % pool.length];
}

/** The week's guide speaks to the pregnant partner as "your partner"; swap in a name when there is one. */
export function partnerItems(week: WeekContent, name: string): Item[] {
  return week.partner.map((i) => ({ ...i, t: fillName(i.t, name, true) }));
}

/**
 * Fill {name}. In `fromGuide` text, "your partner('s)" also becomes the name: the guide's partner tips
 * are written to the partner, so "your partner" there means the pregnant one.
 */
export function fillName(t: string, name: string, fromGuide = false): string {
  const n = name.trim() || "your partner";
  let out = t.replaceAll("{name}", n);
  if (fromGuide && name.trim()) out = out.replace(/\byour partner(?='s|\b)/gi, n);
  return out.charAt(0).toUpperCase() + out.slice(1);
}
