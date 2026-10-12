import { PHASE_NAME, phaseFor, type CycleModel } from "../../shared/cycle";
import { addDays, diffDays } from "../../shared/dates";
import { healthChecks } from "../../shared/health";
import { patternFor } from "../../shared/patterns";
import { activePregnancy, gaLong, gestation, pregnancyFlags, standardSchedule } from "../../shared/pregnancy";
import type { DayLog, LhTest, Settings } from "../../shared/types";

/** A compact snapshot of the user's data for Ask Bloom (sent with each question). */
export function buildAskContext(model: CycleModel, logs: DayLog[], lhTests: LhTest[], settings: Settings, today: string) {
  const preg = activePregnancy(settings);
  if (preg) {
    const g = gestation(today, preg);
    const since = addDays(today, -14);
    return {
      pregnant: true,
      today,
      gestationalAge: gaLong(g),
      trimester: g.trimester,
      dueDate: preg.dueDate,
      dueDateFrom: preg.dueDateSource,
      lastPeriod: preg.lmp,
      positiveTest: preg.positiveTestDate,
      recentDays: logs
        .filter((l) => l.date >= since)
        .map(({ date, symptoms, mood, notes, preg: p }) => ({ date, symptoms, mood, notes, ...p })),
      warningFlags: pregnancyFlags(logs, preg, today).map((f) => ({ level: f.level, title: f.title, date: f.date })),
      appointments: preg.appointments.map((a) => ({ date: a.date, title: a.title })),
      openQuestionsForDoctor: preg.questions.filter((q) => !q.done).map((q) => q.text),
      typicalScheduleNow: standardSchedule(preg).filter((s) => s.to >= today).slice(0, 4).map((s) => `${s.title} (weeks ${s.fromWeek}-${s.toWeek})`),
      averageCycleLengthBeforePregnancy: model.avgCycleLength,
      over35: !!settings.over35,
    };
  }
  const info = phaseFor(today, model);
  const recentSince = addDays(today, -35);
  return {
    today,
    phase: PHASE_NAME[info.phase],
    cycleDay: info.cycleDay,
    dpo: info.dpo,
    fertileWindow: info.fertileStart ? `${info.fertileStart} to ${info.fertileEnd}` : null,
    ovulation: info.ovulation ? { date: info.ovulation, confirmed: info.ovulationConfirmed } : null,
    nextPeriodPredicted: info.nextPeriod,
    averages: {
      cycleLength: model.avgCycleLength,
      periodLength: model.avgPeriodLength,
      lutealLength: model.avgLutealLength,
      typicalOvulationCycleDay: model.typicalOvulationDay,
    },
    cycles: model.cycles.slice(-12).map((c) => ({
      start: c.start,
      length: c.length,
      periodDays: diffDays(c.periodEnd, c.start) + 1,
      ovulationCycleDay: diffDays(c.ovulation, c.start) + 1,
      ovulationSource: c.ovulationSource,
    })),
    healthChecks: healthChecks(model, logs, lhTests, settings, today).map((c) => ({
      check: c.title, status: c.status, value: c.value, normal: c.range, summary: c.summary,
    })),
    patternAroundToday: patternFor(info, model, logs).tags.map((t) => `${t.label} (${t.cycles}/${t.of} cycles)`),
    recentDays: logs
      .filter((l) => l.date >= recentSince)
      .map(({ date, flow, intercourse, symptoms, mood, cervical_mucus, bbt, pregnancy_test, ovulation }) =>
        Object.fromEntries(Object.entries({ date, flow, intercourse, symptoms, mood, cervical_mucus, bbt, pregnancy_test, ovulation }).filter(([, v]) => v != null && v !== false && !(Array.isArray(v) && !v.length)))),
    recentLhTests: lhTests.filter((t) => t.date >= recentSince).map((t) => ({ date: t.date, time: t.taken_at, ratio: t.ratio, level: t.level })),
    tryingSince: settings.ttcSince ?? null,
    over35: !!settings.over35,
  };
}
