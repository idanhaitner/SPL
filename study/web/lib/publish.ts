import type { BoardStore } from "./board-store";
import { gained, sameSummary, summarize } from "./leaderboard";
import { readPlayer, readPublished, writePublished } from "./player";
import { readProgress, type ChapterInfo } from "./progress";

// Sends this device's summary when it has changed since the last send. It only reads local progress, never writes it,
// and a failure is left for the next change or page load to retry.
export async function publishIfChanged(courseId: string, chapters: ChapterInfo[], store: BoardStore, now: number): Promise<"skipped" | "published" | "failed"> {
  const player = readPlayer(courseId);
  if (!player || !("id" in player)) return "skipped";
  const progress = readProgress(courseId);
  const summary = summarize(chapters, progress);
  const last = readPublished(courseId);
  const mine = last?.id === player.id ? last : null;
  // A row hidden earlier (when opening every chapter used to hide it) is sent again even with nothing new, so it comes back.
  if (mine && mine.name === player.name && sameSummary(mine.summary, summary) && !mine.hidden) return "skipped";
  const reachedAt = mine && !gained(mine.summary, summary) ? mine.reachedAt : now;
  try {
    // hidden is always sent, because the store merges and a row hidden earlier would otherwise stay hidden.
    await store.put(courseId, player.id, { name: player.name, ...summary, reachedAt, hidden: false });
  } catch {
    return "failed";
  }
  writePublished(courseId, { id: player.id, name: player.name, summary, reachedAt, hidden: false });
  return "published";
}

// Leaving the leaderboard: the site cannot delete a row, so it sends the last row again, marked hidden.
// `last` can be read before the device forgets it, so leaving never has to wait on the network.
export async function hideRow(courseId: string, store: BoardStore, last = readPublished(courseId)) {
  if (!last) return;
  await store.put(courseId, last.id, { name: last.name, ...last.summary, reachedAt: last.reachedAt, hidden: true });
}
