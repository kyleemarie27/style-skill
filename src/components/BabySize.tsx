import { useState } from "react";
import { babySize, formatLength, formatWeight, gaLabel, type Gestation } from "../../shared/pregnancy";
import { LAST_WEEK, weekContent, type SizeTheme } from "../content/pregnancy";
import { readLocal, writeLocal } from "../lib/pregnancy";
import { BabyArt, SizeArt } from "./art";

const THEMES: { id: SizeTheme; label: string }[] = [
  { id: "fruit", label: "Fruit & veg" },
  { id: "object", label: "Objects" },
  { id: "animal", label: "Animals" },
];
const THEME_KEY = "bloom-size-theme";
// CSS px per mm on screens is close to 96/25.4 ≈ 3.78; phones vary a little.
const PX_PER_MM = 96 / 25.4;

/**
 * The daily "how big is baby" card: the baby next to a comparison item, today's length and
 * weight (interpolated per day), and arrows to look ahead or back a day or a week.
 */
export function BabySize({ g }: { g: Gestation }) {
  const [offset, setOffset] = useState(0);
  const [theme, setThemeState] = useState<SizeTheme>(() => readLocal(THEME_KEY, "fruit"));
  const [actual, setActual] = useState(false);
  const setTheme = (t: SizeTheme) => {
    setThemeState(t);
    writeLocal(THEME_KEY, t);
  };

  const days = Math.max(28, Math.min(LAST_WEEK * 7 + 6, g.totalDays + offset));
  const wk = Math.floor(days / 7);
  const d = days - wk * 7;
  const size = babySize(days);
  const content = weekContent(wk);
  const ref = content.size[theme];
  const weight = formatWeight(size.weightG);
  const canActual = size.lengthMm <= 90;
  const showActual = actual && canActual;
  const step = (n: number) => setOffset(Math.max(28 - g.totalDays, Math.min(LAST_WEEK * 7 + 6 - g.totalDays, offset + n)));
  const label = offset === 0 ? "Today" : offset > 0 ? `In ${offset} day${offset === 1 ? "" : "s"}` : `${-offset} day${offset === -1 ? "" : "s"} ago`;

  return (
    <section className="card stack size-card" aria-label="Baby's size">
      <div className="row between wrap">
        <div className="section-title"><span className="ico" aria-hidden>📏</span>How big is baby?</div>
        <div className="seg small-seg" role="tablist" aria-label="Comparison theme">
          {THEMES.map((t) => (
            <button key={t.id} role="tab" aria-selected={theme === t.id} onClick={() => setTheme(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="size-stage">
        {showActual ? (
          <div className="actual-size">
            <svg viewBox="0 0 100 100" width={Math.max(4, size.lengthMm * PX_PER_MM * 1.4)} height={Math.max(4, size.lengthMm * PX_PER_MM * 1.4)} aria-label="Baby at actual size">
              <BabyArt days={days} />
            </svg>
            <div className="tiny muted">Actual size, roughly. Hold your phone flat and look.</div>
          </div>
        ) : (
          <>
            <figure className="size-fig">
              <div className="size-bubble baby"><svg viewBox="0 0 100 100" role="img" aria-label="Baby illustration"><BabyArt days={days} /></svg></div>
              <figcaption className="tiny muted">Baby</figcaption>
            </figure>
            <span className="size-eq" aria-hidden>≈</span>
            <figure className="size-fig">
              <div className="size-bubble"><SizeArt theme={theme} art={ref.art} size={150} title={ref.name} /></div>
              <figcaption className="tiny muted">{ref.name.replace(/^an? /, "")}</figcaption>
            </figure>
          </>
        )}
      </div>

      <div className="center stack" style={{ gap: 4 }}>
        <div className="small muted">{label} · {gaLabel({ weeks: wk, days: d })}</div>
        <h2 className="size-headline">About the size of <span className="accent">{ref.name}</span></h2>
        <div className="size-stats">
          <span><b>{formatLength(size.lengthMm)}</b><span className="tiny muted">{size.measure}</span></span>
          {weight && <span><b>{weight}</b><span className="tiny muted">weight</span></span>}
        </div>
      </div>

      <div className="row between size-nav">
        <div className="row" style={{ gap: 2 }}>
          <button className="btn ghost" onClick={() => step(-7)} aria-label="Back a week">«</button>
          <button className="btn ghost" onClick={() => step(-1)} aria-label="Back a day">‹</button>
        </div>
        <span className="tiny muted">day · week</span>
        <div className="row" style={{ gap: 2 }}>
          <button className="btn ghost" onClick={() => step(1)} aria-label="Forward a day">›</button>
          <button className="btn ghost" onClick={() => step(7)} aria-label="Forward a week">»</button>
        </div>
      </div>
      {(offset !== 0 || canActual) && (
        <div className="chips" style={{ justifyContent: "center" }}>
          {offset !== 0 && <button className="chip" onClick={() => setOffset(0)}>Back to today</button>}
          {canActual && <button className="chip static-toggle" aria-pressed={showActual} onClick={() => setActual(!actual)}>📐 Actual size</button>}
        </div>
      )}
      <p className="tiny muted center">Averages from growth charts. Every baby grows at their own pace.</p>
    </section>
  );
}
