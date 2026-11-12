import type { Today } from "../../shared/cycle";
import { addDays, prettyDate } from "../../shared/dates";
import { DEFAULT_WAIT_LIST } from "../../shared/types";
import { invitationFor } from "../content/invitations";
import { lhStartDate, signalsFor, waitListActive, windowDays } from "../lib/cycleToday";
import { useStore } from "../lib/store";
import { TempSpark } from "./TempChart";

/** Today's invitation: the part of yourself today is good for, and one small ritual. */
export function InvitationCard({ info }: { info: Today }) {
  const { model } = useStore();
  const inv = invitationFor(info, model.afterLoss && info.cycle?.start === model.afterLoss.start ? model.afterLoss.start : null);
  if (!inv) return null;
  return (
    <div className={`card invite ph-${info.phase}`}>
      <div className="section-title"><span className="ico" aria-hidden>🎁</span>Today's invitation</div>
      <h2 className="invite-name">{inv.name}</h2>
      <p className="invite-line">{inv.line}</p>
      <p className="small muted">{inv.why}</p>
      <div className="invite-ritual">
        <span className="tip-label">Your ritual</span>
        <p>{inv.ritual}</p>
      </div>
    </div>
  );
}

/** "Protect the wait": your own list of things to skip from ovulation until your period. */
export function WaitListCard({ info }: { info: Today }) {
  const { settings } = useStore();
  const list = settings.waitList ?? DEFAULT_WAIT_LIST;
  if (!list.length || !info.ovulation) return null;
  const active = waitListActive(info);
  const soon = !active && (info.phase === "fertile" || info.phase === "ovulation") && info.date >= addDays(info.ovulation, -3);
  if (!active && !soon) return null;
  if (soon) {
    return (
      <div className="card flat wait-soon small">
        <b>Your wait list starts {info.date === addDays(info.ovulation, -1) ? "tomorrow" : prettyDate(info.ovulation)}</b>
        <span className="muted">: {list.join(" · ")}</span>
      </div>
    );
  }
  return (
    <div className="card stack wait-card">
      <div className="section-title"><span className="ico" aria-hidden>🛡️</span>Protect the wait</div>
      <ul className="wait-list">
        {list.map((x) => <li key={x}>{x}</li>)}
      </ul>
      <p className="tiny muted">From ovulation until your period starts. Edit the list in Settings.</p>
    </div>
  );
}

/** The first cycle after a loss: where day 1 is, and why LH strips wait for a negative test. */
export function AfterLossCard({ info }: { info: Today }) {
  const { model, oura } = useStore();
  const a = model.afterLoss;
  if (!a || info.cycle?.start !== a.start) return null;
  return (
    <details className="card after-loss">
      <summary>
        <span className="section-title"><span className="ico" aria-hidden>🤍</span>Your first cycle back</span>
        <span className="small muted">Day 1 was {prettyDate(a.start)}. Tap for how Bloom handles this cycle.</span>
      </summary>
      <ul className="tips" style={{ marginTop: 10 }}>
        <li>
          {a.negativeTest
            ? `You logged a negative pregnancy test on ${prettyDate(a.negativeTest)}, so LH strips count from then on.`
            : "Pregnancy hormone (hCG) can take a few weeks to clear, and it can turn LH strips positive. Take a pregnancy test first and log it as Negative; then Bloom trusts your LH strips."}
          {a.ignoredPeaks.length > 0 && ` Bloom set aside ${a.ignoredPeaks.length === 1 ? "an LH peak" : `${a.ignoredPeaks.length} LH peaks`} from before that.`}
        </li>
        <li>Ovulation can come back as soon as 2–4 weeks after a loss. Fertile mucus is usually the first sign.</li>
        <li>
          {oura?.connected
            ? "Your Oura temperature is the best proof this cycle: a rise that holds for 3 nights confirms you ovulated."
            : "Connecting Oura helps most this cycle: a temperature rise that holds for 3 nights confirms ovulation."}
        </li>
        <li>This first cycle is often longer or shorter than usual. Bloom leaves it out of your averages.</li>
        <li className="muted">If day 1 is off, change the date in Settings → Pregnancy.</li>
      </ul>
    </details>
  );
}

/** Mucus, LH, temperature and timing at a glance, plus the fertile window as seven cells. */
export function SignalsCard({ info }: { info: Today }) {
  const { model, lhTests, dayLogs, byDate, oura } = useStore();
  const signals = signalsFor(info, model, lhTests, dayLogs, byDate, !!oura?.connected);
  const days = windowDays(info, model, lhTests, byDate);
  return (
    <div className={`card stack ph-${info.phase}`}>
      <div className="section-title"><span className="ico" aria-hidden>📍</span>Your signals</div>
      <div className="signals">
        {signals.map((s) => (
          <div key={s.key} className={`signal${s.on ? " on" : ""}`}>
            <div className="tiny muted">{s.label}</div>
            <b>{s.value}</b>
            {s.spark && <TempSpark values={s.spark.values} highFrom={s.spark.highFrom} />}
            <div className="tiny muted">{s.note}</div>
          </div>
        ))}
      </div>
      {days.length > 0 && (
        <div>
          <div className="tiny muted" style={{ marginBottom: 6 }}>
            Fertile window{info.ovulationConfirmed ? "" : " (estimated)"} · ★ best days
          </div>
          <div className="window-strip" role="list">
            {days.map((d) => (
              <div
                key={d.date}
                role="listitem"
                className={`wday${d.best ? " best" : ""}${d.today ? " today" : ""}${d.future ? " future" : ""}`}
                aria-label={`${prettyDate(d.date, true)}${d.love ? ", sex logged" : ""}${d.lh ? `, LH ${d.lh}` : ""}${d.best ? ", best day" : ""}`}
              >
                <span className="tiny">{prettyDate(d.date, true).split(",")[0].slice(0, 2)}</span>
                <span className="wnum">{Number(d.date.slice(8))}</span>
                <span className="wmarks">
                  {d.love ? "♥" : d.best ? "★" : "·"}
                  {d.lh && <i className={`wlh lh-${d.lh}`} />}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** The whole plan for the cycle, in one place. Open early in the cycle, folded later. */
export function PlanCard({ info }: { info: Today }) {
  const { model } = useStore();
  const lhDay = lhStartDate(info);
  const early = info.phase === "menstrual" || info.phase === "follicular";
  const unsureLh = !!model.afterLoss && info.cycle?.start === model.afterLoss.start && !model.afterLoss.negativeTest;
  return (
    <details className="card plan" open={early}>
      <summary>
        <span className="section-title"><span className="ico" aria-hidden>🧭</span>Your plan this cycle</span>
        <span className="small muted">Everything you need to know to time it, in one place.</span>
      </summary>
      <div className="stack" style={{ marginTop: 12, gap: 12 }}>
        <div>
          <b>Three signs, in the order they show up</b>
          <ol className="tips plan-list">
            <li>
              <b>Mucus gets wetter.</b> Sticky, then creamy, then watery, then clear and stretchy like egg white.
              <span className="why"> Egg white means your best days are here, often before LH peaks.</span>
            </li>
            <li>
              <b>LH goes Low → High → Peak.</b>{" "}
              {unsureLh ? "This cycle, take a pregnancy test first, then start strips." : lhDay ? `Start strips on ${prettyDate(lhDay)}, once a day.` : "Start strips around day 10, once a day."}{" "}
              Once you see High, test twice a day (around 10am and 8pm).
              <span className="why"> Ovulation follows a Peak by about 12–36 hours.</span>
            </li>
            <li>
              <b>Temperature rises and stays up.</b> Three nights in a row on your Oura.
              <span className="why"> That's the proof you ovulated. It shows up after the fact, so it confirms; it doesn't time.</span>
            </li>
          </ol>
        </div>
        <div>
          <b>The timing rule</b>
          <p className="small" style={{ marginTop: 4 }}>
            Have sex every 1–2 days from the first fertile mucus or the day your window opens
            {info.fertileStart ? ` (around ${prettyDate(info.fertileStart)})` : ""}, until the day after your LH peak.
            <span className="why"> Sperm live up to 5 days, so the days before ovulation matter most. Every other day works about as well as every day.</span>
          </p>
        </div>
        <div>
          <b>Then your part is done</b>
          <p className="small" style={{ marginTop: 4 }}>
            Your wait list starts on ovulation day.
            {info.testDate ? ` Test on ${prettyDate(info.testDate)} (12 days after ovulation) with first-morning urine.` : ""}
            {info.ovulationConfirmed ? "" : " Dates move once your LH peak or temperature confirms ovulation."}
          </p>
        </div>
      </div>
    </details>
  );
}
