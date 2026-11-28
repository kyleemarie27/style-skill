import { useEffect, useMemo, useRef, useState } from "react";
import { localToday, prettyDate } from "../../shared/dates";
import { LH_BANDS, LH_LABEL, levelForRatio } from "../../shared/lh";
import { measureStrip, photoHash, type Point, type StripMeasurement } from "../../shared/stripMeasure";
import type { LhLevel } from "../../shared/types";
import { api, resizeImage, type StripTaps } from "../lib/api";
import { useStore } from "../lib/store";
import { CameraIcon } from "./Icons";

/**
 * "Add LH strip": take or choose a photo → tap the control line, then the test line → Bloom
 * measures T/C from the pixels (Premom's scale) → confirm and save. Same photo, same answer.
 */
export function LhUploadButton({ date, label = "Add LH strip", className = "btn", onSaved }: { date?: string; label?: string; className?: string; onSaved?: () => void }) {
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
          onSaved={onSaved}
        />
      )}
    </>
  );
}

/** The photo's pixels, read once. */
function usePixels(photo: string | null) {
  const [img, setImg] = useState<{ el: HTMLImageElement; data: ImageData } | null>(null);
  useEffect(() => {
    if (!photo) return;
    const el = new Image();
    el.onload = () => {
      const c = document.createElement("canvas");
      c.width = el.naturalWidth;
      c.height = el.naturalHeight;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(el, 0, 0);
      setImg({ el, data: ctx.getImageData(0, 0, c.width, c.height) });
    };
    el.src = photo;
  }, [photo]);
  return img;
}

const QUALITY: Record<Exclude<StripMeasurement["quality"], "good">, string> = {
  "faint-control": "The control line is too faint to measure against here. Tap right on the control line, or retake the photo in brighter, even light.",
  "too-close": "Those taps are on top of each other. Tap the control line, then the test line.",
  "off-strip": "That's off the strip. Tap the control line, then the test line.",
};

function LhSheet({ photo, defaultDate, onClose, onSaved }: { photo: string | null; defaultDate: string; onClose: () => void; onSaved?: () => void }) {
  const { reload, refreshPrediction } = useStore();
  const [date, setDate] = useState(defaultDate);
  const [taps, setTaps] = useState<{ c?: Point; t?: Point }>({});
  /** Zoomed in on the result window (first tap), so the two lines are far apart on screen. */
  const [zoom, setZoom] = useState<Point | null>(null);
  const [ratio, setRatio] = useState(0.3);
  const [level, setLevel] = useState<LhLevel>("low");
  const [adjusted, setAdjusted] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [seenBefore, setSeenBefore] = useState<{ date: string; ratio: number | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pixels = usePixels(photo);

  // Same photo as before? Use its saved taps, so the answer is identical.
  useEffect(() => {
    if (!photo) return;
    photoHash(photo).then(async (h) => {
      setHash(h);
      try {
        const { match } = await api.lhByHash(h);
        if (match?.taps) {
          setTaps({ c: match.taps.c, t: match.taps.t });
          setZoom({ x: (match.taps.c.x + match.taps.t.x) / 2, y: (match.taps.c.y + match.taps.t.y) / 2 });
          setSeenBefore({ date: match.date, ratio: match.ratio });
        }
      } catch {
        // Offline or older server: measure fresh.
      }
    });
  }, [photo]);

  const m = useMemo(() => {
    if (!pixels || !taps.c || !taps.t) return null;
    return measureStrip({ width: pixels.data.width, height: pixels.data.height, data: pixels.data.data }, taps.c, taps.t);
  }, [pixels, taps.c, taps.t]);

  useEffect(() => {
    if (m && m.quality === "good" && !adjusted) {
      setRatio(m.ratio);
      setLevel(levelForRatio(m.ratio));
    }
  }, [m, adjusted]);

  const tap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pixels) return;
    // Measure against the photo itself (not the frame around it), so a tap lands where you touched.
    const img = e.currentTarget.querySelector("img");
    if (!img) return;
    const r = img.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
    const p = { x: Math.round(((e.clientX - r.left) / r.width) * pixels.data.width), y: Math.round(((e.clientY - r.top) / r.height) * pixels.data.height) };
    if (!zoom) {
      setZoom(p);
      return;
    }
    setAdjusted(false);
    setSeenBefore(null);
    setTaps((cur) => (!cur.c || cur.t ? { c: p } : { ...cur, t: p }));
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const measured = m && m.quality === "good" ? m.ratio : null;
      const savedTaps: StripTaps | undefined = m && taps.c && taps.t ? { c: taps.c, t: taps.t } : undefined;
      await api.saveLh({ date, ratio, level, ai_ratio: measured, ai_level: measured !== null ? levelForRatio(measured) : null }, photo ?? undefined, { hash: hash ?? undefined, taps: savedTaps });
      await reload();
      onClose();
      onSaved?.();
      refreshPrediction();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const step = !zoom ? "Tap the result window to zoom in" : !taps.c ? "Tap the control line (C)" : !taps.t ? "Now tap the test line (T)" : null;
  const Z = 4;
  const zoomStyle = zoom && pixels
    ? { transform: `scale(${Z})`, transformOrigin: `${(zoom.x / pixels.data.width) * 100}% ${(zoom.y / pixels.data.height) * 100}%` }
    : undefined;
  // A pin: a small dot right on the point, a thin stem, and the label above. Same size when zoomed.
  const mark = (p: Point, kind: "c" | "t") => (
    <span className={`strip-pin ${kind}`} style={{ ...pct(p), transform: `scale(${zoom ? 1 / Z : 1})` }}>
      <b>{kind.toUpperCase()}</b>
    </span>
  );
  const pct = (p: Point) => pixels ? { left: `${(p.x / pixels.data.width) * 100}%`, top: `${(p.y / pixels.data.height) * 100}%` } : {};

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet stack fade-in" role="dialog" aria-label="LH strip reading" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2>LH strip</h2>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
        </div>

        {photo && (
          <>
            <div className="strip-stage" onClick={tap} role="button" aria-label="Tap the result window, then the control line, then the test line">
              <div className="strip-photo-box" style={zoomStyle}>
                <img src={photo} alt="Your LH strip" draggable={false} />
                {m ? <>{mark(m.controlAt, "c")}{mark(m.testAt, "t")}</> : taps.c && mark(taps.c, "c")}
              </div>
            </div>
            {step && <div className="strip-step">{step}</div>}
            {(zoom || taps.c) && (
              <div className="row" style={{ gap: 4 }}>
                {taps.c && <button className="btn ghost small" onClick={() => { setTaps({}); setSeenBefore(null); }}>Redo taps</button>}
                {zoom && <button className="btn ghost small" onClick={() => { setZoom(null); setTaps({}); setSeenBefore(null); }}>Zoom out</button>}
              </div>
            )}
          </>
        )}

        {m && m.quality !== "good" && <div className="notice warn small">{QUALITY[m.quality]}</div>}
        {seenBefore && <div className="notice small">Same photo as your {prettyDate(seenBefore.date)} reading, so the same measurement.</div>}

        {(!photo || (m && m.quality === "good")) && (
          <>
            <div className="row between">
              <div>
                <div className="big-ratio">{ratio.toFixed(2)}</div>
                <div className="tiny muted">{photo ? (adjusted ? `T/C, adjusted from a measured ${m!.ratio.toFixed(2)}` : "T/C, measured (Premom scale)") : "T/C ratio (Premom scale)"}</div>
              </div>
              <span className={`lh-badge lh-${level}`}>{LH_LABEL[level]}</span>
            </div>

            {photo && m && pixels && <Benchmark m={m} el={pixels.el} />}

            <details open={!photo}>
              <summary className="small muted">{photo ? "Adjust by eye" : "Set the reading"}</summary>
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
                  setAdjusted(true);
                }}
              />
              <div className="row between tiny muted">
                <span>No line</span>
                <span>{LH_BANDS.high} High</span>
                <span>{LH_BANDS.peak.toFixed(1)} Peak</span>
                <span>Darker</span>
              </div>
            </details>
            <div>
              <div className="field-label">Date</div>
              <input type="date" value={date} max={localToday()} onChange={(e) => setDate(e.target.value)} />
            </div>
            {error && <div className="notice err">{error}</div>}
            <button className="btn primary block" disabled={busy} onClick={save}>
              {busy ? <span className="spin" /> : "Save reading"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Your test line next to Premom's Low / High / Peak, drawn in your own control line's color,
 * so you can check the number by eye. Your lines are cut straight from the photo.
 */
function Benchmark({ m, el }: { m: StripMeasurement; el: HTMLImageElement }) {
  const crop = (p: Point) => {
    const size = Math.max(24, Math.round(Math.hypot(m.testAt.x - m.controlAt.x, m.testAt.y - m.controlAt.y) * 0.35));
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    c.getContext("2d")!.drawImage(el, p.x - size / 2, p.y - size / 2, size, size, 0, 0, 64, 64);
    return c.toDataURL("image/png");
  };
  const [cImg, tImg] = useMemo(() => [crop(m.controlAt), crop(m.testAt)], [m, el]); // eslint-disable-line react-hooks/exhaustive-deps
  // Lines run across the strip: if C → T goes sideways, the lines stand upright.
  const vertical = Math.abs(m.testAt.x - m.controlAt.x) > Math.abs(m.testAt.y - m.controlAt.y);
  // A reference line at k × the control's darkness, on clean paper.
  const ref = (k: number) => {
    const paper = [248, 246, 242];
    const [r, g, b] = paper.map((p, i) => Math.round(p - Math.min(1, k) * (p - m.controlColor[i])));
    return `rgb(${r} ${g} ${b})`;
  };
  return (
    <div className="bench">
      <div className="bench-item"><img src={cImg} alt="Your control line" /><span className="tiny muted">Your C</span></div>
      <div className="bench-item you"><img src={tImg} alt="Your test line" /><span className="tiny"><b>Your T</b></span></div>
      {([["Low", 0.2], ["High", 0.5], ["Peak", 1.0]] as const).map(([name, k]) => (
        <div key={name} className={`bench-item${levelForRatio(m.ratio) === name.toLowerCase() ? " match" : ""}`}>
          <span className={`bench-ref${vertical ? " vert" : ""}`}><i style={{ background: ref(k) }} /></span>
          <span className="tiny muted">{name} {k.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}
