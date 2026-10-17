import { useEffect, useRef, useState } from "react";
import { gestation } from "../../shared/pregnancy";
import type { DayLog, Nausea, PregBleeding, PregLog, PregPain, Pregnancy } from "../../shared/types";
import { useStore } from "../lib/store";
import { WARNING_SYMPTOMS } from "../lib/symptoms";
import { ChipGroup, MultiChips } from "./Chips";
import { MOODS } from "./DayEditor";
import { SymptomPicker } from "./SymptomPicker";

const NAUSEA: { value: Nausea; label: string }[] = [
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
/**
 * The full pregnancy log for a day: symptoms (with nausea severity), the things doctors ask about
 * (bleeding, pain, warning signs), mood, and vitals. Every tap saves on its own, like the cycle editor.
 */
export function PregnancyEditor({ date, preg }: { date: string; preg: Pregnancy }) {
  const { byDate, saveDay } = useStore();
  const [log, setLog] = useState<DayLog>(() => byDate.get(date) ?? { date });
  // Quick successive taps must build on each other, so changes read the latest log from a ref.
  const latest = useRef(log);
  const [status, setStatus] = useState<"" | "saving" | "saved" | "error">("");
  const timer = useRef<number>(undefined);
  const weeks = gestation(date, preg).weeks;

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
      <SymptomPicker log={log} since={preg.lmp} onChange={(next) => save({ ...next, date }, 0)} />
      {p.nausea && p.nausea !== "none" && (
        <div className="stack sub-field" style={{ gap: 12 }}>
          <ChipGroup label="How bad is the nausea?" kind="sym" options={NAUSEA} value={p.nausea} onChange={(nausea) => setP({ nausea: nausea ?? "mild" })} />
          <Stepper label="Times I threw up" value={p.vomits ?? 0} onChange={(vomits) => setP({ vomits })} />
        </div>
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
      <WarningSigns value={log.symptoms ?? []} onChange={(symptoms) => update({ symptoms })} />
      <MultiChips label="Mood" kind="sym" options={MOODS} value={moods} onChange={(m) => update({ mood: m.join(", ") || null })} />
      <div>
        <div className="field-label">Prenatal vitamin</div>
        <div className="chips">
          <button type="button" className="chip cm" aria-pressed={!!p.prenatal} onClick={() => setP({ prenatal: !p.prenatal })}>
            💊 {p.prenatal ? "Taken today" : "Tap when taken"}
          </button>
        </div>
      </div>

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
      <div className="saved" aria-live="polite">
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : status === "error" ? <span style={{ color: "var(--period)" }}>Couldn't save. Check your connection.</span> : ""}
      </div>
    </div>
  );
}

/** The symptoms that mean "call your doctor", kept apart from everyday ones so they're never a casual tap. */
function WarningSigns({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (s: string) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  return (
    <div role="group" aria-label="Warning signs">
      <div className="field-label">Warning signs <span className="muted" style={{ fontWeight: 400 }}>· call your doctor if you have these</span></div>
      <div className="chips">
        {WARNING_SYMPTOMS.map((s) => (
          <button key={s} type="button" className="chip flow" aria-pressed={value.includes(s)} onClick={() => toggle(s)}>{s}</button>
        ))}
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
