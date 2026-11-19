"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { boardEnabled, getStore } from "@/lib/board-store";
import { ordinal, rankRows } from "@/lib/leaderboard";
import { readPlayer } from "@/lib/player";

// One quiet line under Continue for a student on the leaderboard: their place, linking to the board.
// It reads the board once the page is idle, so home paints exactly as fast as before, and says nothing if the board can't be reached.
export function BoardRankLine({ courseId }: { courseId: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const player = readPlayer(courseId);
    if (!boardEnabled() || !player || !("id" in player)) return;
    let gone = false;
    const load = async () => {
      const store = await getStore().catch(() => null);
      const rows = store ? await store.once(courseId).catch(() => null) : null;
      if (gone || !rows) return;
      const ranked = rankRows(rows, Date.now());
      const mine = ranked.find((row) => row.id === player.id);
      if (mine) setText(`You’re ${ordinal(mine.place)} of ${ranked.length} on the leaderboard`);
    };
    const idle = window.requestIdleCallback?.(() => void load(), { timeout: 2500 });
    const timer = idle === undefined ? window.setTimeout(() => void load(), 1200) : undefined;
    return () => {
      gone = true;
      if (idle !== undefined) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, [courseId]);

  return (
    <p className={`board-rank${text ? " is-shown" : ""}`} aria-live="polite">
      {text && (
        <Link href="/leaderboard">
          {text} <span aria-hidden="true">&rarr;</span>
        </Link>
      )}
    </p>
  );
}
