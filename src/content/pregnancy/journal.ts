import { trimesterOf } from "./bites";

/**
 * Today's question: one thoughtful prompt a day to answer in a few lines, kept as a keepsake.
 * Most days rotate through a trimester's pool. On set days a "moment" takes over: a letter to the
 * baby, a time capsule, a date night, timed to where you are. {partner} becomes your partner's name.
 */

export interface Prompt {
  t: string;
  /** Moments are little rituals rather than questions; they get a different label on screen. */
  moment?: boolean;
  /** A nudge shown under the prompt. */
  hint?: string;
}

/** Moments by gestational week and day (0–6). */
export const MOMENTS: { week: number; day: number; p: Prompt }[] = [
  { week: 5, day: 0, p: { t: "Write down how you found out: where you were, what you did, and who you told first.", moment: true, hint: "The details fade fast. Get them down while they're fresh." } },
  { week: 6, day: 3, p: { t: "Start a memory box. Put your positive test in it, and write down what else you want to save.", moment: true } },
  { week: 7, day: 3, p: { t: "Start a list of names you love, even the silly ones.", moment: true, hint: "No pressure to agree on anything yet." } },
  { week: 8, day: 3, p: { t: "Write your first letter to the baby. Start with \"Right now you're the size of a raspberry, and…\"", moment: true } },
  { week: 9, day: 5, p: { t: "Make a playlist for this pregnancy. What are the first five songs on it?", moment: true } },
  { week: 10, day: 3, p: { t: "Ask someone who knew you as a baby what you were like. Write down what they said.", moment: true } },
  { week: 11, day: 3, p: { t: "Time capsule: what's in the news, what does a coffee cost, and what are you watching right now?", moment: true, hint: "Your kid will find this hilarious one day." } },
  { week: 12, day: 3, p: { t: "If you've heard the heartbeat or seen a scan, write down what it was like. If not yet, what are you hoping to see?", moment: true } },
  { week: 13, day: 3, p: { t: "Write a letter to yourself to read on your due date.", moment: true } },
  { week: 14, day: 0, p: { t: "Second trimester! What do you want to make time for in the next fourteen weeks?", moment: true } },
  { week: 16, day: 3, p: { t: "Plan a date with {partner}, just the two of you. Where are you going?", moment: true } },
  { week: 17, day: 3, p: { t: "Add something to the memory box today: a scan photo, a card, a receipt from your first baby purchase. What did you add?", moment: true } },
  { week: 18, day: 3, p: { t: "Baby can start to hear you now. Read something aloud to your bump tonight. What did you pick?", moment: true } },
  { week: 19, day: 3, p: { t: "Describe your bump to the baby, as if they can't see it from in there.", moment: true } },
  { week: 20, day: 0, p: { t: "Halfway! What surprised you most about the first half?", moment: true } },
  { week: 21, day: 3, p: { t: "Plan a babymoon, even a small one: a night away, a long lunch, a day trip. Where would you go?", moment: true } },
  { week: 22, day: 3, p: { t: "Write down the first time you felt the baby move, or what you imagine it'll feel like.", moment: true } },
  { week: 24, day: 3, p: { t: "Your second letter to the baby: what do you hope they'll love about the world?", moment: true } },
  { week: 25, day: 3, p: { t: "Which traditions from your family, big or tiny, do you want to pass on?", moment: true } },
  { week: 26, day: 3, p: { t: "Ask {partner} to write the baby a note too. Copy it here, or write what it said.", moment: true } },
  { week: 28, day: 0, p: { t: "Third trimester. What do you most want to remember about being pregnant?", moment: true } },
  { week: 29, day: 3, p: { t: "Plan maternity photos. A golden-hour walk with a phone counts. When and where?", moment: true } },
  { week: 30, day: 3, p: { t: "Pick a lullaby and sing it to the bump tonight. Which one?", moment: true, hint: "Babies can recognize songs they heard in the womb." } },
  { week: 31, day: 3, p: { t: "Write down your hopes for the birth. Not a plan, just how you hope it feels.", moment: true } },
  { week: 33, day: 3, p: { t: "What's one thing you and {partner} want to do as a twosome before the baby comes?", moment: true } },
  { week: 34, day: 3, p: { t: "Write the story of how you and {partner} met, for the baby to read one day.", moment: true } },
  { week: 36, day: 0, p: { t: "Your third letter: what do you want the baby to know on the day they're born?", moment: true } },
  { week: 37, day: 3, p: { t: "Take a photo of wherever the baby will sleep. What did you get ready this week?", moment: true } },
  { week: 38, day: 3, p: { t: "Describe an ordinary day right now, so you'll remember life just before.", moment: true } },
  { week: 39, day: 3, p: { t: "What are you most looking forward to in the first week?", moment: true } },
  { week: 40, day: 0, p: { t: "It's your due date! However today is going, write it down.", moment: true } },
  { week: 41, day: 0, p: { t: "Still waiting. What's helping you pass the time?", moment: true } },
];

/** Everyday questions, rotated within each trimester. */
export const QUESTIONS: Record<1 | 2 | 3, string[]> = {
  1: [
    "What's one thing that made you smile today?",
    "What does it feel like to know, before most people do?",
    "What are you most excited about right now?",
    "What's worrying you this week? Writing it down can shrink it.",
    "What's one thing your body did today that you're grateful for?",
    "Who are you most excited to tell, and how do you picture telling them?",
    "What food would you cross the street to avoid right now?",
    "What do you hope the baby gets from you?",
    "What do you hope the baby gets from {partner}?",
    "What's something you're doing differently already?",
    "Describe today in three words.",
    "What's the kindest thing someone did for you this week?",
    "What did you dream about last night?",
    "What does a really good day look like for you right now?",
    "What's one thing you want to keep doing for yourself once the baby is here?",
    "What did you learn about the baby this week that amazed you?",
    "What's one thing you want to do with the baby that your parents did with you?",
    "What's one thing you'd do differently from how you were raised?",
    "When did it feel most real this week?",
    "What are you craving, and is it as weird as you expected?",
    "How has {partner} surprised you since you found out?",
    "What's something you want to say to the baby today?",
    "What are you looking forward to this weekend?",
    "What's the best advice anyone has given you so far?",
    "Where were you, and what were you doing, a year ago today?",
    "What song is stuck in your head?",
    "What does family mean to you right now?",
    "What do you want this pregnancy to feel like, looking back?",
    "What's helping most with the tiredness or the queasiness?",
    "What's one small thing you're proud of today?",
    "What would you tell a friend who was exactly where you are?",
    "What's a place you want to take the baby one day?",
    "What did you and {partner} talk about tonight?",
    "If the baby could know one thing about today, what would it be?",
    "What made you laugh this week?",
  ],
  2: [
    "How does your body feel today, really?",
    "What's one thing you love about your changing shape, and one thing you don't?",
    "What are you most looking forward to this trimester?",
    "What's something you want to teach the baby?",
    "What name are you leaning toward today? (It's allowed to change tomorrow.)",
    "What's a smell or taste that's changed for you?",
    "What did you do today just for you?",
    "What's a book, show or song you want to share with the baby one day?",
    "Who has surprised you with how excited they are?",
    "What's one thing you've stopped worrying about?",
    "What's one thing you're still worried about?",
    "How do you want to spend the baby's first summer, or first winter?",
    "What did the baby do today? Any flutters, kicks or hiccups?",
    "What's a small thing {partner} did this week that you loved?",
    "What kind of parent do you hope to be on hard days?",
    "What's something about your own childhood you want to recreate?",
    "Describe your perfect lazy Sunday with the baby, a year from now.",
    "What's one thing you want to say no to more often?",
    "What made today good?",
    "What's the funniest thing someone has said about your pregnancy?",
    "What are you craving this week?",
    "What do you want to remember about this exact week?",
    "If you could ask the baby one question, what would it be?",
    "What does your body need more of this week?",
    "What's the best thing you ate today?",
    "What do you picture the baby looking like?",
    "Who do you want the baby to have in their corner, besides the two of you?",
    "What's one thing on your mind that you haven't said out loud yet?",
    "What's something you're getting better at?",
    "What would make tomorrow a little easier?",
    "Where do you feel most like yourself right now?",
    "What's one thing you want the nursery, or the baby's corner, to have?",
    "What's a family recipe you want the baby to grow up eating?",
    "How are you and {partner} different from when you found out?",
    "What would you want the baby to know about who you are right now?",
  ],
  3: [
    "How are you sleeping, and what's helping?",
    "What do you want the first hour after the birth to feel like?",
    "What's one thing you want to do before the baby arrives?",
    "What are you letting go of to make room for the baby?",
    "What's the baby's favorite time to party in there?",
    "What do you want visitors to know before they come?",
    "What's one thing you're nervous about, and one thing that calms you?",
    "What did you get ready today?",
    "How do you want to feel when you come home with the baby?",
    "What's one thing {partner} has done that made you feel looked after?",
    "Which part of your body has worked hardest this week? Say thank you to it.",
    "What do you want to remember about your bump?",
    "What's one meal you want waiting for you after the birth?",
    "Who do you want to call first?",
    "What does slowing down look like for you this week?",
    "What's something you're proud of from this pregnancy?",
    "What's one thing you'd tell yourself at your positive test?",
    "What sound or song do you want playing when the baby is born?",
    "What's the most surprising thing about the third trimester?",
    "What are you most curious about: who they'll look like, their personality, their first cry?",
    "What's a small comfort that got you through today?",
    "How do you hope the baby's first year feels for you as a couple?",
    "What kind of help do you want in the first weeks? Who could give it?",
    "What's one thing you want to keep for yourself once you're a parent?",
    "What did you do today that you won't be able to do for a while?",
    "Describe how the baby moves right now.",
    "What's one thing that made you laugh this week?",
    "What would you tell the baby about the world they're arriving in?",
    "What's one thing you've learned about yourself these last months?",
    "How do you want to celebrate the baby's birthday each year?",
    "What do you hope never changes about you and {partner}?",
    "What's in your hospital bag that you'd never have guessed?",
    "What do you need to hear today? Write it to yourself.",
    "What does home feel like right now?",
    "What word describes this week?",
  ],
};

/** Today's prompt for a gestational day: a moment if one falls today, otherwise the next question in the trimester's pool. */
export function todaysPrompt(totalDays: number, partner?: string | null): Prompt {
  const week = Math.floor(totalDays / 7);
  const day = totalDays % 7;
  const moment = MOMENTS.find((m) => m.week === week && m.day === day);
  const fill = (t: string) => t.replaceAll("{partner}", partner?.trim() || "your partner");
  if (moment) return { ...moment.p, t: fill(moment.p.t) };
  const tri = trimesterOf(week);
  const pool = QUESTIONS[tri];
  const start = tri === 1 ? 0 : tri === 2 ? 14 * 7 : 28 * 7;
  return { t: fill(pool[(((totalDays - start) % pool.length) + pool.length) % pool.length]) };
}
