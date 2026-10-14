/**
 * How body and mind change across pregnancy: when common symptoms and feelings usually start,
 * peak and fade. Weeks count from the last period. Everyone's timing differs; these are typical
 * windows drawn from ACOG, NHS and Mayo Clinic guidance, written to be read at a glance.
 */

export interface Change {
  id: string;
  kind: "body" | "mind";
  icon: string;
  name: string;
  /** Typical first and last week. */
  from: number;
  to: number;
  /** When it's usually strongest, if there's a clear peak. */
  peak?: [number, number];
  /** One or two friendly sentences: what it is and why. */
  note: string;
  /** Key into SYMPTOMS for "what helps / when to call". */
  symptom?: string;
}

export const CHANGES: Change[] = [
  // ---- body ----
  { id: "breasts", kind: "body", icon: "🍒", name: "Tender, fuller breasts", from: 4, to: 14, peak: [5, 10], symptom: "Tender breasts",
    note: "Often the very first sign. Estrogen and progesterone are building milk ducts, and for most people the soreness settles by the second trimester (the growing doesn't)." },
  { id: "fatigue1", kind: "body", icon: "😴", name: "Bone-deep tiredness", from: 5, to: 14, peak: [7, 12], symptom: "Fatigue",
    note: "You're building a placenta and progesterone is basically a sedative. It's not you being lazy. Energy usually comes back around weeks 13–16." },
  { id: "nausea", kind: "body", icon: "🤢", name: "Nausea and food smells", from: 5, to: 15, peak: [8, 11], symptom: "Nausea",
    note: "Tracks rising hCG, so it tends to peak around 9 weeks and ease by 12–14. About 1 in 10 people have it past 20 weeks, so tell your doctor if it hangs on." },
  { id: "aversions", kind: "body", icon: "🙅‍♀️", name: "Food aversions and cravings", from: 5, to: 16, peak: [6, 12], symptom: "Food aversions",
    note: "Your sense of smell is turned way up. Eat what you can stomach; your prenatal vitamin covers the gaps for now." },
  { id: "pee1", kind: "body", icon: "🚽", name: "Peeing all the time", from: 5, to: 13, peak: [6, 12], symptom: "Frequent peeing",
    note: "More blood is flowing through your kidneys, and the growing uterus sits right on your bladder. It eases once the uterus rises out of the pelvis." },
  { id: "bloating", kind: "body", icon: "🎈", name: "Bloating and gas", from: 5, to: 18, peak: [7, 14], symptom: "Bloating",
    note: "Progesterone slows your whole gut down. Jeans feel tight long before there's a bump." },
  { id: "constipation", kind: "body", icon: "🥝", name: "Constipation", from: 6, to: 42, peak: [10, 36], symptom: "Constipation",
    note: "Slow digestion plus the iron in prenatals. Water, fiber and walking are your friends the whole way through." },
  { id: "headache", kind: "body", icon: "🤕", name: "Headaches", from: 6, to: 16, peak: [8, 13], symptom: "Headache",
    note: "Hormone shifts, extra blood volume and less caffeine. Most ease in the second trimester. After 20 weeks, a severe headache is a call-your-doctor thing." },
  { id: "dizzy", kind: "body", icon: "💫", name: "Lightheadedness", from: 8, to: 26, peak: [14, 24], symptom: "Dizziness",
    note: "Your blood vessels relax and blood pressure dips, lowest around mid-pregnancy. Stand up slowly and keep snacks close." },
  { id: "energy", kind: "body", icon: "⚡", name: "Energy comes back", from: 13, to: 27, peak: [15, 24],
    note: "The famous second-trimester glow. Nausea fades, the placenta has taken over, and lots of people feel like themselves again. Great window for trips and projects." },
  { id: "stuffy", kind: "body", icon: "🤧", name: "Stuffy nose, bleeding gums", from: 12, to: 42, peak: [16, 32],
    note: "Extra blood volume swells the soft tissue in your nose and gums. Annoying, harmless, and gone after birth. Keep up with dental cleanings." },
  { id: "ligament", kind: "body", icon: "📌", name: "Round ligament twinges", from: 14, to: 28, peak: [16, 24], symptom: "Round ligament pain",
    note: "Quick, sharp pains low on one or both sides when you stand, cough or roll over. The ligaments holding your uterus are stretching." },
  { id: "flutters", kind: "body", icon: "🦋", name: "First flutters", from: 16, to: 24, peak: [18, 22],
    note: "Feels like bubbles or a tiny fish swimming. First-time parents often notice it between 18 and 22 weeks; it's earlier if you've been pregnant before." },
  { id: "kicks", kind: "body", icon: "🦶", name: "Real kicks and rolls", from: 22, to: 42, peak: [28, 36],
    note: "Movements get stronger and form a pattern. From 28 weeks, get to know baby's normal and call if they slow down." },
  { id: "heartburn", kind: "body", icon: "🔥", name: "Heartburn", from: 18, to: 42, peak: [28, 40], symptom: "Heartburn",
    note: "Progesterone relaxes the valve at the top of your stomach, and later the uterus pushes everything up. Smaller meals and not lying down right after eating help a lot." },
  { id: "back", kind: "body", icon: "🧍‍♀️", name: "Back aches", from: 18, to: 42, peak: [28, 40], symptom: "Back pain",
    note: "Your center of gravity is moving forward and relaxin loosens your joints. Supportive shoes, side-sleeping with a pillow and gentle stretching help." },
  { id: "itch", kind: "body", icon: "🧴", name: "Itchy, stretching belly", from: 18, to: 42, peak: [26, 38], symptom: "Itching",
    note: "Skin stretching over the bump gets dry and itchy. Moisturize. Intense itching on palms and soles, especially at night, needs a doctor's check." },
  { id: "cramps", kind: "body", icon: "🦵", name: "Leg cramps at night", from: 20, to: 42, peak: [28, 38], symptom: "Leg cramps",
    note: "Calf cramps that wake you up. Stretch before bed, flex your foot toward you when one hits, and keep drinking water." },
  { id: "bh", kind: "body", icon: "🫸", name: "Practice contractions", from: 20, to: 42, peak: [32, 40], symptom: "Braxton Hicks",
    note: "Your belly tightens, then lets go. Irregular and painless. Your uterus is warming up. If they get regular or painful, call." },
  { id: "breath", kind: "body", icon: "🌬️", name: "Short of breath", from: 20, to: 37, peak: [28, 36],
    note: "The uterus is pushing up on your diaphragm. It often eases when baby drops into your pelvis in the last weeks." },
  { id: "swelling", kind: "body", icon: "💧", name: "Swollen feet and ankles", from: 24, to: 42, peak: [32, 40], symptom: "Swollen feet",
    note: "Extra fluid plus gravity, worse at the end of the day. Feet up, cool water, comfy shoes. Sudden swelling of your face or hands is a call-now sign." },
  { id: "sleep", kind: "body", icon: "🌙", name: "Hard-to-get-comfy sleep", from: 26, to: 42, peak: [32, 40], symptom: "Insomnia",
    note: "The bump, bathroom trips, heartburn and a busy mind all pile up. A pregnancy pillow and napping when you can make a real difference." },
  { id: "fatigue3", kind: "body", icon: "🥱", name: "Tiredness returns", from: 30, to: 42, peak: [34, 41], symptom: "Fatigue",
    note: "Carrying the extra weight and broken sleep bring the tiredness back. Lower the bar on everything else." },
  { id: "pee3", kind: "body", icon: "🚻", name: "Bathroom trips (round two)", from: 33, to: 42, peak: [36, 41], symptom: "Frequent peeing",
    note: "When baby drops lower, their head sits on your bladder again. Breathing gets easier, peeing gets more frequent." },
  { id: "pressure", kind: "body", icon: "⬇️", name: "Pelvic pressure", from: 34, to: 42, peak: [37, 41],
    note: "Heaviness low down, and sometimes sharp zings in your pelvis as baby settles. Normal, but tell your doctor if it comes with regular tightening before 37 weeks." },

  // ---- mind ----
  { id: "unreal", kind: "mind", icon: "🫧", name: "\"Is this even real?\"", from: 4, to: 12, peak: [4, 9],
    note: "Nothing shows yet and you may barely feel different. Lots of people keep re-testing. Completely normal." },
  { id: "worry1", kind: "mind", icon: "🤞", name: "Early-weeks worry", from: 4, to: 13, peak: [5, 10],
    note: "Waiting for the first scan is hard. The odds get better every week, and most pregnancies that reach a heartbeat on ultrasound continue." },
  { id: "moods", kind: "mind", icon: "🎢", name: "Mood swings", from: 5, to: 14, peak: [6, 11],
    note: "Hormones are rising faster now than at almost any other time. Tears at an ad are on brand." },
  { id: "calm", kind: "mind", icon: "🌤️", name: "The calmer middle", from: 14, to: 27, peak: [16, 24],
    note: "Hormones level out and lots of people feel steadier, more hopeful and more like themselves." },
  { id: "real", kind: "mind", icon: "💗", name: "It starts feeling real", from: 16, to: 26, peak: [18, 23],
    note: "The anatomy scan, a bump strangers notice and the first kicks. This is often when the bond really clicks." },
  { id: "dreams", kind: "mind", icon: "🌀", name: "Wild, vivid dreams", from: 12, to: 42, peak: [24, 40], symptom: "Insomnia",
    note: "You wake more often (so you remember more), and your brain is working through a lot. Weird dreams are normal, even unsettling ones." },
  { id: "fog", kind: "mind", icon: "🌫️", name: "Pregnancy brain", from: 10, to: 42, peak: [30, 40],
    note: "Misplacing keys and losing words. Poor sleep and a lot on your mind are a big part of it. Lists and phone reminders help." },
  { id: "birth", kind: "mind", icon: "🧠", name: "Thinking about birth", from: 26, to: 42, peak: [32, 40],
    note: "Excitement and nerves about labor tend to arrive together. A class, a birth plan and talking it through can take the edge off." },
  { id: "nesting", kind: "mind", icon: "🪺", name: "The nesting urge", from: 32, to: 42, peak: [36, 40],
    note: "A sudden need to wash every tiny sock and reorganize the closet. Go with it, but let someone else lift and climb." },
  { id: "done", kind: "mind", icon: "⏳", name: "\"Okay, I'm ready now\"", from: 37, to: 42, peak: [39, 42],
    note: "Impatience, discomfort and checking every twinge. Only about 1 in 20 babies arrives on the due date, so plan some easy treats for the wait." },
];

export type ChangeStatus = "starting" | "peak" | "easing" | "now" | "coming" | "fading";

export interface ChangeNow extends Change {
  status: ChangeStatus;
}

const LOOK_AHEAD = 3;
const LOOK_BACK = 2;

/** Where each change stands at a given week: happening now, coming up in the next few weeks, or just fading out. */
export function changesAt(week: number): { now: ChangeNow[]; coming: ChangeNow[]; fading: ChangeNow[] } {
  const now: ChangeNow[] = [];
  const coming: ChangeNow[] = [];
  const fading: ChangeNow[] = [];
  for (const c of CHANGES) {
    if (week < c.from) {
      if (c.from - week <= LOOK_AHEAD) coming.push({ ...c, status: "coming" });
    } else if (week > c.to) {
      if (week - c.to <= LOOK_BACK) fading.push({ ...c, status: "fading" });
    } else if (!c.peak) now.push({ ...c, status: "now" });
    else if (week < c.peak[0]) now.push({ ...c, status: "starting" });
    else if (week <= c.peak[1]) now.push({ ...c, status: "peak" });
    else now.push({ ...c, status: "easing" });
  }
  const order: Record<ChangeStatus, number> = { peak: 0, now: 1, starting: 2, easing: 3, coming: 4, fading: 5 };
  now.sort((a, b) => order[a.status] - order[b.status]);
  coming.sort((a, b) => a.from - b.from);
  return { now, coming, fading };
}
