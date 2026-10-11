import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { StoreProvider } from "./lib/store";
import "./styles.css";
import { registerSW } from "virtual:pwa-register";

// Bloom caches itself for offline use. Check for a new version on launch, whenever the app comes
// back to the foreground (phones resume apps rather than relaunching them) and every 30 minutes;
// when one is found the service worker takes over and the page reloads with the new version.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => reg.update().catch(() => {});
    setInterval(check, 30 * 60 * 1000);
    document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && check());
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
