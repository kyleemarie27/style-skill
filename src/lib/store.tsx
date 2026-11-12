import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildModel, type CycleModel } from "../../shared/cycle";
import { DEFAULT_SETTINGS, type DayLog, type LhTest, type Settings } from "../../shared/types";
import type { WearableDay } from "../../shared/wearable";
import { api, AuthError, type AuthStatus, type OuraStatus, type Role } from "./api";

interface Store {
  loading: boolean;
  authed: boolean | null;
  aiEnabled: boolean;
  /** Whose login this is. The partner's phone gets its own Today and can't change logs or settings. */
  role: Role;
  auth: AuthStatus | null;
  refreshAuth: () => Promise<void>;
  dayLogs: DayLog[];
  lhTests: LhTest[];
  /** Nightly Oura numbers (empty until Oura is connected). */
  wearable: WearableDay[];
  oura: OuraStatus | null;
  /** Pull the latest nights from Oura if the last sync is more than a few hours old. */
  syncOura: (force?: boolean) => Promise<void>;
  settings: Settings;
  model: CycleModel;
  byDate: Map<string, DayLog>;
  reload: () => Promise<void>;
  saveDay: (log: DayLog) => Promise<void>;
  setSettings: (s: Settings) => Promise<void>;
  setAuthed: (v: boolean) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [aiEnabled, setAi] = useState(false);
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayLogs, setDayLogs] = useState<DayLog[]>([]);
  const [lhTests, setLhTests] = useState<LhTest[]>([]);
  const [wearable, setWearable] = useState<WearableDay[]>([]);
  const [oura, setOura] = useState<OuraStatus | null>(null);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);

  const reload = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([api.data(), api.settings()]);
      setDayLogs(d.dayLogs);
      setLhTests(d.lhTests);
      setWearable(d.wearable ?? []);
      setOura(d.oura ?? null);
      setSettingsState(s.settings);
      setAuthed(true);
    } catch (e) {
      if (e instanceof AuthError) setAuthed(false);
      else throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    const s = await api.status();
    setAuth(s);
    setAi(s.ai);
  }, []);

  useEffect(() => {
    api
      .status()
      .then((s) => {
        setAuth(s);
        setAi(s.ai);
        if (s.authed) return reload();
        setAuthed(false);
        setLoading(false);
      })
      .catch(() => {
        setAuthed(false);
        setLoading(false);
      });
  }, [reload]);

  const saveDay = useCallback(async (log: DayLog) => {
    // Optimistic: update locally first so taps feel instant.
    setDayLogs((prev) => {
      const rest = prev.filter((d) => d.date !== log.date);
      return [...rest, { ...log, source: "manual" }].sort((a, b) => a.date.localeCompare(b.date));
    });
    await api.saveDay(log);
  }, []);

  const syncOura = useCallback(async (force = false) => {
    if (!oura?.connected || !oura.configured) return;
    const stale = !oura.lastSync || Date.now() - Date.parse(oura.lastSync) > 3 * 3600_000;
    if (!force && !stale) return;
    const r = await api.ouraSync();
    setOura(r.oura);
    if (r.saved) {
      const d = await api.data();
      setWearable(d.wearable ?? []);
    }
  }, [oura]);

  const setSettings = useCallback(async (s: Settings) => {
    const r = await api.saveSettings(s);
    setSettingsState(r.settings);
  }, []);

  const model = useMemo(() => buildModel(dayLogs, lhTests, settings, wearable), [dayLogs, lhTests, settings, wearable]);
  const byDate = useMemo(() => new Map(dayLogs.map((d) => [d.date, d])), [dayLogs]);

  const value: Store = {
    loading,
    authed,
    aiEnabled,
    role: auth?.role ?? "me",
    auth,
    refreshAuth,
    dayLogs,
    lhTests,
    wearable,
    oura,
    syncOura,
    settings,
    model,
    byDate,
    reload,
    saveDay,
    setSettings,
    setAuthed: (v) => {
      setAuthed(v);
      if (v) {
        refreshAuth();
        reload();
      } else setAuth(null);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

/** Tiny hash router: #/today, #/calendar, #/day/2026-10-01, ... */
export function useRoute(): [string[], (path: string) => void] {
  const read = () => (window.location.hash.replace(/^#\/?/, "") || "today").split("/");
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const on = () => {
      setParts(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return [parts, (path: string) => (window.location.hash = `#/${path}`)];
}
