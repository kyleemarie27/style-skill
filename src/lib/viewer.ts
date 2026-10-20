import { readLocal, writeLocal } from "./pregnancy";
import { useStore } from "./store";

/**
 * Who's using Bloom: the main account ("me") or the partner. It comes from the login, so the
 * server enforces it too (the partner can't change logs or settings, and reads answers only once
 * they've written their own).
 */
export type Viewer = "me" | "partner";

export function useViewer(): Viewer {
  return useStore().role;
}

/**
 * Logged in on a new device with the shared setup password: ask who it is, so the partner can make
 * their own login. Once the main account has its own password, this never comes up.
 */
const ASK_KEY = "bloom-ask-viewer";
export const askViewerNext = (on = true) => writeLocal(ASK_KEY, on);
export const shouldAskViewer = () => readLocal(ASK_KEY, false);
