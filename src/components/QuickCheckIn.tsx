import { addDays } from "../../shared/dates";
import type { DayLog } from "../../shared/types";
import { useStore } from "../lib/store";

interface Feeling {
  id: string;
  icon: string;
  label: string;
  on: (l: DayLog) => boolean;
  set: (l: DayLog, on: boolean) => DayLog;
}

const moodList = (l: DayLog) => (l.mood ?? "").split(",").map((m) => m.trim()).filter(Boolean);
const withMood = (mood: string) => ({
  on: (l: DayLog) => moodList(l).includes(mood),
  set: (l: DayLog, on: boolean) => {
    const rest = moodList(l).filter((m) => m !== mood);
    return { ...l, mood: (on ? [...rest, mood] : rest).join(", ") || null };
  },
});
const withSymptom = (s: string) => ({
  on: (l: DayLog) => !!l.symptoms?.includes(s),
  set: (l: DayLog, on: boolean) => {
    const rest = (l.symptoms ?? []).filter((x) => x !== s);
    return { ...l, symptoms: on ? [...rest, s] : rest };
  },
});

/** Five quick "weather" chips that map onto the real log fields. */
const FEELINGS: Feeling[] = [
  { id: "good", icon: "😊", label: "Good", ...withMood("Happy") },
  { id: "okay", icon: "😐", label: "Okay", ...withMood("Calm") },
  {
    id: "queasy", icon: "🤢", label: "Queasy",
    on: (l) => !!l.preg?.nausea && l.preg.nausea !== "none",
    set: (l, on) => ({ ...l, preg: { ...l.preg, nausea: on ? (l.preg?.nausea && l.preg.nausea !== "none" ? l.preg.nausea : "mild") : "none" } }),
  },
  { id: "wiped", icon: "😴", label: "Wiped", ...withSymptom("Fatigue") },
  { id: "worried", icon: "😟", label: "Worried", ...withMood("Anxious") },
];

/** Today's one-row check-in. Everything else (bleeding, cramping, vitals) lives on the Log page. */
export function QuickCheckIn({ today }: { today: string }) {
  const { byDate, saveDay } = useStore();
  const log: DayLog = byDate.get(today) ?? { date: today };
  const yesterday = addDays(today, -1);
  const toggle = (f: Feeling) => saveDay(f.set(log, !f.on(log)));
  const prenatal = !!log.preg?.prenatal;

  return (
    <section className="card stack" aria-label="How are you feeling today?">
      <div className="row between" style={{ alignItems: "baseline" }}>
        <h3 className="card-h">How are you feeling today?</h3>
        <a className="small" href={`#/day/${today}`}>Log more ›</a>
      </div>
      <div className="feelings">
        {FEELINGS.map((f) => (
          <button key={f.id} className="feeling" aria-pressed={f.on(log)} onClick={() => toggle(f)}>
            <span aria-hidden>{f.icon}</span>{f.label}
          </button>
        ))}
      </div>
      <div className="row between wrap" style={{ alignItems: "center" }}>
        <button className="chip" aria-pressed={prenatal} onClick={() => saveDay({ ...log, preg: { ...log.preg, prenatal: !prenatal } })}>
          💊 {prenatal ? "Prenatal taken" : "Took my prenatal"}
        </button>
        {!byDate.has(yesterday) && <a className="small muted" href={`#/day/${yesterday}`}>Log yesterday ›</a>}
      </div>
    </section>
  );
}
