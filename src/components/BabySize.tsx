import { useState } from "react";
import { babySize, formatLength, formatWeight, type Gestation } from "../../shared/pregnancy";
import { weekContent } from "../content/pregnancy";
import { BabyArt, SizeArt } from "./art";

// CSS px per mm on screens is close to 96/25.4 ≈ 3.78; phones vary a little.
const PX_PER_MM = 96 / 25.4;

/**
 * "How big is baby?": the baby next to a fruit or vegetable of the same size, with today's
 * length and weight (interpolated per day). Objects and animals appear as a quiet text line.
 */
export function BabySize({ g }: { g: Gestation }) {
  const [actual, setActual] = useState(false);
  const days = Math.max(28, g.totalDays);
  const size = babySize(days);
  const content = weekContent(Math.floor(days / 7));
  const fruit = content.size.fruit;
  const weight = formatWeight(size.weightG);
  const canActual = size.lengthMm <= 90;
  const showActual = actual && canActual;

  return (
    <section className="card stack size-card" aria-label="Baby's size">
      <div className="section-title"><span className="ico" aria-hidden>📏</span>How big is baby?</div>

      <div className="size-stage">
        {showActual ? (
          <div className="actual-size">
            <svg viewBox="0 0 100 100" width={Math.max(4, size.lengthMm * PX_PER_MM * 1.4)} height={Math.max(4, size.lengthMm * PX_PER_MM * 1.4)} aria-label="Baby at actual size">
              <BabyArt days={days} />
            </svg>
            <div className="tiny muted">Roughly actual size on your screen.</div>
          </div>
        ) : (
          <>
            <figure className="size-fig">
              <div className="size-bubble baby"><svg viewBox="0 0 100 100" role="img" aria-label="Baby illustration"><BabyArt days={days} /></svg></div>
              <figcaption className="tiny muted">Baby</figcaption>
            </figure>
            <span className="size-eq" aria-hidden>≈</span>
            <figure className="size-fig">
              <div className="size-bubble"><SizeArt theme="fruit" art={fruit.art} size={150} title={fruit.name} /></div>
              <figcaption className="tiny muted">{fruit.name.replace(/^an? /, "")}</figcaption>
            </figure>
          </>
        )}
      </div>

      <div className="center stack" style={{ gap: 6 }}>
        <h2 className="size-headline">About the size of <span className="accent">{fruit.name}</span></h2>
        <p className="small muted">Or {content.size.object.name}, or {content.size.animal.name}.</p>
        <div className="size-stats">
          <span><b>{formatLength(size.lengthMm)}</b><span className="tiny muted">{size.measure}</span></span>
          {weight && <span><b>{weight}</b><span className="tiny muted">weight</span></span>}
          {canActual && (
            <button className="chip static-toggle" aria-pressed={showActual} onClick={() => setActual(!actual)}>📐 Actual size</button>
          )}
        </div>
      </div>
    </section>
  );
}
