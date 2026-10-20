import { useCallback, useEffect, useState } from "react";
import type { BumpPhoto, JournalEntry, Pregnancy } from "../../shared/types";
import { api, resizeImage } from "./api";

/** Your answers to the daily question and this pregnancy's bump photos, with ways to save them. */
export function useMemories(preg: Pregnancy) {
  const id = preg.positiveTestDate;
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [photos, setPhotos] = useState<BumpPhoto[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await api.memories(id);
    setEntries(r.entries);
    setPhotos(r.photos);
  }, [id]);

  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
  }, [load]);

  /** Save your answer, then reload: answering is what unlocks your partner's answer for that day. */
  const saveAnswer = useCallback(async (entry: JournalEntry) => {
    await api.saveAnswer(entry);
    await load();
  }, [load]);

  const saveBump = useCallback(async (week: number, date: string, file: File) => {
    const image = await resizeImage(file, 1280, 0.82);
    const r = await api.saveBump(id, week, date, image);
    setPhotos((prev) => [...prev.filter((p) => p.week !== week), r.photo].sort((a, b) => a.week - b.week));
  }, [id]);

  const deleteBump = useCallback(async (week: number) => {
    await api.deleteBump(id, week);
    setPhotos((prev) => prev.filter((p) => p.week !== week));
  }, [id]);

  return { entries, photos, error, saveAnswer, saveBump, deleteBump };
}
