import { useState } from "react";
import type { DayLog } from "../../shared/types";
import { hasSymptom, normalizeSymptom, recurringSymptoms, setSymptom, TOP_SYMPTOMS, WARNING_SYMPTOMS } from "../lib/symptoms";
import { useStore } from "../lib/store";

/**
 * Pregnancy symptoms as chips: the top ten, then your own that keep coming back, then anything
 * else logged that day. "+ Add your own" takes any symptom; log it on 3 days and it sticks around.
 */
export function SymptomPicker({ log, since, onChange, label = "Symptoms" }: {
  log: DayLog; since: string; onChange: (log: DayLog) => void; label?: string;
}) {
  const { dayLogs } = useStore();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const recurring = recurringSymptoms(dayLogs, since);
  const base = [...TOP_SYMPTOMS, ...recurring];
  const extra = (log.symptoms ?? []).filter((s) => !base.some((b) => b.toLowerCase() === s.toLowerCase()) && !WARNING_SYMPTOMS.includes(s));
  const options = [...base, ...extra];

  const add = () => {
    const name = normalizeSymptom(draft, [...options, ...WARNING_SYMPTOMS]);
    if (name) onChange(setSymptom(log, name, true));
    setDraft("");
    setAdding(false);
  };

  return (
    <div role="group" aria-label={label}>
      {label && <div className="field-label">{label}</div>}
      <div className="chips">
        {options.map((o) => {
          const on = hasSymptom(log, o);
          return (
            <button key={o} type="button" className="chip sym" aria-pressed={on} onClick={() => onChange(setSymptom(log, o, !on))}>{o}</button>
          );
        })}
        {!adding && <button type="button" className="chip add-chip" onClick={() => setAdding(true)}>+ Add your own</button>}
      </div>
      {adding && (
        <form className="row add-symptom" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <input type="text" autoFocus placeholder="e.g. Stuffy nose" value={draft} maxLength={40} onChange={(e) => setDraft(e.target.value)} aria-label="Your symptom" />
          <button className="btn primary" disabled={!draft.trim()}>Add</button>
          <button type="button" className="btn ghost" onClick={() => { setAdding(false); setDraft(""); }}>Cancel</button>
        </form>
      )}
      {adding && <p className="tiny muted" style={{ marginTop: 6 }}>Log it on 3 different days and it becomes one of your regular options.</p>}
    </div>
  );
}
