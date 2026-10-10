import { describe, expect, it } from "vitest";
import { buildModel } from "../shared/cycle";
import { addDays } from "../shared/dates";
import { healthChecks, summarizeHealth } from "../shared/health";
import { DEFAULT_SETTINGS, type DayLog, type LhTest } from "../shared/types";

/** Build a history from cycle lengths, 5-day periods, optional marked ovulation (cycle day). */
function history(lengths: number[], opts: { ovDay?: number; periodDays?: number; heavyDays?: number } = {}) {
  const logs: DayLog[] = [];
  let start = "2025-01-01";
  for (const len of [...lengths, 30]) {
    for (let i = 0; i < (opts.periodDays ?? 5); i++)
      logs.push({ date: addDays(start, i), flow: i < (opts.heavyDays ?? 1) ? "heavy" : "medium" });
    if (opts.ovDay) logs.push({ date: addDays(start, opts.ovDay - 1), ovulation: true });
    start = addDays(start, len);
  }
  return { logs, today: addDays(start, 3) };
}
const run = (logs: DayLog[], today: string, lh: LhTest[] = [], settings = DEFAULT_SETTINGS) =>
  Object.fromEntries(healthChecks(buildModel(logs, lh, settings), logs, lh, settings, today).map((c) => [c.id, c]));

describe("health checks", () => {
  it("matches Kylee's real pattern: 30-day average OK, 10-day spread over 12 cycles worth watching", () => {
    // her last 12 complete cycle lengths
    const { logs, today } = history([30, 29, 26, 32, 30, 29, 36, 28, 28, 29, 34, 30], { ovDay: 16 });
    const c = run(logs, today);
    expect(c["cycle-length"]).toMatchObject({ status: "ok", value: "30 days avg" });
    expect(c["regularity"]).toMatchObject({ status: "watch", value: "10-day spread" });
    expect(c["period-length"].status).toBe("ok");
    expect(c["luteal"].status).toBe("ok");
  });

  it("calls a tight spread regular and a very wide spread worth a doctor's visit", () => {
    const tight = history([28, 29, 30, 28, 31, 29]);
    expect(run(tight.logs, tight.today).regularity.status).toBe("ok");
    const wide = history([24, 48, 26, 45, 30, 50, 28, 46]);
    expect(run(wide.logs, wide.today).regularity.status).toBe("doctor");
  });

  it("flags out-of-range cycle length, long periods and long heavy runs", () => {
    const short = history([21, 22, 22, 21]);
    expect(run(short.logs, short.today)["cycle-length"].status).toBe("watch");
    const long = history([30, 30, 30], { periodDays: 10, heavyDays: 5 });
    const c = run(long.logs, long.today);
    expect(c["period-length"].status).toBe("doctor");
    expect(c["heavy-flow"].status).toBe("watch");
  });

  it("flags a short luteal phase", () => {
    // ovulation marked on day 22 of 28-day cycles → 7-day luteal
    const { logs, today } = history([28, 28, 28, 28], { ovDay: 22 });
    expect(run(logs, today).luteal).toMatchObject({ status: "watch", value: "7–7 days" });
  });

  it("notices LH testing that never caught a Peak", () => {
    const { logs, today } = history([30, 30, 30]);
    const lh: LhTest[] = [{ date: "2025-03-12", ratio: 0.2, level: "low" }];
    expect(run(logs, today, lh).ovulation.status).toBe("watch");
  });

  it("tracks the 12-month (under 35) and 6-month (35+) check-up point", () => {
    const { logs, today } = history([30, 30]);
    const since = addDays(today, -200); // ~6.5 months
    expect(run(logs, today, [], { ...DEFAULT_SETTINGS, ttcSince: since })["ttc-time"].status).toBe("info");
    expect(run(logs, today, [], { ...DEFAULT_SETTINGS, ttcSince: since, over35: true })["ttc-time"].status).toBe("doctor");
    expect(run(logs, today)["ttc-time"].value).toBe("not enough data yet");
  });

  it("summarizes counts", () => {
    const { logs, today } = history([30, 29, 26, 32, 30, 29, 36, 28, 28, 29, 34, 30], { ovDay: 16 });
    const checks = healthChecks(buildModel(logs, [], DEFAULT_SETTINGS), logs, [], DEFAULT_SETTINGS, today);
    expect(summarizeHealth(checks)).toMatchObject({ watch: 1, doctor: 0 });
  });
});
