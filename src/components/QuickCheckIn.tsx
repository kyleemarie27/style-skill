import { addDays } from "../../shared/dates";
import type { DayLog, Pregnancy } from "../../shared/types";
import { useStore } from "../lib/store";
import { SymptomPicker } from "./SymptomPicker";

/** Five moods as faces. Each maps onto the mood field the Log page uses. */
const MOODS: { mood: string; icon: string; label: string }[] = [
  { mood: "Happy", icon: "😊", label: "Good" },
  { mood: "Calm", icon: "😐", label: "Okay" },
  { mood: "Sad", icon: "😔", label: "Low" },
  { mood: "Anxious", icon: "😟", label: "Worried" },
  { mood: "Irritable", icon: "😤", label: "Cranky" },
];

const moodList = (l: DayLog) => (l.mood ?? "").split(",").map((m) => m.trim()).filter(Boolean);

/**
 * Today's check-in: mood, symptoms and the prenatal, all saving on tap. Bleeding, pain, warning
 * signs and vitals live on the Log page ("Details"), which is also where other days are logged.
 */
export function QuickCheckIn({ today, preg }: { today: string; preg: Pregnancy }) {
  const { byDate, saveDay } = useStore();
  const log: DayLog = byDate.get(today) ?? { date: today };
  const yesterday = addDays(today, -1);
  const prenatal = !!log.preg?.prenatal;
  const moods = moodList(log);
  const toggleMood = (m: string) => {
    const rest = moods.filter((x) => x !== m);
    saveDay({ ...log, mood: (moods.includes(m) ? rest : [...rest, m]).join(", ") || null });
  };

  return (
    <section className="card stack" aria-label="How are you feeling today?">
      <div className="row between" style={{ alignItems: "baseline" }}>
        <h3 className="card-h">How are you feeling?</h3>
        <a className="small" href={`#/day/${today}`}>Details ›</a>
      </div>
      <div className="feelings">
        {MOODS.map((f) => (
          <button key={f.mood} className="feeling" aria-pressed={moods.includes(f.mood)} onClick={() => toggleMood(f.mood)}>
            <span aria-hidden>{f.icon}</span>{f.label}
          </button>
        ))}
      </div>
      <SymptomPicker log={log} since={preg.lmp} onChange={saveDay} label="Anything going on?" />
      <div className="row between wrap" style={{ alignItems: "center" }}>
        <button className="chip cm" aria-pressed={prenatal} onClick={() => saveDay({ ...log, preg: { ...log.preg, prenatal: !prenatal } })}>
          💊 {prenatal ? "Prenatal taken" : "Took my prenatal"}
        </button>
        {!byDate.has(yesterday) && <a className="small muted" href={`#/day/${yesterday}`}>Log yesterday ›</a>}
      </div>
    </section>
  );
}
