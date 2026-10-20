import { useState } from "react";
import { api } from "../lib/api";
import { useSavePregnancy, usePregnancy } from "../lib/pregnancy";
import { useStore } from "../lib/store";
import { askViewerNext } from "../lib/viewer";

/**
 * Shown after logging in with the shared setup password on a new device, in pregnancy mode.
 * The partner makes a login of their own here, so the shared password can be retired.
 */
export function WhoPage() {
  const p = usePregnancy()!;
  const { auth, refreshAuth, setAuthed } = useStore();
  const save = useSavePregnancy();
  const [who, setWho] = useState<"me" | "partner" | null>(null);
  const [mom, setMom] = useState(p.preg.momName ?? "");
  const [partner, setPartner] = useState(p.preg.partnerName ?? "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const partnerExists = !!auth?.partner;

  const done = async () => {
    if (!who) return;
    setBusy(true);
    setErr("");
    try {
      if (mom.trim() !== (p.preg.momName ?? "") || partner.trim() !== (p.preg.partnerName ?? "")) {
        await save({ momName: mom.trim() || null, partnerName: partner.trim() || null });
      }
      if (who === "partner") {
        if (partnerExists) {
          // A partner login already exists: sign out of the shared one and use theirs.
          await api.logout();
          askViewerNext(false);
          setAuthed(false);
          return;
        }
        if (pw !== pw2) throw new Error("The two passwords don't match.");
        await api.claimPartner(pw);
      }
      askViewerNext(false);
      await refreshAuth();
      window.location.hash = "#/today";
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack" style={{ maxWidth: 460, margin: "0 auto", paddingTop: "8vh" }}>
      <div className="card stack">
        <h1>Who's using Bloom on this phone?</h1>
        <p className="muted small">Each of you gets your own login, so Bloom can show you what's useful and keep your answers to yourselves until you've both written one.</p>
        <div className="who-choices">
          <button className="who" aria-pressed={who === "me"} onClick={() => setWho("me")}>
            <span aria-hidden>🤰</span><b>I'm pregnant</b><span className="tiny muted">Tracking, check-ins, the full guide</span>
          </button>
          <button className="who" aria-pressed={who === "partner"} onClick={() => setWho("partner")}>
            <span aria-hidden>🤝</span><b>I'm the partner</b><span className="tiny muted">How to help, day by day</span>
          </button>
        </div>
        {who === "partner" && partnerExists && (
          <p className="notice small">You already have a partner login. Tap Continue, then log in with your own password.</p>
        )}
        {who && !(who === "partner" && partnerExists) && (
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
        {who === "partner" && !partnerExists && (
          <div className="stack" style={{ gap: 8 }}>
            <p className="small muted">Make a password that's just yours (10+ characters). You'll use it to log in from now on.</p>
            <input type="password" autoComplete="new-password" placeholder="Your new password" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="Your new password" />
            <input type="password" autoComplete="new-password" placeholder="Type it again" value={pw2} onChange={(e) => setPw2(e.target.value)} aria-label="Type it again" />
          </div>
        )}
        {who === "me" && (
          <p className="small muted">Next, set a password of your own in Settings so the shared one stops working.</p>
        )}
        {err && <div className="notice err small">{err}</div>}
        <button className="btn primary block" disabled={!who || busy || (who === "partner" && !partnerExists && pw.length < 10)} onClick={done}>
          {busy ? <span className="spin" /> : "Continue"}
        </button>
      </div>
    </div>
  );
}
