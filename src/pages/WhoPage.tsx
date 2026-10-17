import { useState } from "react";
import { useSavePregnancy, usePregnancy } from "../lib/pregnancy";
import { setViewer, type Viewer } from "../lib/viewer";

/**
 * Asked once on a newly logged-in device in pregnancy mode: whose phone is this? The partner's
 * phone then opens to a Today written for them. Names let both views say who they mean.
 */
export function WhoPage() {
  const p = usePregnancy()!;
  const save = useSavePregnancy();
  const [who, setWho] = useState<Viewer | null>(null);
  const [mom, setMom] = useState(p.preg.momName ?? "");
  const [partner, setPartner] = useState(p.preg.partnerName ?? "");
  const [busy, setBusy] = useState(false);

  const done = async () => {
    if (!who) return;
    setBusy(true);
    try {
      if (mom.trim() !== (p.preg.momName ?? "") || partner.trim() !== (p.preg.partnerName ?? "")) {
        await save({ momName: mom.trim() || null, partnerName: partner.trim() || null });
      }
    } finally {
      setBusy(false);
      setViewer(who);
      window.location.hash = "#/today";
    }
  };

  return (
    <div className="stack" style={{ maxWidth: 460, margin: "0 auto", paddingTop: "8vh" }}>
      <div className="card stack">
        <h1>Who's using Bloom on this phone?</h1>
        <p className="muted small">Bloom shows each of you what's useful to you. You can change this any time in Settings.</p>
        <div className="who-choices">
          <button className="who" aria-pressed={who === "me"} onClick={() => setWho("me")}>
            <span aria-hidden>🤰</span><b>I'm pregnant</b><span className="tiny muted">Tracking, check-ins, the full guide</span>
          </button>
          <button className="who" aria-pressed={who === "partner"} onClick={() => setWho("partner")}>
            <span aria-hidden>🤝</span><b>I'm the partner</b><span className="tiny muted">How to help, day by day</span>
          </button>
        </div>
        {who && (
          <div className="grid2">
            <label>
              <div className="field-label">{who === "me" ? "Your name" : "Pregnant partner's name"}</div>
              <input type="text" value={mom} onChange={(e) => setMom(e.target.value)} maxLength={40} />
            </label>
            <label>
              <div className="field-label">{who === "partner" ? "Your name" : "Your partner's name"}</div>
              <input type="text" value={partner} onChange={(e) => setPartner(e.target.value)} maxLength={40} />
            </label>
          </div>
        )}
        <button className="btn primary block" disabled={!who || busy} onClick={done}>{busy ? <span className="spin" /> : "Continue"}</button>
      </div>
    </div>
  );
}
