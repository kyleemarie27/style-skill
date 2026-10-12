import { useEffect, useRef, useState } from "react";
import type { DayLog, Flow, Mucus, PregnancyTest } from "../../shared/types";
import { activePregnancy } from "../../shared/pregnancy";
import { useStore } from "../lib/store";
import { PositiveTestSheet } from "./PositiveTestSheet";
import { ChipGroup, MultiChips } from "./Chips";

export const FLOW_OPTS: { value: Flow; label: string }[] = [
  { value: "none", label: "None" },
  { value: "spotting", label: "Spotting" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
];
export const CM_OPTS: { value: Mucus; label: string }[] = [
  { value: "dry", label: "Dry" },
  { value: "sticky", label: "Sticky" },
  { value: "creamy", label: "Creamy" },
  { value: "watery", label: "Watery" },
  { value: "egg_white", label: "Egg white" },
];
const PREG_OPTS: { value: PregnancyTest; label: string }[] = [
  { value: "negative", label: "Negative" },
  { value: "faint", label: "Faint line" },
  { value: "positive", label: "Positive" },
];
const SYMPTOMS = ["Cramps", "Headache", "Bloating", "Tender breasts", "Acne", "Tired", "Back pain", "Nausea", "Cravings", "Ovulation pain", "High libido"];
export const MOODS = ["Happy", "Calm", "Energetic", "Anxious", "Irritable", "Sad", "Sensitive"];

/**
 * Logs a day. Every tap saves on its own (debounced), so there's no Save button to forget.
 * `compact` shows only the quick check-in fields.
 */
export function DayEditor({ date, compact = false }: { date: string; compact?: boolean }) {
  const { byDate, saveDay, settings } = useStore();
  const [askPositive, setAskPositive] = useState(false);
  const [log, setLog] = useState<DayLog>(() => byDate.get(date) ?? { date });
  const [status, setStatus] = useState<"" | "saving" | "saved" | "error">("");
  const timer = useRef<number>(undefined);

  useEffect(() => {
    setLog(byDate.get(date) ?? { date });
    setStatus("");
    // Only reset when the date changes, not on every save round-trip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const update = (patch: Partial<DayLog>, delay = 0) => {
    const next = { ...log, ...patch, date };
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

  const moods = log.mood ? log.mood.split(/,\s*/) : [];

  return (
    <div className="stack">
      <ChipGroup label="Flow" kind="flow" options={FLOW_OPTS} value={log.flow} onChange={(flow) => update({ flow })} />
      <div>
        <div className="field-label">Intercourse</div>
        <div className="chips">
          <button
            type="button"
            className="chip love"
            aria-pressed={!!log.intercourse}
            onClick={() => update({ intercourse: !log.intercourse })}
          >
            ♥ {log.intercourse ? "Yes, we did" : "Tap if you did"}
          </button>
        </div>
      </div>
      <ChipGroup label="Cervical mucus" kind="cm" options={CM_OPTS} value={log.cervical_mucus} onChange={(cervical_mucus) => update({ cervical_mucus })} />
      <MultiChips label="Symptoms" kind="sym" options={SYMPTOMS} value={log.symptoms ?? []} onChange={(symptoms) => update({ symptoms })} />
      <MultiChips label="Mood" kind="sym" options={MOODS} value={moods} onChange={(m) => update({ mood: m.join(", ") || null })} />
      {!compact && (
        <>
          <ChipGroup label="Pregnancy test" kind="love" options={PREG_OPTS} value={log.pregnancy_test} onChange={(pregnancy_test) => {
            update({ pregnancy_test });
            if (pregnancy_test === "positive" && !activePregnancy(settings)) setAskPositive(true);
          }} />
          {askPositive && <PositiveTestSheet date={date} onClose={() => setAskPositive(false)} />}
          <div>
            <div className="field-label">Basal body temperature</div>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="e.g. 97.6"
              value={log.bbt ?? ""}
              onChange={(e) => update({ bbt: e.target.value ? Number(e.target.value) : null }, 700)}
            />
          </div>
          <div>
            <div className="field-label">Notes</div>
            <textarea value={log.notes ?? ""} placeholder="Anything else about today…" onChange={(e) => update({ notes: e.target.value || null }, 700)} />
          </div>
        </>
      )}
      <div className="saved" aria-live="polite">
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : status === "error" ? <span style={{ color: "var(--period)" }}>Couldn't save. Check your connection.</span> : ""}
      </div>
    </div>
  );
}
