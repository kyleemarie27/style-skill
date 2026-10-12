import type { CycleModel } from "./cycle.js";
import { addDays, diffDays, prettyDate } from "./dates.js";
import type { DayLog, Pregnancy, Settings } from "./types.js";

/**
 * The pregnancy engine. Pure functions, shared by the app and the API.
 *
 * Dating follows the obstetric convention: gestational age counts from the first day of the
 * last period (LMP), so "4 weeks pregnant" is about 2 weeks after conception, and the due
 * date is 280 days (40 weeks) after LMP.
 */

export const TERM_DAYS = 280;

/** The pregnancy, if one is active (confirmed and not ended). */
export function activePregnancy(settings: Settings | null | undefined): Pregnancy | null {
  const p = settings?.pregnancy;
  return p && !p.ended ? p : null;
}

export interface DueDateEstimate {
  lmp: string;
  dueDate: string;
  source: "lmp" | "ovulation";
  /** Plain-language explanation of how the date was worked out. */
  how: string;
}

/**
 * Due date from the cycle data:
 * - If this cycle's ovulation is known (LH peak or marked), due = ovulation + 266 days.
 * - Otherwise Naegele's rule (LMP + 280), shifted by how far the average cycle is from 28 days.
 */
export function dueDateFrom(model: CycleModel, positiveDate: string): DueDateEstimate {
  const cycle = [...model.cycles].reverse().find((c) => c.start <= positiveDate);
  if (!cycle || diffDays(positiveDate, cycle.start) > 70) {
    const lmp = addDays(positiveDate, -28);
    return { lmp, dueDate: addDays(lmp, TERM_DAYS), source: "lmp", how: "No recent period logged, so this assumes you're about 4 weeks along. Change it to match your last period." };
  }
  if (cycle.ovulationSource !== "estimate") {
    return {
      lmp: cycle.start,
      dueDate: addDays(cycle.ovulation, TERM_DAYS - 14),
      source: "ovulation",
      how: `From your ${cycle.ovulationSource === "lh" ? "LH-confirmed" : "marked"} ovulation on ${prettyDate(cycle.ovulation)}: ovulation + 38 weeks.`,
    };
  }
  const shift = Math.max(-7, Math.min(14, model.avgCycleLength - 28));
  return {
    lmp: cycle.start,
    dueDate: addDays(cycle.start, TERM_DAYS + shift),
    source: "lmp",
    how: shift
      ? `From your last period (${prettyDate(cycle.start)}) + 40 weeks, adjusted ${shift > 0 ? "+" : ""}${shift} days for your ${model.avgCycleLength}-day cycles.`
      : `From your last period (${prettyDate(cycle.start)}) + 40 weeks.`,
  };
}

/** LMP that matches a due date (used when a doctor gives a new due date). */
export const lmpForDueDate = (dueDate: string) => addDays(dueDate, -TERM_DAYS);

export interface Gestation {
  /** Total days since the (adjusted) LMP. */
  totalDays: number;
  weeks: number;
  days: number;
  trimester: 1 | 2 | 3;
  daysToGo: number;
  /** 0–1 progress toward 40 weeks. */
  pct: number;
  /** Approximate days since conception. */
  sinceConception: number;
}

export function gestation(date: string, preg: Pick<Pregnancy, "dueDate">): Gestation {
  const totalDays = TERM_DAYS - diffDays(preg.dueDate, date);
  const weeks = Math.floor(totalDays / 7);
  return {
    totalDays,
    weeks,
    days: totalDays - weeks * 7,
    trimester: weeks < 14 ? 1 : weeks < 28 ? 2 : 3,
    daysToGo: Math.max(0, TERM_DAYS - totalDays),
    pct: Math.max(0, Math.min(1, totalDays / TERM_DAYS)),
    sinceConception: totalDays - 14,
  };
}

export const gaLabel = (g: Pick<Gestation, "weeks" | "days">) => `${g.weeks}w ${g.days}d`;
export const gaLong = (g: Pick<Gestation, "weeks" | "days">) =>
  `${g.weeks} week${g.weeks === 1 ? "" : "s"}${g.days ? `, ${g.days} day${g.days === 1 ? "" : "s"}` : ""}`;

// Typical size by completed week. Crown-to-rump length until 20 weeks, then head-to-heel
// (the usual switch once legs uncurl). Millimetres and grams, rounded from published growth
// charts (Robinson CRL; Hadlock/WHO fetal weight). Averages: real babies vary.
const CRL: [number, number, number][] = [
  [4, 1, 0], [5, 2, 0], [6, 5, 0], [7, 10, 0.5], [8, 16, 1], [9, 23, 2], [10, 31, 4],
  [11, 41, 7], [12, 54, 14], [13, 74, 23], [14, 87, 43], [15, 101, 70], [16, 116, 100],
  [17, 130, 140], [18, 142, 190], [19, 153, 240], [20, 164, 300],
];
const CH: [number, number, number][] = [
  [20, 256, 300], [21, 267, 360], [22, 278, 430], [23, 289, 501], [24, 300, 600], [25, 346, 660],
  [26, 356, 760], [27, 366, 875], [28, 376, 1005], [29, 386, 1153], [30, 399, 1319],
  [31, 411, 1502], [32, 424, 1702], [33, 437, 1918], [34, 450, 2146], [35, 462, 2383],
  [36, 474, 2622], [37, 486, 2859], [38, 498, 3083], [39, 507, 3288], [40, 512, 3462],
  [41, 515, 3597], [42, 517, 3685],
];

export interface BabySize {
  lengthMm: number;
  weightG: number;
  measure: "crown to rump" | "head to heel";
}

/** Size for an exact gestational day, interpolated between the weekly values. */
export function babySize(totalDays: number): BabySize {
  const w = Math.max(28, Math.min(42 * 7, totalDays)) / 7;
  const table = w < 20 ? CRL : CH;
  let i = table.findIndex((r) => r[0] > w) - 1;
  if (i < 0) i = table.length - 2;
  const [w0, l0, g0] = table[i];
  const [w1, l1, g1] = table[i + 1];
  const t = Math.max(0, Math.min(1, (w - w0) / (w1 - w0)));
  return { lengthMm: l0 + (l1 - l0) * t, weightG: g0 + (g1 - g0) * t, measure: w < 20 ? "crown to rump" : "head to heel" };
}

export function formatLength(mm: number): string {
  if (mm < 10) return `${mm < 2 ? mm.toFixed(1) : Math.round(mm)} mm`;
  const inches = mm / 25.4;
  return `${(mm / 10).toFixed(mm < 100 ? 1 : 0)} cm · ${inches.toFixed(inches < 10 ? 1 : 0)} in`;
}

export function formatWeight(g: number): string | null {
  if (g < 1) return null;
  if (g < 454) {
    const oz = g / 28.35;
    return `${g < 10 ? g.toFixed(1) : Math.round(g)} g · ${oz < 1 ? oz.toFixed(2) : oz.toFixed(1)} oz`;
  }
  const lb = Math.floor(g / 453.6);
  const oz = Math.round((g - lb * 453.6) / 28.35);
  return `${(g / 1000).toFixed(2)} kg · ${lb} lb ${oz} oz`;
}

// ---------------------------------------------------------------------------------------------
// Red flags

export type FlagLevel = "urgent" | "call" | "mention";

export interface PregFlag {
  id: string;
  level: FlagLevel;
  title: string;
  detail: string;
  date: string;
}

const has = (l: DayLog | undefined, s: string) => !!l?.symptoms?.some((x) => x.toLowerCase() === s.toLowerCase());

/**
 * Warning signs in the last few days of logs, using the "call your provider" lists from ACOG
 * and the NHS. General information, not a diagnosis; anything urgent says so plainly.
 */
export function pregnancyFlags(logs: DayLog[], preg: Pregnancy, today: string): PregFlag[] {
  const since = addDays(today, -2);
  const recent = logs.filter((l) => l.date >= since && l.date <= today && l.date >= preg.lmp).sort((a, b) => b.date.localeCompare(a.date));
  const flags: PregFlag[] = [];
  const add = (f: PregFlag) => {
    if (!flags.some((x) => x.id === f.id)) flags.push(f);
  };

  for (const l of recent) {
    const g = gestation(l.date, preg);
    const p = l.preg ?? {};
    const bleed = p.bleeding && p.bleeding !== "none" ? p.bleeding : null;
    const strongPain = p.pain === "strong";
    if (g.weeks < 14 && (strongPain && p.painOneSided)) {
      add({ id: "ectopic", level: "urgent", date: l.date, title: "Strong one-sided pain: get checked today",
        detail: "Sharp pain on one side in early pregnancy, especially with bleeding, shoulder-tip pain, dizziness or fainting, can be a sign of an ectopic pregnancy. Call your doctor now, or go to the ER if it's severe or you feel faint." });
    }
    if (bleed === "heavy" || (bleed && strongPain)) {
      add({ id: "bleeding-heavy", level: "urgent", date: l.date, title: bleed === "heavy" ? "Heavy bleeding: call now" : "Bleeding with strong pain: call now",
        detail: "Soaking a pad in an hour, passing clots or tissue, or bleeding with strong cramps needs same-day care. Call your doctor's urgent line or go to the ER." });
    } else if (bleed) {
      add({ id: "bleeding", level: "call", date: l.date, title: g.weeks < 14 ? "Spotting logged: let your doctor know" : "Bleeding logged: call your doctor",
        detail: g.weeks < 14
          ? "Light spotting is common in early pregnancy (about 1 in 4) and often harmless, but your doctor will want to know, especially if it gets heavier or comes with cramps. If you're Rh-negative you may need a shot."
          : "Any bleeding after the first trimester is worth a call the same day so your doctor can check on you and the baby." });
    }
    if (p.temp != null && p.temp >= 100.4) {
      add({ id: "fever", level: "call", date: l.date, title: `Fever of ${p.temp}°F: call your doctor`,
        detail: "A fever of 100.4°F (38°C) or higher in pregnancy should be treated promptly. Acetaminophen (Tylenol) is the usual safe choice. Call to check what's causing it." });
    }
    if (g.weeks >= 20 && p.bpSys != null && p.bpDia != null) {
      if (p.bpSys >= 160 || p.bpDia >= 110) {
        add({ id: "bp-severe", level: "urgent", date: l.date, title: `Blood pressure ${p.bpSys}/${p.bpDia}: get seen now`,
          detail: "Blood pressure this high after 20 weeks can be severe preeclampsia. Go to labor & delivery or the ER now, and recheck after resting 15 minutes on the way." });
      } else if (p.bpSys >= 140 || p.bpDia >= 90) {
        add({ id: "bp-high", level: "call", date: l.date, title: `Blood pressure ${p.bpSys}/${p.bpDia}: call today`,
          detail: "140/90 or higher after 20 weeks can be an early sign of preeclampsia. Rest, recheck in 15 minutes, and call your doctor today either way." });
      }
    }
    if (g.weeks >= 20 && (has(l, "Vision changes") || has(l, "Severe headache"))) {
      add({ id: "preeclampsia-symptoms", level: "urgent", date: l.date, title: "Headache or vision changes: call now",
        detail: "A headache that won't go away, blurred vision, seeing spots or pain under the right ribs after 20 weeks can be preeclampsia. Call your doctor now; go in if you can't reach them." });
    }
    if (g.weeks >= 20 && has(l, "Sudden swelling")) {
      add({ id: "swelling", level: "call", date: l.date, title: "Sudden swelling: check in today",
        detail: "Some ankle swelling is normal, but sudden swelling of the face, hands or around the eyes should be checked, with a blood pressure reading." });
    }
    if (p.leaking) {
      add({ id: "fluid", level: g.weeks < 37 ? "urgent" : "call", date: l.date, title: "Leaking fluid: call labor & delivery",
        detail: "A gush or steady trickle of fluid can mean your waters have broken. Note the time, color and smell, and call labor & delivery." });
    }
    if (g.weeks >= 20 && g.weeks < 37 && p.contractions != null && p.contractions >= 4) {
      add({ id: "preterm", level: "urgent", date: l.date, title: `${p.contractions} contractions in an hour: call now`,
        detail: "Four or more contractions in an hour before 37 weeks can be preterm labor. Drink water, lie on your left side, and call labor & delivery now." });
    }
    if (g.weeks >= 28 && p.kicks != null && p.kicks > 120) {
      add({ id: "movement", level: "call", date: l.date, title: "Fewer movements than usual: call today",
        detail: "If it takes more than 2 hours to feel 10 movements, or the pattern has slowed, call labor & delivery today. Don't wait until tomorrow." });
    }
    if (p.nausea === "severe" || (p.vomits ?? 0) >= 4) {
      const days = recent.filter((r) => r.preg?.nausea === "severe" || (r.preg?.vomits ?? 0) >= 4).length;
      add({ id: "hyperemesis", level: days >= 2 ? "call" : "mention", date: l.date,
        title: days >= 2 ? "Severe sickness for 2+ days: call your doctor" : "Rough nausea day",
        detail: days >= 2
          ? "Vomiting several times a day, not keeping fluids down, peeing very little or feeling dizzy can be hyperemesis gravidarum. It's treatable; call your doctor rather than pushing through."
          : "If you can't keep fluids down for 24 hours, or feel dizzy and are peeing very little, call your doctor. Small, frequent bland snacks and sipping fluids help." });
    }
  }
  const order: FlagLevel[] = ["urgent", "call", "mention"];
  return flags.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
}

// ---------------------------------------------------------------------------------------------
// The standard prenatal schedule (US, ACOG-based). Exact timing varies by practice.

export interface ScheduleItem {
  id: string;
  title: string;
  fromWeek: number;
  toWeek: number;
  from: string;
  to: string;
  what: string;
  optional?: boolean;
}

const SCHEDULE: Omit<ScheduleItem, "from" | "to">[] = [
  { id: "call-ob", title: "Call your OB or midwife to book", fromWeek: 4, toWeek: 6, what: "Let them know you've had a positive test. Most practices book the first visit for 8–10 weeks." },
  { id: "first-visit", title: "First prenatal visit + dating ultrasound", fromWeek: 8, toWeek: 10, what: "Health history, blood work (blood type, Rh, iron, immunity, infections), urine test, and often an ultrasound to confirm the heartbeat and due date." },
  { id: "nipt", title: "Cell-free DNA screening (NIPT)", fromWeek: 10, toWeek: 13, what: "A blood test that screens for chromosomal conditions like Down syndrome. It can also tell you the sex if you want to know.", optional: true },
  { id: "nt", title: "Nuchal translucency (NT) scan", fromWeek: 11, toWeek: 14, what: "An ultrasound that measures fluid at the back of baby's neck, often paired with first-trimester blood work.", optional: true },
  { id: "afp", title: "AFP / quad screen blood test", fromWeek: 15, toWeek: 20, what: "Screens for neural tube defects like spina bifida.", optional: true },
  { id: "anatomy", title: "Anatomy scan", fromWeek: 18, toWeek: 22, what: "The big detailed ultrasound: baby's organs, spine, heart, growth, and placenta position." },
  { id: "glucose", title: "Glucose screening test", fromWeek: 24, toWeek: 28, what: "You drink a sugary drink and have blood drawn an hour later to check for gestational diabetes." },
  { id: "rhogam", title: "Rh shot, if you're Rh-negative", fromWeek: 28, toWeek: 28, what: "Only needed if your blood type is Rh-negative. Your first-visit blood work will tell you.", optional: true },
  { id: "tdap", title: "Tdap (whooping cough) vaccine", fromWeek: 27, toWeek: 36, what: "Given every pregnancy so your antibodies protect baby in the first months." },
  { id: "rsv", title: "RSV vaccine (or plan for infant shot)", fromWeek: 32, toWeek: 36, what: "Protects newborns from RSV. Given September–January, or baby gets an antibody shot after birth instead.", optional: true },
  { id: "every2", title: "Visits move to every 2 weeks", fromWeek: 28, toWeek: 36, what: "Blood pressure, weight, urine, measuring your bump and baby's heartbeat at each one." },
  { id: "gbs", title: "Group B strep swab", fromWeek: 36, toWeek: 37, what: "A quick swab. If positive, you get antibiotics during labor to protect baby." },
  { id: "weekly", title: "Weekly visits until birth", fromWeek: 36, toWeek: 41, what: "Checking baby's position, your blood pressure and signs of labor." },
];

export function standardSchedule(preg: Pregnancy): ScheduleItem[] {
  // Dates follow the current dating (which may have been updated by a scan).
  const lmp = lmpForDueDate(preg.dueDate);
  return SCHEDULE.map((s) => ({ ...s, from: addDays(lmp, s.fromWeek * 7), to: addDays(lmp, s.toWeek * 7 + 6) }));
}
