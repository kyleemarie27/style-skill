import { useEffect, useRef, useState } from "react";
import { localToday } from "../../shared/dates";
import { LH_BANDS, LH_LABEL, levelForRatio } from "../../shared/lh";
import type { LhLevel } from "../../shared/types";
import { api, resizeImage, type LhReading } from "../lib/api";
import { useStore } from "../lib/store";
import { CameraIcon } from "./Icons";

/**
 * "Add LH strip": take or choose a photo → Claude suggests a Premom-scale reading →
 * confirm or adjust → saved with the photo.
 */
export function LhUploadButton({ date, label = "Add LH strip", className = "btn" }: { date?: string; label?: string; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => input.current?.click()}>
        <CameraIcon /> {label}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) setPhoto(await resizeImage(f));
        }}
      />
      <button type="button" className="btn ghost small" onClick={() => setManual(true)}>
        Enter a reading without a photo
      </button>
      {(photo || manual) && (
        <LhSheet
          photo={photo}
          defaultDate={date ?? localToday()}
          onClose={() => {
            setPhoto(null);
            setManual(false);
          }}
        />
      )}
    </>
  );
}

function LhSheet({ photo, defaultDate, onClose }: { photo: string | null; defaultDate: string; onClose: () => void }) {
  const { aiEnabled, reload } = useStore();
  const [date, setDate] = useState(defaultDate);
  const [reading, setReading] = useState<LhReading | null>(null);
  const [ratio, setRatio] = useState(0.3);
  const [level, setLevel] = useState<LhLevel>("low");
  const [busy, setBusy] = useState<"" | "reading" | "saving">(photo && aiEnabled ? "reading" : "");
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!photo || !aiEnabled || started.current) return;
    started.current = true;
    api
      .analyzeStrip(photo)
      .then((r) => {
        setReading(r);
        setRatio(r.ratio);
        setLevel(r.level);
      })
      .catch((e) => setError(`${e.message} You can set the level yourself below.`))
      .finally(() => setBusy(""));
  }, [photo, aiEnabled]);

  const save = async () => {
    setBusy("saving");
    setError("");
    try {
      await api.saveLh(
        { date, ratio, level, ai_ratio: reading?.ratio ?? null, ai_level: reading?.level ?? null },
        photo ?? undefined,
      );
      await reload();
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setBusy("");
    }
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet stack fade-in" role="dialog" aria-label="LH strip reading" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2>LH strip</h2>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
        </div>
        {photo && <img className="strip-photo" src={photo} alt="Your LH strip" />}

        {busy === "reading" ? (
          <div className="notice row"><span className="spin" /> Reading your strip…</div>
        ) : (
          <>
            {reading && (
              <div className="notice">
                {reading.readable ? reading.note : `Couldn't read this one: ${reading.note}`}
                {reading.readable && reading.confidence === "low" && " (Low confidence, so double-check against the strip.)"}
              </div>
            )}
            {!photo || !aiEnabled ? (
              <div className="notice small">
                {aiEnabled ? "Set the reading to match your strip." : "AI reading is off (no API key), so set the reading to match your strip."}
              </div>
            ) : null}
            <div className="row between">
              <div>
                <div className="big-ratio">{ratio.toFixed(2)}</div>
                <div className="tiny muted">T/C ratio (Premom scale)</div>
              </div>
              <span className={`lh-badge lh-${level}`}>{LH_LABEL[level]}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1.6}
              step={0.01}
              value={ratio}
              aria-label="LH ratio"
              onChange={(e) => {
                const r = Number(e.target.value);
                setRatio(r);
                setLevel(levelForRatio(r));
              }}
            />
            <div className="row between tiny muted">
              <span>No line</span>
              <span>{LH_BANDS.high} High</span>
              <span>{LH_BANDS.peak.toFixed(1)} Peak</span>
              <span>Darker</span>
            </div>
            <div className="chips">
              {(["low", "high", "peak"] as LhLevel[]).map((l) => (
                <button key={l} className="chip" aria-pressed={level === l} onClick={() => setLevel(l)}>
                  {LH_LABEL[l]}
                </button>
              ))}
            </div>
            <div>
              <div className="field-label">Date</div>
              <input type="date" value={date} max={localToday()} onChange={(e) => setDate(e.target.value)} />
            </div>
            {error && <div className="notice err">{error}</div>}
            <button className="btn primary block" disabled={busy === "saving"} onClick={save}>
              {busy === "saving" ? <span className="spin" /> : "Save reading"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
