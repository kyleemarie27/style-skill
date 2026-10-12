import { useMemo, useState } from "react";
import { addDays, localToday, prettyDate } from "../../shared/dates";
import { dueDateFrom, gaLong, gestation, lmpForDueDate, TERM_DAYS } from "../../shared/pregnancy";
import type { Pregnancy } from "../../shared/types";
import { useStore } from "../lib/store";

/**
 * "I got a positive test": confirms the dating Bloom worked out from the cycle data, then
 * switches the whole app to pregnancy mode.
 */
export function PositiveTestSheet({ onClose, date = localToday() }: { onClose: () => void; date?: string }) {
  const { model, settings, setSettings, byDate, saveDay } = useStore();
  const est = useMemo(() => dueDateFrom(model, date), [model, date]);
  const [mode, setMode] = useState<"auto" | "lmp" | "doctor">("auto");
  const [lmp, setLmp] = useState(est.lmp);
  const [due, setDue] = useState(est.dueDate);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const dueDate = mode === "auto" ? est.dueDate : mode === "lmp" ? addDays(lmp, TERM_DAYS) : due;
  const g = gestation(localToday(), { dueDate });

  const confirm = async () => {
    setBusy(true);
    setErr("");
    try {
      const pregnancy: Pregnancy = {
        positiveTestDate: date,
        lmp: mode === "lmp" ? lmp : mode === "doctor" ? lmpForDueDate(due) : est.lmp,
        dueDate,
        dueDateSource: mode === "auto" ? est.source : mode === "lmp" ? "lmp" : "doctor",
        ended: null,
        questions: settings.pregnancy?.questions ?? [],
        appointments: settings.pregnancy?.appointments ?? [],
      };
      await saveDay({ ...(byDate.get(date) ?? { date }), date, pregnancy_test: "positive" });
      await setSettings({ ...settings, ttc: false, pregnancy });
      window.location.hash = "#/today";
      onClose();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet stack" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="pos-title">
        <div className="center stack" style={{ gap: 6 }}>
          <div style={{ fontSize: 44 }} aria-hidden>🌱</div>
          <h2 id="pos-title">Congratulations!</h2>
          <p className="muted small">A positive test on {prettyDate(date, true)}. Let's set Bloom up for this pregnancy.</p>
        </div>

        <div className="preg-confirm">
          <div>
            <div className="tiny muted">You're about</div>
            <b>{g.totalDays >= 0 ? gaLong(g) : "under 4 weeks"}</b>
          </div>
          <div>
            <div className="tiny muted">Estimated due date</div>
            <b>{prettyDate(dueDate)}, {dueDate.slice(0, 4)}</b>
          </div>
        </div>

        <div role="radiogroup" aria-label="How to date this pregnancy" className="stack" style={{ gap: 8 }}>
          <label className="radio-row">
            <input type="radio" checked={mode === "auto"} onChange={() => setMode("auto")} />
            <span><b>Use my Bloom data</b><br /><span className="small muted">{est.how}</span></span>
          </label>
          <label className="radio-row">
            <input type="radio" checked={mode === "lmp"} onChange={() => setMode("lmp")} />
            <span><b>Use a different last-period date</b></span>
          </label>
          {mode === "lmp" && <input type="date" value={lmp} max={date} onChange={(e) => e.target.value && setLmp(e.target.value)} aria-label="First day of last period" />}
          <label className="radio-row">
            <input type="radio" checked={mode === "doctor"} onChange={() => setMode("doctor")} />
            <span><b>My doctor gave me a due date</b></span>
          </label>
          {mode === "doctor" && <input type="date" value={due} onChange={(e) => e.target.value && setDue(e.target.value)} aria-label="Due date" />}
        </div>

        <p className="tiny muted">
          Your doctor will confirm the dates, usually with an early ultrasound. You can change them any time in Settings.
          Bloom switches from trying-to-conceive to pregnancy mode; your cycle history stays.
        </p>
        {err && <div className="notice err">{err}</div>}
        <div className="row">
          <button className="btn ghost" onClick={onClose}>Not now</button>
          <span className="spacer" />
          <button className="btn primary" onClick={confirm} disabled={busy}>{busy ? <span className="spin" /> : "Start pregnancy mode"}</button>
        </div>
      </div>
    </div>
  );
}
