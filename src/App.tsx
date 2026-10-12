import { CalendarIcon, ChartIcon, GearIcon, PlusIcon, SproutIcon, StethIcon, SunIcon } from "./components/Icons";
import { localToday } from "../shared/dates";
import { activePregnancy } from "../shared/pregnancy";
import { useRoute, useStore } from "./lib/store";
import { CalendarPage } from "./pages/Calendar";
import { DayPage } from "./pages/DayPage";
import { DoctorPage } from "./pages/DoctorPage";
import { ImportPage } from "./pages/Import";
import { InsightsPage } from "./pages/Insights";
import { LoginPage } from "./pages/Login";
import { SettingsPage } from "./pages/Settings";
import { TodayPage } from "./pages/Today";
import { WeekPage, WeeksPage } from "./pages/WeeksPage";

export function App() {
  const { loading, authed, settings } = useStore();
  const [route] = useRoute();

  if (loading || authed === null) {
    return <div className="main center muted" style={{ paddingTop: "30vh" }}><span className="spin" /></div>;
  }
  if (!authed) return <LoginPage />;

  const [page, arg] = route;
  const today = localToday();
  const pregnant = !!activePregnancy(settings);
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
        {link(`day/${today}`, "Log", PlusIcon, page === "day")}
        {pregnant ? link("doctor", "Doctor", StethIcon, page === "doctor")
          : link("insights", "Insights", ChartIcon, page === "insights")}
        {link("settings", "Settings", GearIcon, page === "settings" || page === "import" || (pregnant && page === "insights"))}
      </nav>
      <main className="main">
        {page === "calendar" ? <CalendarPage />
          : page === "day" ? <DayPage date={arg ?? today} />
          : page === "insights" ? <InsightsPage />
          : page === "settings" ? <SettingsPage />
          : page === "import" ? <ImportPage />
          : page === "weeks" ? <WeeksPage />
          : page === "week" ? <WeekPage week={Number(arg)} />
          : page === "doctor" ? <DoctorPage />
          : <TodayPage />}
      </main>
    </div>
  );
}
