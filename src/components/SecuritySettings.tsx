import { useEffect, useState } from "react";
import { prettyDate } from "../../shared/dates";
import { api, type SignedIn } from "../lib/api";
import { useStore } from "../lib/store";

/** Settings → Security: your password, the partner's login, and every device that's signed in. */
export function SecuritySettings() {
  const { auth, role, settings, refreshAuth } = useStore();
  const partnerName = settings.pregnancy?.partnerName?.trim() || "your partner";
  return (
    <div className="card stack" id="security">
      <h2>Security</h2>
      {auth?.setup && (
        <div className="notice warn small">
          <b>You're using the shared setup password.</b> Anyone who knows it can log in as you. Set a password of your own below; the old one stops working and anyone using it is logged out.
        </div>
      )}
      <PasswordForm setup={!!auth?.setup} onDone={refreshAuth} />
      {role === "me" && <PartnerLogin name={partnerName} exists={!!auth?.partner} onDone={refreshAuth} />}
      <Devices mine={role === "me"} />
    </div>
  );
}

function PasswordForm({ setup, onDone }: { setup: boolean; onDone: () => Promise<void> }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setMsg(null);
    if (next !== again) return setMsg({ ok: false, t: "The new passwords don't match." });
    setBusy(true);
    try {
      await api.changePassword(cur, next);
      setCur(""); setNext(""); setAgain("");
      setMsg({ ok: true, t: "Password changed. Other devices signed in as you have been logged out." });
      await onDone();
    } catch (e) {
      setMsg({ ok: false, t: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="stack" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div className="field-label" style={{ marginBottom: 0 }}>{setup ? "Set your own password" : "Change your password"}</div>
      <input type="password" autoComplete="current-password" placeholder={setup ? "Current (shared) password" : "Current password"} value={cur} onChange={(e) => setCur(e.target.value)} aria-label="Current password" />
      <input type="password" autoComplete="new-password" placeholder="New password (10+ characters)" value={next} onChange={(e) => setNext(e.target.value)} aria-label="New password" />
      <input type="password" autoComplete="new-password" placeholder="New password again" value={again} onChange={(e) => setAgain(e.target.value)} aria-label="New password again" />
      <button className="btn primary" disabled={busy || !cur || next.length < 10}>{busy ? <span className="spin" /> : "Save password"}</button>
      {msg && <p className={`small${msg.ok ? " ok-text" : ""}`} style={msg.ok ? undefined : { color: "var(--period)" }}>{msg.t}</p>}
    </form>
  );
}

function PartnerLogin({ name, exists, onDone }: { name: string; exists: boolean; onDone: () => Promise<void> }) {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const Name = name.charAt(0).toUpperCase() + name.slice(1);
  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api.setPartnerPassword(pw);
      setPw("");
      setMsg({ ok: true, t: `Saved. ${Name} logs in with this password; any old sessions were logged out.` });
      await onDone();
    } catch (e) {
      setMsg({ ok: false, t: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!confirm(`Remove ${name}'s login? ${Name} will be logged out everywhere.`)) return;
    await api.removePartner();
    await onDone();
  };
  return (
    <form className="stack partner-settings" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); save(); }}>
      <div className="field-label" style={{ marginBottom: 0 }}>{Name}'s login</div>
      <p className="small muted">
        {exists
          ? `${Name} has a separate password. ${Name} can see your check-ins and add doctor questions, but can't change your logs or settings.`
          : `Give ${name} a separate password, so yours stays yours. ${Name} will see your check-ins and can add doctor questions, but can't change your logs or settings.`}
      </p>
      <div className="row" style={{ gap: 8 }}>
        <input type="password" autoComplete="new-password" placeholder={exists ? `New password for ${name}` : `${Name}'s password (10+ characters)`} value={pw} onChange={(e) => setPw(e.target.value)} aria-label={`${Name}'s password`} style={{ flex: 1, minWidth: 0 }} />
        <button className="btn" disabled={busy || pw.length < 10}>{exists ? "Reset" : "Create"}</button>
      </div>
      {exists && <button type="button" className="btn ghost danger small" style={{ alignSelf: "flex-start" }} onClick={remove}>Remove {name}'s login</button>}
      {msg && <p className="small" style={msg.ok ? undefined : { color: "var(--period)" }}>{msg.t}</p>}
    </form>
  );
}

function Devices({ mine }: { mine: boolean }) {
  const [list, setList] = useState<SignedIn[] | null>(null);
  const [done, setDone] = useState("");
  const load = () => (mine ? api.sessions().then((r) => setList(r.sessions)).catch(() => setList([])) : Promise.resolve());
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine]);
  const others = async () => {
    if (!confirm(mine ? "Log out every other device, including your partner's?" : "Log out your other devices?")) return;
    await api.logoutOthers();
    setDone("Other devices are logged out.");
    await load();
  };
  return (
    <div className="stack partner-settings" style={{ gap: 8 }}>
      <div className="field-label" style={{ marginBottom: 0 }}>Signed-in devices</div>
      {mine && list === null && <p className="muted row small"><span className="spin" /></p>}
      {mine && list && (
        <ul className="device-list">
          {list.map((d) => (
            <li key={d.id}>
              <span>
                <b>{d.label ?? "Device"}</b>{d.role === "partner" && <span className="tag">Partner</span>}{d.current && <span className="tag now">This device</span>}
                <span className="tiny muted block">Signed in {prettyDate(d.created_at.slice(0, 10))} · last used {prettyDate(d.last_seen.slice(0, 10))}</span>
              </span>
              {!d.current && (
                <button className="btn ghost danger small" onClick={async () => { await api.endSession(d.id); await load(); }}>Log out</button>
              )}
            </li>
          ))}
        </ul>
      )}
      <button className="btn ghost small" style={{ alignSelf: "flex-start" }} onClick={others}>Log out all other devices</button>
      {done && <p className="small">{done}</p>}
    </div>
  );
}
