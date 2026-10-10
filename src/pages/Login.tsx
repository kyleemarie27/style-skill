import { useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

export function LoginPage() {
  const { setAuthed } = useStore();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="main" style={{ maxWidth: 420, paddingTop: "18vh" }}>
      <form
        className="card stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          try {
            await api.login(pw);
            setAuthed(true);
          } catch (e) {
            setErr((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="row">
          <img src="/icon-192.png" width={44} height={44} style={{ borderRadius: 12 }} alt="" />
          <h1>Bloom</h1>
        </div>
        <p className="muted">Your private cycle and fertility tracker.</p>
        <label>
          <div className="field-label">Password</div>
          <input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        </label>
        {err && <div className="notice err">{err}</div>}
        <button className="btn primary block" disabled={busy || !pw}>{busy ? <span className="spin" /> : "Log in"}</button>
      </form>
    </div>
  );
}
