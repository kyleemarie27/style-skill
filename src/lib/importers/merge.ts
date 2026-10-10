import type { DayLog, ImportBundle, LhTest } from "../../../shared/types";

export interface MergeReport {
  bundle: ImportBundle;
  conflicts: { date: string; field: string; kept: string; dropped: string }[];
}

const SOURCE_PRIORITY: Record<string, number> = { premom: 2, clue: 1 };

/**
 * Combine bundles from several files/apps. Rules when two sources describe the same day:
 * - flow, mood, mucus, symptoms: prefer Clue (it's the period app) and union the symptom lists
 * - LH: prefer Premom's numeric readings; drop Clue's positive/negative for days Premom covers
 * - intercourse: true if either says so
 * - BBT: prefer Premom
 */
export function mergeBundles(bundles: ImportBundle[]): ImportBundle {
  return mergeWithReport(bundles).bundle;
}

export function mergeWithReport(bundles: ImportBundle[]): MergeReport {
  const days = new Map<string, DayLog>();
  const conflicts: MergeReport["conflicts"] = [];
  const warnings = bundles.flatMap((b) => b.warnings);

  for (const b of bundles) {
    for (const d of b.dayLogs) {
      const cur = days.get(d.date);
      if (!cur) {
        days.set(d.date, { ...d });
        continue;
      }
      const clueWins = d.source === "clue" && cur.source !== "clue";
      if (d.flow && cur.flow && d.flow !== cur.flow) {
        const keep = clueWins ? d.flow : cur.flow;
        conflicts.push({ date: d.date, field: "flow", kept: keep, dropped: keep === d.flow ? cur.flow : d.flow });
        cur.flow = keep;
      } else cur.flow ??= d.flow;
      cur.intercourse = !!(cur.intercourse || d.intercourse) || null;
      cur.symptoms = [...new Set([...(cur.symptoms ?? []), ...(d.symptoms ?? [])])];
      if (!cur.symptoms.length) cur.symptoms = null;
      cur.mood = clueWins ? (d.mood ?? cur.mood) : (cur.mood ?? d.mood);
      cur.cervical_mucus = clueWins ? (d.cervical_mucus ?? cur.cervical_mucus) : (cur.cervical_mucus ?? d.cervical_mucus);
      cur.bbt = d.source === "premom" ? (d.bbt ?? cur.bbt) : (cur.bbt ?? d.bbt);
      cur.pregnancy_test ??= d.pregnancy_test;
      cur.notes = [cur.notes, d.notes].filter(Boolean).join(" · ") || null;
      if (cur.source !== d.source) cur.source = "import";
    }
  }

  // LH: numeric readings win; keep every numeric test, but only one yes/no result per day.
  const all: LhTest[] = bundles.flatMap((b) => b.lhTests);
  const numericDays = new Set(all.filter((t) => t.ratio !== null).map((t) => t.date));
  const seen = new Set<string>();
  const lhTests = all
    .filter((t) => t.ratio !== null || !numericDays.has(t.date))
    .sort((a, b) => (SOURCE_PRIORITY[b.source ?? ""] ?? 0) - (SOURCE_PRIORITY[a.source ?? ""] ?? 0))
    .filter((t) => {
      const key = `${t.date}|${t.taken_at ?? ""}|${t.ratio ?? t.level}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    bundle: {
      dayLogs: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
      lhTests,
      warnings,
    },
    conflicts,
  };
}

export interface ImportSummary {
  periods: number;
  periodDays: number;
  lhTests: number;
  peaks: number;
  intercourseDays: number;
  bbtDays: number;
  from: string | null;
  to: string | null;
}

export function summarize(b: ImportBundle, periodStarts: number): ImportSummary {
  const dates = [...b.dayLogs.map((d) => d.date), ...b.lhTests.map((t) => t.date)].sort();
  return {
    periods: periodStarts,
    periodDays: b.dayLogs.filter((d) => d.flow && d.flow !== "none").length,
    lhTests: b.lhTests.length,
    peaks: b.lhTests.filter((t) => t.level === "peak").length,
    intercourseDays: b.dayLogs.filter((d) => d.intercourse).length,
    bbtDays: b.dayLogs.filter((d) => d.bbt).length,
    from: dates[0] ?? null,
    to: dates.at(-1) ?? null,
  };
}
