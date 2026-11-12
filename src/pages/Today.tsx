import { useEffect, useMemo, useState } from "react";
import { PHASE_NAME, phaseFor, type Today as TodayInfo } from "../../shared/cycle";
import { addDays, diffDays, localToday, prettyDate } from "../../shared/dates";
import { LH_LABEL } from "../../shared/lh";
import { AskBloomCard } from "../components/AskBloom";
import { AfterLossCard, InvitationCard, PlanCard, SignalsCard, WaitListCard } from "../components/CycleCards";
import { DailyNote } from "../components/DailyNote";
import { DayEditor } from "../components/DayEditor";
import { HealthSummaryLink } from "../components/HealthChecks";
import { LhUploadButton } from "../components/LhUpload";
import { PositiveTestSheet } from "../components/PositiveTestSheet";
import { usePregnancy } from "../lib/pregnancy";
import { PregnancyToday } from "./PregnancyToday";
import { api } from "../lib/api";
import { focusFor, lhStartDay, waitListActive } from "../lib/cycleToday";
import { invitationFor } from "../content/invitations";
import { DEFAULT_WAIT_LIST, namesOf } from "../../shared/types";
import { useStore } from "../lib/store";

export function TodayPage() {
  return usePregnancy() ? <PregnancyToday /> : <CycleToday />;
}

function CycleToday() {
  const { model, byDate, lhTests, aiEnabled, dayLogs, syncOura, oura, settings } = useStore();
  const today = localToday();
  // Pull last night from Oura when the app opens (at most every few hours).
  useEffect(() => {
    syncOura().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oura?.connected]);
  const yesterday = addDays(today, -1);
  const info = useMemo(() => phaseFor(today, model), [today, model]);
  const [checkDay, setCheckDay] = useState<"yesterday" | "today">(byDate.has(yesterday) ? "today" : "yesterday");

  const vars = {
    dpo: info.dpo,
    testDate: info.testDate ? prettyDate(info.testDate) : null,
    fertileDay: info.fertileDay,
    fertileLength: info.fertileLength,
    daysToFertile: info.fertileStart ? Math.max(0, diffDays(info.fertileStart, today)) : null,
    lhStart: lhStartDay(info),
  };
  const todaysLh = lhTests.filter((t) => t.date === today);

  return (
    <div className="stack">
      <Hero info={info} />

      {info.phase !== "unknown" && <>
        <InvitationCard info={info} />
        <WaitListCard info={info} />
        <AfterLossCard info={info} />
        <SignalsCard info={info} />
        {aiEnabled && <PersonalLine info={info} />}
      </>}

      <div className="card stack">
        <div className="row between wrap">
          <h2>Quick check-in</h2>
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={checkDay === "yesterday"} onClick={() => setCheckDay("yesterday")}>Yesterday</button>
            <button role="tab" aria-selected={checkDay === "today"} onClick={() => setCheckDay("today")}>Today</button>
          </div>
        </div>
        <p className="muted small">
          {checkDay === "yesterday" ? `How was ${prettyDate(yesterday, true)}? Tap what fits; it saves as you go.` : "Log anything from today so far."}
        </p>
        <DayEditor key={checkDay} date={checkDay === "yesterday" ? yesterday : today} compact />
        <div className="row wrap">
          <LhUploadButton date={checkDay === "yesterday" ? yesterday : today} />
          <a className="btn ghost" href={`#/day/${checkDay === "yesterday" ? yesterday : today}`}>More details →</a>
        </div>
        {todaysLh.length > 0 && (
          <div className="row wrap small">
            <span className="muted">Today's LH:</span>
            {todaysLh.map((t) => (
              <span key={t.id} className={`lh-badge lh-${t.level}`}>{t.ratio !== null ? t.ratio.toFixed(2) : ""} {LH_LABEL[t.level]}</span>
            ))}
          </div>
        )}
      </div>

      {info.phase !== "unknown" && <PlanCard info={info} />}

      {info.phase !== "unknown" && <DailyNote info={info} vars={vars} />}

      <HealthSummaryLink />

      {info.phase !== "unknown" && <AskBloomCard suggestions={todaySuggestions(info)} />}

      {dayLogs.length === 0 && (
        <div className="card stack">
          <h2>Bring your history with you</h2>
          <p className="muted">Import your Clue and Premom data so Bloom knows your cycles from day one.</p>
          <a className="btn primary" href="#/import">Import history</a>
        </div>
      )}

      {info.phase !== "unknown" && (
        <a className="btn ghost" href="#/partner" style={{ alignSelf: "center" }}>
          See what {namesOf(settings).partner || "your partner"} sees →
        </a>
      )}

      <p className="tiny muted center">Bloom gives general information, not medical advice. Talk to your doctor about anything that worries you.</p>
    </div>
  );
}

function Hero({ info }: { info: TodayInfo }) {
  const { model, lhTests, byDate, settings } = useStore();
  const [positive, setPositive] = useState(false);
  if (info.phase === "unknown") {
    return (
      <div className="card hero ph-unknown stack">
        <span className="phase-pill"><span className="dot" />Welcome</span>
        <h1>Let's get to know your cycle</h1>
        <p className="muted">Log the first day of your last period, or import your history from Clue and Premom.</p>
        <div className="row wrap">
          <a className="btn primary" href="#/import">Import history</a>
          <a className="btn" href={`#/day/${localToday()}`}>Log a period day</a>
        </div>
      </div>
    );
  }
  const focus = focusFor(info, model, lhTests, byDate, settings.quietWait !== false);
  return (
    <div className={`card hero ph-${info.phase}${focus.counts ? " counts" : ""}`}>
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: 6 }}>
          <div className="muted small">{prettyDate(info.date, true)}</div>
          <span className="phase-pill"><span className="dot" />{PHASE_NAME[info.phase]}</span>
          <h1 style={{ marginTop: 4 }}>{focus.headline}</h1>
          {focus.sub && <p className="small">{focus.sub}</p>}
        </div>
        <div className="center">
          <div className="big-day">{info.cycleDay}</div>
          <div className="tiny muted">cycle day</div>
        </div>
      </div>
      <div className="facts">
        {info.ovulation && (
          <div className="fact">
            {info.ovulationConfirmed
              ? info.daysUntilOvulation ? "Ovulation" : `Ovulated (${info.cycle?.ovulationSource === "temp" ? "by temp" : info.cycle?.tempShift ? "LH + temp" : "confirmed"})`
              : info.daysUntilOvulation ? "Ovulation (est.)" : "Ovulated (est.)"}
            <b>{prettyDate(info.ovulation)}</b>
          </div>
        )}
        {info.dpo && info.testDate && info.phase !== "late" && (
          <div className="fact">Test from<b>{prettyDate(info.testDate)}</b></div>
        )}
        {info.nextPeriod && (
          <div className="fact">Next period<b>{prettyDate(info.nextPeriod)}</b></div>
        )}
        <div className="fact">Avg cycle<b>{model.avgCycleLength} days</b></div>
      </div>
      {(info.phase.startsWith("tww") || info.phase === "late") && (
        <button className="btn primary positive-btn" onClick={() => setPositive(true)}>I got a positive test 🎉</button>
      )}
      {positive && <PositiveTestSheet onClose={() => setPositive(false)} />}
    </div>
  );
}

function PersonalLine({ info }: { info: TodayInfo }) {
  const { byDate, lhTests, dayLogs, model, settings } = useStore();
  const [line, setLine] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const yesterday = addDays(info.date, -1);

  const context = useMemo(() => {
    const y = byDate.get(yesterday);
    const recentLh = lhTests.filter((t) => t.date >= addDays(info.date, -6)).map((t) => ({ date: t.date, ratio: t.ratio, level: t.level }));
    const loveDays = info.fertileStart
      ? dayLogs.filter((d) => d.intercourse && d.date >= info.fertileStart! && d.date <= info.date).map((d) => d.date)
      : [];
    return {
      today: info.date,
      phase: PHASE_NAME[info.phase],
      cycleDay: info.cycleDay,
      dpo: info.dpo,
      fertileWindow: info.fertileStart ? `${info.fertileStart} to ${info.fertileEnd}` : null,
      fertileDay: info.fertileDay,
      ovulation: info.ovulation,
      ovulationConfirmedByLH: info.ovulationConfirmed,
      nextPeriod: info.nextPeriod,
      yesterday: y ? { flow: y.flow, intercourse: y.intercourse, symptoms: y.symptoms, mood: y.mood, cervical_mucus: y.cervical_mucus } : "nothing logged",
      recentLhReadings: recentLh,
      intercourseInFertileWindowSoFar: loveDays,
      todaysFocus: focusFor(info, model, lhTests, byDate, settings.quietWait !== false).headline,
      todaysInvitation: (() => {
        const inv = invitationFor(info, model.afterLoss?.start === info.cycle?.start ? model.afterLoss?.start ?? null : null);
        return inv ? `${inv.name}: ${inv.line} Ritual: ${inv.ritual}` : null;
      })(),
      waitListToday: waitListActive(info) ? (settings.waitList ?? DEFAULT_WAIT_LIST) : null,
      quietWait: settings.quietWait !== false,
      ovulationConfirmedBy: info.cycle?.ovulationConfirmed ? info.cycle.ovulationSource : null,
      temperatureShift: info.cycle?.tempShift ? { since: info.cycle.tempShift.firstHigh, riseC: info.cycle.tempShift.rise } : null,
      ouraLastNights: model.wearable.filter((w) => w.date >= addDays(info.date, -4)),
      firstCycleAfterLoss: model.afterLoss && model.afterLoss.start === info.cycle?.start
        ? { day1: model.afterLoss.start, negativePregnancyTest: model.afterLoss.negativeTest }
        : null,
    };
    // Only rebuild once per day/phase so we don't hammer the cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.date, info.phase]);

  useEffect(() => {
    let live = true;
    api
      .dailyNote(info.date, info.phase, context)
      .then((r) => live && setLine(r.line))
      .catch((e) => live && setErr((e as Error).message));
    return () => {
      live = false;
    };
  }, [info.date, info.phase, context]);

  return (
    <div className={`card ph-${info.phase}`} style={{ borderLeft: "4px solid var(--phase)" }}>
      <div className="section-title"><span className="ico" aria-hidden>💌</span>For you today</div>
      {err ? (
        <p className="small muted" style={{ marginTop: 8 }}>Couldn't write today's note: {err}</p>
      ) : (
        <p style={{ marginTop: 8 }}>{line ?? <span className="muted row"><span className="spin" /> Writing your note…</span>}</p>
      )}
    </div>
  );
}

function todaySuggestions(info: TodayInfo): string[] {
  if (info.phase === "menstrual") return ["Is my period normal?", "What helps with cramps?", "When should I start LH testing this cycle?"];
  if (info.phase === "follicular") return ["When will I ovulate this cycle?", "How should I time sex this month?", "What's a good LH testing plan for me?"];
  if (info.phase === "fertile" || info.phase === "ovulation") return ["What do my LH readings mean?", "Did I time things well this cycle?", "How do I know I've ovulated?"];
  if (info.phase === "late") return ["When should I test?", "Why might my period be late?", "What does a faint line mean?"];
  return ["When should I test?", "Are these symptoms pregnancy or PMS?", "What happens around implantation?"];
}
