import type { CycleModel } from "./cycle.js";
import { addDays, diffDays } from "./dates.js";
import type { DayLog, LhTest, Settings } from "./types.js";

/**
 * "Am I on track?": a handful of checks against published normal ranges.
 * General information only. The wording says "worth watching" / "worth asking your doctor",
 * never a diagnosis.
 *
 * Ranges:
 * - Cycle length 24–38 days; cycle-to-cycle variation up to 7–9 days; period up to 8 days
 *   (FIGO 2018 system for normal menstruation, also used by ACOG).
 * - Luteal phase 10–16 days; under 10 is usually called short (ASRM).
 * - See a fertility specialist after 12 months of trying under 35, 6 months at 35+ (ACOG/ASRM).
 */

export type Status = "ok" | "watch" | "doctor" | "info";

export interface HealthCheck {
  id: string;
  title: string;
  status: Status;
  /** Your number, short ("30 days"). */
  value: string;
  /** The normal range, short ("24–38 days"). */
  range: string;
  /** One or two plain sentences about what we see. */
  summary: string;
  /** Why it matters / what to do. */
  why: string;
  source: string;
}

const FIGO = "FIGO 2018 normal menstruation criteria (used by ACOG)";
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export function healthChecks(
  model: CycleModel,
  logs: DayLog[],
  lhTests: LhTest[],
  settings: Settings,
  today: string,
): HealthCheck[] {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const complete = model.cycles.filter((c) => c.length !== null && c.length >= 15 && c.length <= 90);
  const lengths = complete.map((c) => c.length!);
  const last12 = lengths.slice(-12);
  const last6 = lengths.slice(-6);
  const checks: HealthCheck[] = [];

  // 1. Cycle length
  if (last12.length >= 2) {
    const avg = Math.round(mean(last12));
    const status: Status = avg < 21 || avg > 45 ? "doctor" : avg < 24 || avg > 38 ? "watch" : "ok";
    checks.push({
      id: "cycle-length",
      title: "Cycle length",
      status,
      value: `${avg} days avg`,
      range: "24–38 days",
      summary:
        status === "ok"
          ? `Your last ${plural(last12.length, "cycle")} averaged ${avg} days, comfortably inside the normal range.`
          : `Your last ${plural(last12.length, "cycle")} averaged ${avg} days, outside the usual 24–38.`,
      why:
        status === "ok"
          ? "Cycle length mostly reflects when you ovulate; a steady average in range is a good sign your hormones are cycling normally."
          : "Consistently short or long cycles can mean ovulation is early, late or skipped. Worth mentioning to your doctor, especially while trying to conceive.",
      source: FIGO,
    });
  } else {
    checks.push(needsData("cycle-length", "Cycle length", "24–38 days", "Log or import at least 3 periods to see your average."));
  }

  // 2. Regularity: shortest-to-longest spread
  if (last6.length >= 3) {
    const spread12 = Math.max(...last12) - Math.min(...last12);
    const spread6 = Math.max(...last6) - Math.min(...last6);
    const spread = last12.length >= 8 ? spread12 : spread6;
    const status: Status = spread >= 20 ? "doctor" : spread >= 10 ? "watch" : "ok";
    const longOnes = last12.filter((l) => l >= Math.round(median(last12)) + 5);
    checks.push({
      id: "regularity",
      title: "Cycle regularity",
      status,
      value: `${spread}-day spread`,
      range: "up to 7–9 days",
      summary:
        `Last ${plural(last12.length, "cycle")}: ${Math.min(...last12)}–${Math.max(...last12)} days (${spread12}-day spread). ` +
        `Last ${last6.length}: ${Math.min(...last6)}–${Math.max(...last6)} days (${spread6}-day spread).` +
        (longOnes.length && status !== "ok" ? ` Usually around ${Math.round(median(last12))} days, with ${plural(longOnes.length, "longer cycle")} (${longOnes.join(", ")} days).` : ""),
      why:
        status === "ok"
          ? "A small spread means ovulation happens at a fairly predictable time, which makes your fertile window easier to target."
          : status === "watch"
            ? "Slightly more variable than the textbook range, usually because ovulation came later in an occasional cycle (stress, travel and illness can all do this). Keep testing LH so you catch late ovulation; mention it at your next check-up if it continues."
            : "Very variable cycles can point to irregular ovulation (for example PCOS or thyroid issues). Worth a conversation with your doctor.",
      source: FIGO,
    });
  }

  // 3. Period length
  const periodLens = complete.slice(-6).map((c) => diffDays(c.periodEnd, c.start) + 1);
  if (periodLens.length >= 2) {
    const typical = Math.round(median(periodLens));
    const longCount = periodLens.filter((l) => l > 8).length;
    const status: Status = typical > 8 ? "doctor" : longCount > 0 ? "watch" : "ok";
    checks.push({
      id: "period-length",
      title: "Period length",
      status,
      value: `${typical} days typical`,
      range: "up to 8 days",
      summary:
        `Your last ${plural(periodLens.length, "period")} lasted ${Math.min(...periodLens)}–${Math.max(...periodLens)} days.` +
        (longCount ? ` ${plural(longCount, "period")} ran longer than 8 days (that can include spotting at the end).` : ""),
      why:
        status === "ok"
          ? "Periods of 8 days or fewer are considered normal."
          : "Periods regularly longer than 8 days can be linked to fibroids, polyps or hormone imbalance. Worth mentioning if it keeps happening.",
      source: FIGO,
    });
  }

  // 4. Heavy flow streaks
  const recentStarts = model.cycles.slice(-6).map((c) => c.start);
  const heavyRuns = recentStarts.map((s) => {
    let run = 0;
    let best = 0;
    for (let i = 0; i < 10; i++) {
      if (byDate.get(addDays(s, i))?.flow === "heavy") best = Math.max(best, ++run);
      else run = 0;
    }
    return best;
  });
  if (recentStarts.length >= 2) {
    const worst = Math.max(...heavyRuns);
    const status: Status = worst >= 4 ? "watch" : "ok";
    checks.push({
      id: "heavy-flow",
      title: "Heavy flow",
      status,
      value: worst ? `up to ${plural(worst, "heavy day")} in a row` : "no long heavy runs",
      range: "a few heavy days at most",
      summary:
        status === "ok"
          ? "No long stretches of heavy bleeding in your recent periods."
          : `One recent period had ${worst} heavy days in a row.`,
      why:
        status === "ok"
          ? "A day or two of heavier flow at the start is typical."
          : "Long heavy stretches can lower iron and sometimes have a treatable cause. If you're soaking a pad or tampon every 1–2 hours, or feel dizzy or very tired, talk to your doctor.",
      source: "ACOG: heavy menstrual bleeding",
    });
  }

  // 5. Luteal phase
  const luteal = complete
    .filter((c) => c.ovulationConfirmed)
    .slice(-6)
    .map((c) => diffDays(addDays(c.start, c.length!), c.ovulation));
  if (luteal.length >= 2) {
    const short = luteal.filter((l) => l < 10).length;
    const status: Status = short >= 2 ? "watch" : "ok";
    checks.push({
      id: "luteal",
      title: "Luteal phase",
      status,
      value: `${Math.min(...luteal)}–${Math.max(...luteal)} days`,
      range: "10–16 days",
      summary: `From ${plural(luteal.length, "cycle")} with a confirmed ovulation date, your period came ${Math.min(...luteal)}–${Math.max(...luteal)} days after ovulating.`,
      why:
        status === "ok"
          ? "This is the time an embryo has to implant. 10+ days is considered healthy, and yours is steady."
          : "A luteal phase under 10 days can make implantation harder. It's easy to check with your doctor (often with a day-21 progesterone test).",
      source: "ASRM: luteal phase",
    });
  } else {
    checks.push(needsData("luteal", "Luteal phase", "10–16 days", "Needs a few cycles where ovulation is confirmed (an LH Peak or a Premom-confirmed day)."));
  }

  // 6. Ovulation detected recently
  const recent = model.cycles.filter((c) => c.end !== null).slice(-3);
  const testedCycles = recent.filter((c) => lhTests.some((t) => t.date >= c.start && t.date <= c.end!));
  if (recent.length) {
    const confirmed = recent.filter((c) => c.ovulationConfirmed);
    const lhPeaks = recent.filter((c) => c.ovulationSource === "lh").length;
    const missed = testedCycles.filter((c) => c.ovulationSource !== "lh");
    const status: Status = confirmed.length === recent.length && missed.length === 0 ? "ok" : missed.length ? "watch" : "info";
    checks.push({
      id: "ovulation",
      title: "Ovulation confirmed",
      status,
      value: `${confirmed.length} of ${recent.length} recent`,
      range: "every cycle",
      summary:
        `${confirmed.length} of your last ${plural(recent.length, "cycle")} have a confirmed ovulation day` +
        (lhPeaks ? ` (${lhPeaks} from an LH Peak).` : ".") +
        (missed.length ? ` You tested LH in ${plural(missed.length, "cycle")} without catching a Peak.` : ""),
      why: missed.length
        ? "No Peak usually means the surge happened between tests, not that you didn't ovulate. Test twice a day (around 2pm and 8pm) from a few days before your usual ovulation day, and keep going until the line is as dark as the control."
        : "Regular ovulation is the foundation for conceiving. Confirming it (LH Peak, BBT rise or your app's confirmation) also makes your fertile-window predictions much more accurate.",
      source: "ACOG: evaluating infertility",
    });
  }

  // 7. Timing: intercourse in the 3 days up to ovulation
  const ttcFrom = settings.ttcSince ?? logs.find((l) => l.intercourse)?.date ?? null;
  const timingCycles = model.cycles
    .filter((c) => (ttcFrom ? c.ovulation >= ttcFrom : true) && c.ovulation < today)
    .filter((c) => logs.some((l) => l.intercourse && l.date >= c.start && (c.end === null || l.date <= c.end)))
    .slice(-6);
  if (timingCycles.length) {
    const hits = timingCycles.filter((c) =>
      logs.some((l) => l.intercourse && l.date >= addDays(c.ovulation, -3) && l.date <= c.ovulation),
    ).length;
    const status: Status = hits === timingCycles.length ? "ok" : "watch";
    checks.push({
      id: "timing",
      title: "Timing in the fertile window",
      status,
      value: `${hits} of ${plural(timingCycles.length, "cycle")}`,
      range: "every cycle",
      summary: `In ${hits} of ${plural(timingCycles.length, "cycle")} you had sex in the 3 days up to (or on) ovulation day.`,
      why: "Those days carry the highest chance of conceiving. Every 1–2 days through the fertile window covers it without needing to pinpoint the exact day.",
      source: "ASRM: optimizing natural fertility",
    });
  }

  // 8. Premenstrual spotting
  const spotty = model.cycles.slice(-6).filter((c) => {
    let run = 0;
    for (let i = 1; i <= 7; i++) {
      if (byDate.get(addDays(c.start, -i))?.flow === "spotting") run++;
      else break;
    }
    return run >= 3;
  }).length;
  if (model.cycles.length >= 2) {
    checks.push({
      id: "spotting",
      title: "Spotting before your period",
      status: spotty >= 2 ? "watch" : "ok",
      value: spotty ? `${plural(spotty, "cycle")} with 3+ days` : "none logged",
      range: "0–2 days",
      summary: spotty
        ? `${plural(spotty, "recent cycle")} had 3 or more days of spotting before your period started.`
        : "No long runs of spotting before your periods.",
      why:
        spotty >= 2
          ? "Several days of spotting before a period can be a sign of low progesterone or a short luteal phase. Worth mentioning to your doctor."
          : "A day or two of spotting right before a period is common.",
      source: "ASRM: luteal phase",
    });
  }

  // 9. Trying-to-conceive timeline
  const limitMonths = settings.over35 ? 6 : 12;
  if (settings.ttcSince) {
    const months = Math.max(0, Math.floor(diffDays(today, settings.ttcSince) / 30.44));
    const status: Status = months >= limitMonths ? "doctor" : "info";
    checks.push({
      id: "ttc-time",
      title: "Time trying",
      status,
      value: `${plural(months, "month")}`,
      range: `check-up at ${limitMonths} months`,
      summary:
        status === "doctor"
          ? `You've been trying for ${plural(months, "month")}.`
          : `${plural(months, "month")} so far. ${plural(limitMonths - months, "month")} until the point doctors suggest a check-up.`,
      why:
        status === "doctor"
          ? `Doctors recommend a fertility evaluation after ${limitMonths} months of trying${settings.over35 ? " at 35+" : " under 35"}. It's routine, often simple tests for both partners, and nothing to be alarmed about.`
          : "About 80–85% of couples conceive within a year. Many take several cycles, even with perfect timing.",
      source: "ACOG/ASRM: when to seek a fertility evaluation",
    });
  } else {
    checks.push(needsData("ttc-time", "Time trying", `check-up at ${limitMonths} months`, "Add the date you started trying in Settings to track this."));
  }

  return checks;
}

function needsData(id: string, title: string, range: string, summary: string): HealthCheck {
  return { id, title, status: "info", value: "not enough data yet", range, summary, why: "", source: "" };
}

export function summarizeHealth(checks: HealthCheck[]) {
  const count = (s: Status) => checks.filter((c) => c.status === s).length;
  return { ok: count("ok"), watch: count("watch"), doctor: count("doctor") };
}
