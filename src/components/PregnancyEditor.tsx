import { useEffect, useRef, useState } from "react";
import { gestation } from "../../shared/pregnancy";
import type { DayLog, Nausea, PregBleeding, PregLog, PregPain, Pregnancy } from "../../shared/types";
import { useStore } from "../lib/store";
import { ChipGroup, MultiChips } from "./Chips";
import { MOODS } from "./DayEditor";

const NAUSEA: { value: Nausea; label: string }[] = [
  { value: "none", label: "None" },
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];
const BLEEDING: { value: PregBleeding; label: string }[] = [
  { value: "none", label: "None" },
  { value: "spotting", label: "Spotting" },
  { value: "light", label: "Light" },
  { value: "heavy", label: "Heavy" },
];
const PAIN: { value: PregPain; label: string }[] = [
  { value: "none", label: "None" },
  { value: "mild", label: "Mild" },
  { value: "strong", label: "Strong" },
];
export const PREG_SYMPTOMS = [
  "Fatigue", "Tender breasts", "Frequent peeing", "Food aversions", "Cravings", "Bloating", "Constipation",
  "Heartburn", "Headache", "Dizziness", "Discharge change", "Insomnia", "Back pain", "Leg cramps",
  "Round ligament pain", "Braxton Hicks", "Swollen feet", "Itching", "Severe headache", "Vision changes", "Sudden swelling",
];

/**
 * Pregnancy check-in: the things doctors ask about (nausea, bleeding, pain, symptoms) plus
 * vitals on the full Day page. Every tap saves on its own, like the cycle editor.
 */
export function PregnancyEditor({ date, preg, compact = false }: { date: string; preg: Pregnancy; compact?: boolean }) {
  const { byDate, saveDay } = useStore();
  const [log, setLog] = useState<DayLog>(() => byDate.get(date) ?? { date });
  // Quick successive taps must build on each other, so changes read the latest log from a ref.
  const latest = useRef(log);
  const [status, setStatus] = useState<"" | "saving" | "saved" | "error">("");
  const timer = useRef<number>(undefined);
  const weeks = gestation(date, preg).weeks;
  const [allSymptoms, setAllSymptoms] = useState(!compact);

  useEffect(() => {
    latest.current = byDate.get(date) ?? { date };
    setLog(latest.current);
    setStatus("");
    // Only reset when the date changes, not on every save round-trip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const save = (next: DayLog, delay: number) => {
    latest.current = next;
    setLog(next);
    window.clearTimeout(timer.current);
    setStatus("saving");
    timer.current = window.setTimeout(async () => {
      try {
        await saveDay(next);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, delay);
  };
  const update = (patch: Partial<DayLog>, delay = 0) => save({ ...latest.current, ...patch, date }, delay);
  const p: PregLog = log.preg ?? {};
  const setP = (patch: Partial<PregLog>, delay = 0) =>
    save({ ...latest.current, date, preg: { ...latest.current.preg, ...patch } }, delay);
  const moods = log.mood ? log.mood.split(/,\s*/) : [];
  const num = (v: string) => (v === "" ? null : Number(v));

  return (
    <div className="stack">
      <ChipGroup label="Nausea" kind="sym" options={NAUSEA} value={p.nausea} onChange={(nausea) => setP({ nausea })} />
      {p.nausea && p.nausea !== "none" && (
        <Stepper label="Times I threw up" value={p.vomits ?? 0} onChange={(vomits) => setP({ vomits })} />
      )}
      <ChipGroup label="Bleeding or spotting" kind="flow" options={BLEEDING} value={p.bleeding} onChange={(bleeding) => setP({ bleeding })} />
      <div>
        <ChipGroup label="Cramping or belly pain" kind="flow" options={PAIN} value={p.pain} onChange={(pain) => setP({ pain, painOneSided: pain && pain !== "none" ? p.painOneSided : null })} />
        {p.pain && p.pain !== "none" && (
          <div className="chips" style={{ marginTop: 8 }}>
            <button type="button" className="chip flow" aria-pressed={!!p.painOneSided} onClick={() => setP({ painOneSided: !p.painOneSided })}>
              Mostly on one side
            </button>
          </div>
        )}
      </div>
      <div>
        <MultiChips label="Symptoms" kind="sym" options={allSymptoms ? PREG_SYMPTOMS : PREG_SYMPTOMS.slice(0, 10)} value={log.symptoms ?? []} onChange={(symptoms) => update({ symptoms })} />
        {!allSymptoms && <button type="button" className="btn ghost small more" onClick={() => setAllSymptoms(true)}>More symptoms…</button>}
      </div>
      <MultiChips label="Mood" kind="sym" options={MOODS} value={moods} onChange={(m) => update({ mood: m.join(", ") || null })} />
      <div>
        <div className="field-label">Prenatal vitamin</div>
        <div className="chips">
          <button type="button" className="chip cm" aria-pressed={!!p.prenatal} onClick={() => setP({ prenatal: !p.prenatal })}>
            💊 {p.prenatal ? "Taken today" : "Tap when taken"}
          </button>
        </div>
      </div>

      {!compact && (
        <>
          <div className="grid2">
            <label>
              <div className="field-label">Weight (lb)</div>
              <input type="number" inputMode="decimal" step="0.1" placeholder="e.g. 142.5" value={p.weight ?? ""} onChange={(e) => setP({ weight: num(e.target.value) }, 700)} />
            </label>
            <label>
              <div className="field-label">Temperature (°F)</div>
              <input type="number" inputMode="decimal" step="0.1" placeholder="e.g. 98.4" value={p.temp ?? ""} onChange={(e) => setP({ temp: num(e.target.value) }, 700)} />
            </label>
          </div>
          <div>
            <div className="field-label">Blood pressure</div>
            <div className="row">
              <input type="number" inputMode="numeric" placeholder="120" aria-label="Systolic" value={p.bpSys ?? ""} onChange={(e) => setP({ bpSys: num(e.target.value) }, 700)} />
              <span className="muted">/</span>
              <input type="number" inputMode="numeric" placeholder="80" aria-label="Diastolic" value={p.bpDia ?? ""} onChange={(e) => setP({ bpDia: num(e.target.value) }, 700)} />
            </div>
          </div>
          <Stepper label="Glasses of water" value={p.water ?? 0} onChange={(water) => setP({ water })} />
          {weeks >= 24 && (
            <>
              <label>
                <div className="field-label">Kick count: minutes to feel 10 movements</div>
                <input type="number" inputMode="numeric" placeholder="e.g. 25" value={p.kicks ?? ""} onChange={(e) => setP({ kicks: num(e.target.value) }, 700)} />
              </label>
              <Stepper label="Contractions in the last hour" value={p.contractions ?? 0} onChange={(contractions) => setP({ contractions })} />
            </>
          )}
          {weeks >= 16 && (
            <div className="chips">
              <button type="button" className="chip flow" aria-pressed={!!p.leaking} onClick={() => setP({ leaking: !p.leaking })}>Leaking fluid</button>
            </div>
          )}
          <label>
            <div className="field-label">Medications taken</div>
            <input type="text" placeholder="e.g. Tylenol 500 mg, Unisom + B6" value={p.meds ?? ""} onChange={(e) => setP({ meds: e.target.value || null }, 700)} />
          </label>
          <label>
            <div className="field-label">Notes</div>
            <textarea value={log.notes ?? ""} placeholder="Anything else you'd want your doctor to know…" onChange={(e) => update({ notes: e.target.value || null }, 700)} />
          </label>
        </>
      )}
      <div className="saved" aria-live="polite">
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : status === "error" ? <span style={{ color: "var(--period)" }}>Couldn't save. Check your connection.</span> : ""}
      </div>
    </div>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number | null) => void }) {
  return (
    <div>
      <div className="field-label">{label}</div>
      <div className="stepper">
        <button type="button" className="btn" onClick={() => onChange(value > 1 ? value - 1 : null)} aria-label={`Fewer: ${label}`}>−</button>
        <b>{value}</b>
        <button type="button" className="btn" onClick={() => onChange(value + 1)} aria-label={`More: ${label}`}>+</button>
      </div>
    </div>
  );
}
