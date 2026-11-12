import type { CycleModel, Today } from "../../shared/cycle";
import { addDays, diffDays, prettyDate } from "../../shared/dates";
import type { DayLog, LhTest, Mucus } from "../../shared/types";

/**
 * What Today says in cycle mode: one instruction for today (the hero), and the signals behind it
 * (mucus, LH, temperature, timing) so everything that matters fits in one glance.
 * Pure functions, so they're easy to test.
 */
export interface Focus {
  headline: string;
  sub: string;
  /** Today is one to have sex if you can. */
  counts: boolean;
}

/** The cycle day to start LH strips: a day or so before the fertile window opens (never before day 6). */
export function lhStartDay(info: Today): number {
  return info.cycle && info.fertileStart ? Math.max(6, diffDays(info.fertileStart, info.cycle.start) - 1) : 10;
}

export function lhStartDate(info: Today): string | null {
  return info.cycle ? addDays(info.cycle.start, lhStartDay(info) - 1) : null;
}

function cycleLh(info: Today, model: CycleModel, lhTests: LhTest[]): LhTest[] {
  if (!info.cycle) return [];
  const ignored = new Set(model.afterLoss?.ignoredPeaks ?? []);
  return lhTests
    .filter((t) => t.date >= info.cycle!.start && t.date <= info.date && !(t.level === "peak" && ignored.has(t.date)))
    .sort((a, b) => (a.date + (a.taken_at ?? "")).localeCompare(b.date + (b.taken_at ?? "")));
}

function recentMucus(info: Today, byDate: Map<string, DayLog>): { date: string; cm: Mucus } | null {
  for (let i = 0; i <= 2; i++) {
    const d = addDays(info.date, -i);
    const cm = byDate.get(d)?.cervical_mucus;
    if (cm) return { date: d, cm };
  }
  return null;
}

export function focusFor(info: Today, model: CycleModel, lhTests: LhTest[], byDate: Map<string, DayLog>, quietWait: boolean): Focus {
  const testOn = info.testDate ? prettyDate(info.testDate) : null;
  const unsureLh = !!model.afterLoss && !model.afterLoss.negativeTest;

  if (info.phase === "late") {
    return { headline: "Your period is late. Time to test.", sub: "First-morning urine gives the clearest answer.", counts: false };
  }
  if (info.dpo === 1 && info.fertileDay) {
    return { headline: "Last day of the window.", sub: "One more try today if you'd like. Then your part is done.", counts: true };
  }
  if (info.dpo && info.phase.startsWith("tww")) {
    return {
      headline: "Your part is done.",
      sub: quietWait
        ? `Test on ${testOn}, not before. Waiting saves you a hard morning.`
        : `${info.dpo} days past ovulation. Test on ${testOn}.`,
      counts: false,
    };
  }
  if (info.phase === "menstrual") {
    return {
      headline: "Nothing to time today.",
      sub: info.fertileStart ? `Rest. Your window opens around ${prettyDate(info.fertileStart)}.` : "Rest.",
      counts: false,
    };
  }

  const lh = cycleLh(info, model, lhTests);
  const last = lh.at(-1);
  const recentPeak = lh.find((t) => t.level === "peak" && diffDays(info.date, t.date) <= 1);
  if (recentPeak) {
    return {
      headline: recentPeak.date === info.date ? "LH peak. Today and tomorrow are the days." : "LH peaked yesterday. Today counts.",
      sub: "Ovulation usually follows a peak by 12–36 hours.",
      counts: true,
    };
  }
  if (last && last.date === info.date && last.level === "high" && !unsureLh) {
    return { headline: "LH is rising. Today counts.", sub: "Have sex today and tomorrow, and keep testing for the peak.", counts: true };
  }
  const cm = recentMucus(info, byDate);
  if (cm && (cm.cm === "egg_white" || cm.cm === "watery") && info.date <= (info.fertileEnd ?? info.date)) {
    return {
      headline: "Fertile mucus. Today counts.",
      sub: `${cm.cm === "egg_white" ? "Egg-white" : "Watery"} mucus ${cm.date === info.date ? "today" : cm.date === addDays(info.date, -1) ? "yesterday" : "two days ago"} is your body's own green light.`,
      counts: true,
    };
  }
  if (info.fertileDay && info.ovulation) {
    const toOv = diffDays(info.ovulation, info.date);
    if (toOv >= 0 && toOv <= 2) return { headline: "One of your best days. Today counts.", sub: "The two days before ovulation and the day itself give the best odds.", counts: true };
    return { headline: "Your window is open.", sub: "Every day or two from here until the day after your LH peak.", counts: true };
  }
  if (info.phase === "follicular" && info.fertileStart) {
    const lhDay = lhStartDate(info);
    const days = diffDays(info.fertileStart, info.date);
    const strips = unsureLh
      ? "Take a pregnancy test before you start LH strips."
      : lhDay && lhDay > info.date ? `Start LH strips on ${prettyDate(lhDay)}.` : "Test LH once or twice a day now.";
    return { headline: "Nothing to time yet.", sub: `${strips} Your window opens in about ${days} day${days === 1 ? "" : "s"}.`, counts: false };
  }
  return { headline: "Nothing to time today.", sub: "", counts: false };
}

export interface Signal {
  key: "cm" | "lh" | "temp" | "timing";
  label: string;
  value: string;
  note: string;
  /** Highlight: this signal says "fertile" (or ovulation confirmed). */
  on?: boolean;
}

const CM_LABEL: Record<Mucus, [string, string]> = {
  egg_white: ["Egg white", "Peak fertile sign"],
  watery: ["Watery", "Very fertile"],
  creamy: ["Creamy", "Window approaching"],
  sticky: ["Sticky", "Not yet"],
  dry: ["Dry", "Not yet"],
};

/** "Nov 15–17", or "Nov 30–Dec 2" across a month. */
function dateRange(a: string, b: string): string {
  return a.slice(0, 7) === b.slice(0, 7) ? `${prettyDate(a)}–${Number(b.slice(8))}` : `${prettyDate(a)}–${prettyDate(b)}`;
}

const signed = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}°C`;

export function signalsFor(
  info: Today,
  model: CycleModel,
  lhTests: LhTest[],
  logs: DayLog[],
  byDate: Map<string, DayLog>,
  ouraConnected: boolean,
): Signal[] {
  const out: Signal[] = [];
  const waiting = info.phase.startsWith("tww") || info.phase === "late";
  const cm = recentMucus(info, byDate);
  out.push(
    cm
      ? { key: "cm", label: "Mucus", value: CM_LABEL[cm.cm][0], note: `${CM_LABEL[cm.cm][1]}${cm.date === info.date ? "" : ` · ${prettyDate(cm.date)}`}`, on: cm.cm === "egg_white" || cm.cm === "watery" }
      : waiting
        ? { key: "cm", label: "Mucus", value: "—", note: "Nothing to check in the wait" }
        : { key: "cm", label: "Mucus", value: "Not logged", note: "Check when you wipe; log it below" },
  );

  const lh = cycleLh(info, model, lhTests);
  const last = lh.at(-1);
  const prev = lh.at(-2);
  if (model.afterLoss && !model.afterLoss.negativeTest) {
    out.push({ key: "lh", label: "LH", value: "On hold", note: "Strips can read hCG. Log a negative pregnancy test first" });
  } else if (last) {
    const rising = prev && last.ratio !== null && prev.ratio !== null && last.ratio > prev.ratio;
    const peak = lh.find((t) => t.level === "peak");
    out.push({
      key: "lh",
      label: "LH",
      value: `${last.ratio !== null ? last.ratio.toFixed(2) + " " : ""}${last.level === "peak" ? "Peak" : last.level === "high" ? "High" : "Low"}`,
      note: peak ? `Peaked ${prettyDate(peak.date)}` : `${last.date === info.date ? "Today" : prettyDate(last.date)}${rising ? " · rising" : ""}`,
      on: !waiting && (last.level !== "low" || !!peak),
    });
  } else {
    const start = lhStartDate(info);
    out.push({ key: "lh", label: "LH", value: waiting ? "—" : "No strips yet", note: waiting ? "Nothing to test in the wait" : start && start > info.date ? `Start ${prettyDate(start)}` : "Snap a strip below" });
  }

  const shift = info.cycle?.tempShift ?? null;
  const lastNight = model.wearable.filter((w) => w.tempDev !== null && w.date <= info.date).at(-1);
  if (shift) {
    out.push({ key: "temp", label: "Temperature", value: `Up ${signed(shift.rise)}`, note: `Since ${prettyDate(shift.firstHigh)} · ovulation confirmed`, on: true });
  } else if (lastNight && diffDays(info.date, lastNight.date) <= 3) {
    out.push({
      key: "temp",
      label: "Temperature",
      value: signed(lastNight.tempDev!),
      note: info.phase === "menstrual" ? "Your baseline" : "No sustained rise yet",
    });
  } else if (ouraConnected) {
    out.push({ key: "temp", label: "Temperature", value: "Waiting", note: "Open the Oura app to sync last night" });
  } else {
    out.push({ key: "temp", label: "Temperature", value: "—", note: "Connect Oura in Settings" });
  }

  if (info.fertileStart && info.fertileEnd && info.ovulation) {
    if (info.date < info.fertileStart) {
      out.push({ key: "timing", label: "Timing", value: `Opens ${prettyDate(info.fertileStart)}`, note: `About ${diffDays(info.fertileStart, info.date)} days to go` });
    } else {
      const love = logs.filter((l) => l.intercourse && l.date >= info.fertileStart! && l.date <= info.fertileEnd!).map((l) => l.date);
      const best = love.filter((d) => d >= addDays(info.ovulation!, -2) && d <= info.ovulation!).length;
      out.push({
        key: "timing",
        label: "Timing",
        value: `♥ ${love.length} in window`,
        note: info.date < addDays(info.ovulation, -2)
          ? `Best days ${dateRange(addDays(info.ovulation, -2), info.ovulation)}${info.ovulationConfirmed ? "" : " (est.)"}`
          : `${best} of the 3 best days${info.ovulationConfirmed ? "" : " (est.)"}`,
        on: best >= 2,
      });
    }
  }
  return out;
}

export interface WindowDay {
  date: string;
  love: boolean;
  lh: LhTest["level"] | null;
  cm: Mucus | null;
  best: boolean;
  ovulation: boolean;
  today: boolean;
  future: boolean;
}

/** The fertile window as seven little cells: ♥ days, LH and mucus, with the best days marked. */
export function windowDays(info: Today, model: CycleModel, lhTests: LhTest[], byDate: Map<string, DayLog>): WindowDay[] {
  if (!info.fertileStart || !info.fertileEnd || !info.ovulation) return [];
  const lh = cycleLh(info, model, lhTests);
  const out: WindowDay[] = [];
  for (let d = info.fertileStart; d <= info.fertileEnd; d = addDays(d, 1)) {
    const tests = lh.filter((t) => t.date === d);
    const top = tests.find((t) => t.level === "peak") ?? tests.find((t) => t.level === "high") ?? tests[0];
    out.push({
      date: d,
      love: !!byDate.get(d)?.intercourse,
      lh: top?.level ?? null,
      cm: byDate.get(d)?.cervical_mucus ?? null,
      best: d >= addDays(info.ovulation, -2) && d <= info.ovulation,
      ovulation: d === info.ovulation,
      today: d === info.date,
      future: d > info.date,
    });
  }
  return out;
}

/** The wait list shows from ovulation day until the next period starts. */
export function waitListActive(info: Today): boolean {
  if (!info.ovulation) return false;
  if (!["ovulation", "tww_early", "tww_mid", "tww_late", "late"].includes(info.phase)) return false;
  return info.date >= info.ovulation;
}
