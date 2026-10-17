import { useCallback, useEffect, useState } from "react";
import type { BumpPhoto, JournalEntry, Pregnancy } from "../../shared/types";
import { api, resizeImage } from "./api";

/** Your answers to the daily question and this pregnancy's bump photos, with ways to save them. */
export function useMemories(preg: Pregnancy) {
  const id = preg.positiveTestDate;
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [photos, setPhotos] = useState<BumpPhoto[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    api.memories(id)
      .then((r) => {
        if (!live) return;
        setEntries(r.entries);
        setPhotos(r.photos);
      })
      .catch((e) => live && setError((e as Error).message));
    return () => {
      live = false;
    };
  }, [id]);

  const saveAnswer = useCallback(async (entry: JournalEntry) => {
    const r = await api.saveAnswer(entry);
    setEntries((prev) => {
      const rest = (prev ?? []).filter((e) => e.date !== entry.date);
      return (r.entry ? [r.entry, ...rest] : rest).sort((a, b) => b.date.localeCompare(a.date));
    });
  }, []);

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
