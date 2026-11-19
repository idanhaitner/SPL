"use client";

import { useEffect } from "react";
import { boardEnabled, getStore } from "@/lib/board-store";
import { readPublished } from "@/lib/player";
import type { ChapterInfo } from "@/lib/progress";
import { publishIfChanged } from "@/lib/publish";

// Sends this device's summary in the background whenever progress or the name changes. Nothing waits on it,
// and a failure is simply tried again next time.
export function BoardSync({ courseId, chapters }: { courseId: string; chapters: ChapterInfo[] }) {
  useEffect(() => {
    if (!boardEnabled()) return;
    let timer: number | undefined;
    let stopped = false;
    const publish = async () => {
      const store = await getStore().catch(() => null);
      if (!store || stopped) return;
      await publishIfChanged(courseId, chapters, store, Date.now()).catch(() => "failed");
    };
    // The first send after joining goes at once, so the student sees themselves on the board; later ones wait for a pause.
    const soon = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(publish, readPublished(courseId) ? 2000 : 0);
    };
    void publish();
    window.addEventListener("study-progress", soon);
    window.addEventListener("study-player", soon);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.removeEventListener("study-progress", soon);
      window.removeEventListener("study-player", soon);
    };
  }, [courseId, chapters]);
  return null;
}
