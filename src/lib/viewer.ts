import { useSyncExternalStore } from "react";
import { readLocal, writeLocal } from "./pregnancy";

/**
 * Who's using Bloom on this device. Both partners share one login; the partner's phone opens to
 * a page written for them. Kept per device, so existing logins stay as they were ("me").
 */
export type Viewer = "me" | "partner";

const KEY = "bloom-viewer";
/** Set right after logging in, so a new device asks who's using it (only in pregnancy mode). */
const ASK_KEY = "bloom-ask-viewer";
const listeners = new Set<() => void>();

const read = (): Viewer => (readLocal<string>(KEY, "me") === "partner" ? "partner" : "me");

export function setViewer(v: Viewer) {
  writeLocal(KEY, v);
  writeLocal(ASK_KEY, false);
  listeners.forEach((l) => l());
}

export function askViewerNext() {
  writeLocal(ASK_KEY, true);
}

export const shouldAskViewer = () => readLocal(ASK_KEY, false);

export function useViewer(): Viewer {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
  );
}
