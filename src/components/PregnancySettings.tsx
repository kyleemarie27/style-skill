import { useState } from "react";
import { localToday, prettyDate } from "../../shared/dates";
import { activePregnancy, gaLabel, gestation, lmpForDueDate } from "../../shared/pregnancy";
import type { Pregnancy } from "../../shared/types";
import { useStore } from "../lib/store";
import { PositiveTestSheet } from "./PositiveTestSheet";

/** Settings card: start pregnancy mode, update the due date, or end it gently. */
export function PregnancySettings() {
  const { settings, setSettings } = useStore();
  const preg = activePregnancy(settings);
  const [sheet, setSheet] = useState(false);
  const [due, setDue] = useState(preg?.dueDate ?? "");
  const [saved, setSaved] = useState(false);
  const [ending, setEnding] = useState<null | Pregnancy["ended"]>(null);
  const [endedMsg, setEndedMsg] = useState<string | null>(null);

  if (!preg) {
    return (
      <div className="card stack">
        <h2>Pregnancy</h2>
        {endedMsg ? <div className="notice">{endedMsg}</div> : <p className="muted small">Got a positive test? Bloom switches to a week-by-week pregnancy guide, symptom tracking for your doctor, and appointment planning.</p>}
        <button className="btn primary" onClick={() => setSheet(true)}>I got a positive test</button>
        {sheet && <PositiveTestSheet onClose={() => setSheet(false)} />}
      </div>
    );
  }

  const saveDue = async () => {
    await setSettings({ ...settings, pregnancy: { ...preg, dueDate: due, lmp: lmpForDueDate(due), dueDateSource: "doctor" } });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  const end = async () => {
    if (!ending) return;
    await setSettings({ ...settings, ttc: ending.reason !== "birth", pregnancy: { ...preg, ended: ending } });
    setEndedMsg(
      ending.reason === "loss"
        ? "We're so sorry. Bloom is back to cycle tracking whenever you're ready, and your pregnancy history is kept. Please be gentle with yourself, and reach out to your doctor about follow-up care and support."
        : ending.reason === "birth"
          ? "Congratulations on your baby! Bloom has switched back to cycle tracking; your pregnancy history is kept."
          : "Bloom is back to cycle tracking. Your pregnancy history is kept.",
    );
    setEnding(null);
  };

  return (
    <div className="card stack">
      <h2>Pregnancy</h2>
      <p className="small">
        <b>{gaLabel(gestation(localToday(), preg))}</b> today · due <b>{prettyDate(preg.dueDate)}, {preg.dueDate.slice(0, 4)}</b>{" "}
        <span className="muted">(from {preg.dueDateSource === "doctor" ? "your doctor" : preg.dueDateSource === "ovulation" ? "your tracked ovulation" : "your last period"}) · positive test {prettyDate(preg.positiveTestDate)}</span>
      </p>
      <label>
        <div className="field-label">Due date (update it after your dating ultrasound)</div>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </label>
      <button className="btn primary" onClick={saveDue} disabled={!due || due === preg.dueDate}>{saved ? "Saved ✓" : "Save due date"}</button>

      <details>
        <summary className="small muted">My pregnancy has ended</summary>
        <div className="stack" style={{ marginTop: 10 }}>
          <p className="small muted">This switches Bloom back to cycle tracking. Nothing you've logged is deleted.</p>
          <div className="chips">
            {([["birth", "Baby is here"], ["loss", "Pregnancy loss"], ["other", "Other"]] as const).map(([reason, label]) => (
              <button key={reason} className="chip" aria-pressed={ending?.reason === reason} onClick={() => setEnding({ date: localToday(), reason })}>{label}</button>
            ))}
          </div>
          {ending && (
            <>
              <label><div className="field-label">Date</div><input type="date" value={ending.date} max={localToday()} onChange={(e) => e.target.value && setEnding({ ...ending, date: e.target.value })} /></label>
              <button className="btn" onClick={end}>Switch back to cycle tracking</button>
            </>
          )}
        </div>
      </details>
    </div>
  );
}
