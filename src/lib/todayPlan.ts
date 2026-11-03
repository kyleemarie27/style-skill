import { useEffect, useState } from "react";
import { addDays } from "../../shared/dates";
import { gaLabel, gaLong, standardSchedule, type Gestation } from "../../shared/pregnancy";
import { personalGestation, scansForAi, timelineForAi } from "../../shared/scans";
import type { DayLog, Pregnancy } from "../../shared/types";
import { weekContent, type WeekContent } from "../content/pregnancy";
import { api, type DayPlan } from "./api";
import { useStore } from "./store";

type Result = { line: string; plan: DayPlan | null };

/** One request per day, shared by everything on screen that uses it (note, to-dos, partner move, Ask ideas). */
const pending = new Map<string, Promise<Result>>();

function context(date: string, g: Gestation, preg: Pregnancy, week: WeekContent, byDate: Map<string, DayLog>) {
  const days = Array.from({ length: 7 }, (_, n) => addDays(date, -n));
  return {
    pregnant: true,
    today: date,
    gestationalAge: gaLong(g),
    trimester: g.trimester,
    dueDate: preg.dueDate,
    dueDateFrom: preg.dueDateSource,
    scans: scansForAi(preg),
    timelines: timelineForAi(date, preg),
    names: { pregnant: preg.momName ?? null, partner: preg.partnerName ?? null },
    thisWeek: week.headline,
    todaysLine: week.days[Math.max(0, Math.min(6, g.days))],
    babyThisWeek: week.baby.map((b) => b.t),
    weekToDoList: week.todo.map((t) => t.t),
    upcomingAppointments: preg.appointments.filter((a) => a.date >= date).slice(0, 3).map((a) => `${a.date}: ${a.title}`),
    typicallyDueSoon: standardSchedule(preg).filter((s) => s.to >= date).slice(0, 3).map((s) => `${s.title} (weeks ${s.fromWeek}-${s.toWeek})`),
    recentLogs: days.map((d) => {
      const l = byDate.get(d);
      return l ? { date: d, symptoms: l.symptoms, mood: l.mood, ...l.preg } : null;
    }).filter(Boolean),
  };
}

/**
 * Today's personal line and plan for a pregnancy (`p` is null outside pregnancy mode).
 * `plan` stays null when AI is off or the plan couldn't be written.
 * It's always written for the body timeline when a scan gives one (whichever timeline Today shows),
 * so flipping the toggle doesn't rewrite it; the context tells the AI both ages.
 */
export function useTodayPlan(date: string, p: { g: Gestation; preg: Pregnancy; week: WeekContent } | null) {
  const { byDate, aiEnabled: ai } = useStore();
  const aiEnabled = ai && !!p;
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState("");
  const g = p ? personalGestation(date, p.preg) : null;
  const key = g ? `preg-${gaLabel(g).replace(" ", "")}` : "";

  useEffect(() => {
    if (!p || !g || !aiEnabled) return;
    const { preg } = p;
    const week = weekContent(g.weeks);
    let live = true;
    const id = `${date}|${key}`;
    if (!pending.has(id)) {
      const p = api.dailyNote(date, key, context(date, g, preg, week, byDate)).then((r) => ({ line: r.line, plan: r.plan ?? null }));
      p.catch(() => pending.delete(id));
      pending.set(id, p);
    }
    pending.get(id)!.then((r) => live && setRes(r)).catch((e) => live && setErr((e as Error).message));
    return () => {
      live = false;
    };
    // Logs are read once per day on purpose: the plan is written once a day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, key, aiEnabled]);

  return { line: res?.line ?? null, plan: res?.plan ?? null, loading: aiEnabled && !res && !err, err };
}
