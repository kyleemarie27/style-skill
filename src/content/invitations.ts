import type { Phase, Today } from "../../shared/cycle";
import { diffDays } from "../../shared/dates";

/**
 * Today's invitation: one part of yourself that today's hormones make easy to reach, plus one
 * small ritual. It sits at the top of Today so every day of the cycle has something to look
 * forward to, wait included. Edit freely; each phase rotates through its list day by day.
 */
export interface Invitation {
  /** "The Hermit" */
  name: string;
  /** One line on who that is. */
  line: string;
  /** Why today, in a sentence (the hormone side). */
  why: string;
  /** One small thing to do, a few minutes long. */
  ritual: string;
}

const MENSTRUAL: Invitation[] = [
  { name: "The Hermit", line: "The part of you that needs nothing from anyone today.", why: "Hormones are at their lowest and your body is doing real work. Quiet is the right answer.", ritual: "Cancel one thing. Make something warm and eat it slowly." },
  { name: "The Truth-Teller", line: "Clear eyes, no fog.", why: "The pre-period hormone drop is behind you, and judgment tends to be sharp this week.", ritual: "Write down one thing that isn't working and one thing you're keeping." },
  { name: "The Dreamer", line: "Your intuition is loud today. Listen.", why: "Low energy turns the volume down on everything else.", ritual: "Ten minutes with a blank page: what do you want this cycle to feel like?" },
  { name: "The Healer", line: "Tending to yourself counts as doing something.", why: "Heat and rest ease prostaglandin cramps as well as some pills do.", ritual: "Heat pad on, legs up the wall, five minutes." },
  { name: "The Editor", line: "Less, but better.", why: "It's a natural reset point: easier to let things go than to add.", ritual: "Clear one small thing: a drawer, a tab, a commitment." },
  { name: "The Seed-Keeper", line: "Something new is already starting.", why: "A fresh set of follicles has begun to grow, quietly, this week.", ritual: "Write one sentence about the next four weeks. Just one." },
];

const FOLLICULAR: Invitation[] = [
  { name: "The Beginner", line: "The part of you that loves a fresh start.", why: "Rising estrogen helps your brain learn and remember new things.", ritual: "Give the thing you've been putting off 20 minutes. Just start." },
  { name: "The Explorer", line: "Curious about everything.", why: "Estrogen nudges dopamine, so novelty feels extra good right now.", ritual: "Take a new route, try a new café, or play an album you've never heard." },
  { name: "The Builder", line: "Strong and getting stronger.", why: "You recover faster this week, and strength work may pay off more.", ritual: "Lift something a little heavier than last time." },
  { name: "The Strategist", line: "Big picture, clear plan.", why: "Energy and focus are climbing together.", ritual: "Map out your next two weeks, with room left for the quieter second half." },
  { name: "The Optimist", line: "Things feel possible again.", why: "Mood usually lifts as estrogen rises.", ritual: "Text someone you've been meaning to reach out to." },
  { name: "The Maker", line: "Hands busy, mind light.", why: "Creative energy builds through this week.", ritual: "Make something: a meal from scratch, a sketch, a playlist." },
  { name: "The Student", line: "Your brain is a sponge.", why: "Estrogen supports the parts of the brain that handle memory.", ritual: "Read ten pages of something that teaches you something." },
  { name: "The Spark", line: "Say yes a little more often.", why: "Stress rolls off more easily this week.", ritual: "Say yes to one small spontaneous plan." },
];

const FERTILE: Invitation[] = [
  { name: "The Flirt", line: "Playful, warm, a little mischievous.", why: "Estrogen is near its peak and desire tends to rise with it.", ritual: "Send your partner a message that has nothing to do with logistics." },
  { name: "The Connector", line: "Your social battery is full.", why: "Verbal fluency and confidence peak around now.", ritual: "Call someone instead of texting." },
  { name: "The Magnet", line: "You walk into a room and it notices.", why: "Studies find people read as more attractive around ovulation, voice included.", ritual: "Wear the thing that makes you feel most like you." },
  { name: "The Performer", line: "Say it out loud.", why: "Confidence and communication are at their high point.", ritual: "Speak up in the meeting, make the pitch, send the bold email." },
  { name: "The Lover", line: "Closeness for its own sake.", why: "Your body is wired for connection this week.", ritual: "Phones in another room for one evening." },
  { name: "The Playful One", line: "Lightness is the point.", why: "Pressure is the enemy of a good fertile window. Fun helps.", ritual: "Dance in the kitchen for one whole song." },
];

const OVULATION: Invitation[] = [
  { name: "The Magnetic One", line: "Peak you.", why: "Estrogen and testosterone both peak just before you ovulate.", ritual: "A date night with no agenda. Not a task, a date." },
  { name: "The Radiant One", line: "You glow today, for real.", why: "Skin and mood are often at their best around ovulation.", ritual: "Take a photo of yourself today. You'll like it." },
  { name: "The Brave One", line: "Ask for the thing.", why: "Risk tolerance tends to rise with your hormone peak.", ritual: "Ask for something you want: a favor, a raise, a hug." },
];

const TWW_EARLY: Invitation[] = [
  { name: "The Nester", line: "Home pulls at you, and that's a good thing.", why: "Progesterone is rising, and with it a pull toward calm and cozy.", ritual: "One cozy thing for your space: fresh sheets, flowers, a candle." },
  { name: "The Finisher", line: "The part of you that ties off loose ends.", why: "Focus shifts from starting things to detail and follow-through.", ritual: "Finish one task that's been hanging around." },
  { name: "The Gardener", line: "Tend, don't force.", why: "Your body is doing its part now. You don't have to do anything else.", ritual: "Water your plants or cook a batch of something for later this week." },
  { name: "The Steady One", line: "Calm is a skill, and you have it.", why: "Progesterone has a gentle calming effect on the brain.", ritual: "A long walk with no podcast. Just look around." },
  { name: "The Caretaker", line: "Your warmth goes a long way.", why: "Empathy often runs high in the second half of the cycle.", ritual: "Do one small kind thing for someone who won't expect it." },
  { name: "The Homebody", line: "The best plans are at home tonight.", why: "A slower metabolism and more appetite are normal now.", ritual: "A slow dinner at home with something really good in it." },
];

const TWW_MID: Invitation[] = [
  { name: "The Anchor", line: "Grounded, even if the wait isn't.", why: "Progesterone is at its peak, which is a steadying hormone.", ritual: "Four slow breaths: in for 4, hold for 7, out for 8." },
  { name: "The Archivist", line: "You remember what matters.", why: "A good week for detail-heavy, quiet work.", ritual: "Pick three photos from this month and say why you love them." },
  { name: "The Craftsperson", line: "Patient hands, careful eye.", why: "Attention to detail tends to be strong mid-luteal.", ritual: "Spend 20 minutes on something fiddly you enjoy." },
  { name: "The Friend", line: "Easy company, no performance.", why: "One-on-one time feels better than big groups now.", ritual: "See or call the friend who feels easiest to be around." },
  { name: "The Comfort-Maker", line: "You know exactly what soothes you.", why: "Your body runs a little warmer now. Gentle beats intense.", ritual: "A warm (not hot) shower with the good soap, then soft clothes." },
];

const TWW_LATE: Invitation[] = [
  { name: "The Truth-Seer", line: "You notice what's off. That's a gift.", why: "Hormones dip before a period, and many people feel more sensitive and see more clearly.", ritual: "Name one boundary you want to keep, and keep it today." },
  { name: "The Soft One", line: "Gentleness, on purpose.", why: "Falling hormones can bring a short fuse or tears. Both are allowed.", ritual: "Wear the softest thing you own." },
  { name: "The Wise One", line: "You've done this before. You know how to hold it.", why: "This part of the wait is hardest, and you've already done the work.", ritual: "Write a short note to the you who wakes up on day 1, whatever day 1 brings." },
  { name: "The Cocoon", line: "Rest is productive now.", why: "Sleep can get lighter before a period, so go to bed earlier to make up for it.", ritual: "In bed 30 minutes earlier, screens out of the room." },
  { name: "The Clearer", line: "Make space, inside and out.", why: "The urge to tidy is common late in the cycle.", ritual: "Clear one surface. Just one." },
  { name: "The Observer", line: "Notice, don't decide.", why: "Early pregnancy and PMS feel almost the same. No symptom tells you yet.", ritual: "Swap one round of symptom googling for ten minutes outside." },
];

const LATE: Invitation[] = [
  { name: "The Patient One", line: "Whatever today says, you'll meet it.", why: "A test is most reliable with first-morning urine now.", ritual: "Test, then plan one lovely thing for today either way." },
  { name: "The Brave Heart", line: "Hope is brave. So is resting.", why: "Your period is late; stress and a later ovulation can both cause that.", ritual: "Tell one person how you're really doing." },
  { name: "The Held One", line: "Let someone take care of you.", why: "You don't have to carry the waiting alone.", ritual: "Ask your partner for one specific thing today." },
  { name: "The Present One", line: "Just today.", why: "Today is enough to think about.", ritual: "Notice five good things before bed." },
];

/** The first week after a loss: gentler invitations, whatever phase the math says. */
const AFTER_LOSS: Invitation[] = [
  { name: "The Tender One", line: "Soft is the strongest thing you can be this week.", why: "Your body is recovering, and so is your heart. Both take time.", ritual: "Eat something nourishing, drink water, and let that count as enough." },
  { name: "The Held One", line: "You don't have to hold this alone.", why: "Grief shows up in the body too: tiredness, aches, fog.", ritual: "Let someone bring you something, or sit with you." },
  { name: "The Mender", line: "Healing isn't a straight line.", why: "Hormones are settling back toward a normal cycle.", ritual: "A slow walk outside, any length." },
];

const POOLS: Partial<Record<Phase, Invitation[]>> = {
  menstrual: MENSTRUAL,
  follicular: FOLLICULAR,
  fertile: FERTILE,
  ovulation: OVULATION,
  tww_early: TWW_EARLY,
  tww_mid: TWW_MID,
  tww_late: TWW_LATE,
  late: LATE,
};

/** Today's invitation, or null before Bloom knows the cycle. */
export function invitationFor(info: Today, afterLossStart: string | null = null): Invitation | null {
  if (afterLossStart && info.cycleDay && diffDays(info.date, afterLossStart) < 7) {
    return AFTER_LOSS[diffDays(info.date, afterLossStart) % AFTER_LOSS.length];
  }
  const pool = POOLS[info.phase];
  if (!pool || !info.cycleDay) return null;
  // Index by the day within the phase where we know it, so consecutive days differ.
  const i =
    info.phase === "fertile" && info.fertileDay ? info.fertileDay - 1
      : info.phase === "ovulation" ? (info.daysUntilOvulation ? 0 : 1)
        : info.dpo ? info.dpo
          : info.phase === "late" && info.nextPeriod ? diffDays(info.date, info.nextPeriod)
            : info.cycleDay - 1;
  return pool[Math.abs(i) % pool.length];
}
