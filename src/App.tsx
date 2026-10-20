import { AskPage } from "./components/AskBloom";
import { CalendarIcon, ChartIcon, ChatIcon, GearIcon, PlusIcon, SproutIcon, StethIcon, SunIcon } from "./components/Icons";
import { localToday } from "../shared/dates";
import { activePregnancy } from "../shared/pregnancy";
import { useRoute, useStore } from "./lib/store";
import { CalendarPage } from "./pages/Calendar";
import { DayPage } from "./pages/DayPage";
import { DoctorPage } from "./pages/DoctorPage";
import { ImportPage } from "./pages/Import";
import { InsightsPage } from "./pages/Insights";
import { LoginPage } from "./pages/Login";
import { MemoriesPage } from "./pages/MemoriesPage";
import { PartnerToday } from "./pages/PartnerToday";
import { SettingsPage } from "./pages/Settings";
import { TodayPage } from "./pages/Today";
import { WeekPage, WeeksPage } from "./pages/WeeksPage";
import { WhoPage } from "./pages/WhoPage";
import { shouldAskViewer } from "./lib/viewer";

export function App() {
  const { loading, authed, settings, role, auth } = useStore();
  const [route] = useRoute();

  if (loading || authed === null) {
    return <div className="main center muted" style={{ paddingTop: "30vh" }}><span className="spin" /></div>;
  }
  if (!authed) return <LoginPage />;

  const [page, arg] = route;
  const today = localToday();
  const pregnant = !!activePregnancy(settings);
  // The partner's phone: a Today written for them, and no Log tab (logging is the pregnant partner's).
  const partner = pregnant && role === "partner";
  if (pregnant && auth?.setup && shouldAskViewer()) return <div className="app pregnant"><main className="main"><WhoPage /></main></div>;
  const link = (href: string, label: string, Icon: () => React.JSX.Element, active: boolean) => (
    <a href={`#/${href}`} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
      <Icon />
      <span>{label}</span>
    </a>
  );

  return (
    <div className={`app${pregnant ? " pregnant" : ""}`}>
      <nav className="nav" aria-label="Main">
        <div className="brand"><img src="/icon-192.png" alt="" />Bloom</div>
        {link("today", "Today", SunIcon, page === "today")}
        {pregnant ? link("weeks", "Weeks", SproutIcon, page === "weeks" || page === "week" || page === "calendar")
          : link("calendar", "Calendar", CalendarIcon, page === "calendar")}
        {!partner && link(`day/${today}`, "Log", PlusIcon, page === "day")}
        {link("ask", "Ask", ChatIcon, page === "ask")}
        {pregnant ? link("doctor", "Doctor", StethIcon, page === "doctor")
          : link("insights", "Insights", ChartIcon, page === "insights")}
        <span className="nav-settings">{link("settings", "Settings", GearIcon, page === "settings" || page === "import" || (pregnant && page === "insights"))}</span>
      </nav>
      <main className="main">
        {page === "today" && (
          <a className="settings-btn" href="#/settings" aria-label="Settings"><GearIcon /></a>
        )}
        {page === "today" && auth?.setup && (
          <a className="notice warn small setup-nudge" href="#/settings">🔒 You're still using the shared setup password. <b>Set your own ›</b></a>
        )}
        {page === "calendar" ? <CalendarPage />
          : page === "day" ? <DayPage date={arg ?? today} />
          : page === "insights" ? <InsightsPage />
          : page === "settings" ? <SettingsPage />
          : page === "import" ? <ImportPage />
          : page === "weeks" ? <WeeksPage />
          : page === "week" ? <WeekPage week={Number(arg)} tab={route[2]} />
          : page === "doctor" ? <DoctorPage />
          : page === "ask" ? <AskPage key={arg ?? ""} first={arg ? decodeURIComponent(arg) : null} />
          : page === "memories" ? <MemoriesPage />
          : page === "partner" && pregnant ? <PartnerToday />
          : partner ? <PartnerToday />
          : <TodayPage />}
      </main>
    </div>
  );
}
