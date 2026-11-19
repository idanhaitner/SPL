"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/home/Icon";
import { boardEnabled, getStore } from "@/lib/board-store";
import { cleanName, ordinal, rankRows, type Row } from "@/lib/leaderboard";
import { declinePlayer, readPlayer, readPublished, renamePlayer, type PlayerState } from "@/lib/player";
import { hideRow } from "@/lib/publish";
import { BoardList } from "./BoardList";
import { Garden } from "./Garden";
import { openJoinDialog } from "./JoinDialog";

type Status = "loading" | "ready" | "error" | "off";

function usePlayer(courseId: string) {
  const [player, setPlayer] = useState<PlayerState>(null);
  useEffect(() => {
    const sync = () => setPlayer(readPlayer(courseId));
    sync();
    window.addEventListener("study-player", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("study-player", sync);
      window.removeEventListener("storage", sync);
    };
  }, [courseId]);
  return player;
}

// The live board: who is where, as plants and as a ranked list. Everything here is read from the shared board; nothing waits on it to study.
// `decor` is the masthead's arches and sprig, drawn on the server.
export function Leaderboard({ courseId, total, partStarts, labels, decor }: { courseId: string; total: number; partStarts: { label: string; num: number }[]; labels: Record<string, string>; decor: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [now, setNow] = useState(0);
  const player = usePlayer(courseId);
  const you = player && "id" in player ? player.id : null;

  useEffect(() => {
    if (!boardEnabled()) {
      setStatus("off");
      return;
    }
    let stop = () => {};
    let gone = false;
    getStore().then((store) => {
      if (gone) return;
      if (!store) return setStatus("off");
      stop = store.watch(
        courseId,
        (next) => {
          setRows(next);
          setNow(Date.now());
          setStatus("ready");
        },
        () => setStatus("error"),
      );
    }, () => setStatus("error"));
    return () => {
      gone = true;
      stop();
    };
  }, [courseId]);

  const ranked = useMemo(() => rankRows(rows, now), [rows, now]);
  const mine = ranked.find((row) => row.id === you);

  const rename = (value: string) => {
    const name = cleanName(value);
    if (!name) return false;
    renamePlayer(courseId, name);
    return true;
  };
  // Leaving happens on this device at once; hiding the row is sent after, since Firestore holds writes until it is back online.
  const leave = () => {
    const last = readPublished(courseId);
    declinePlayer(courseId);
    void getStore()
      .then((store) => (store && last ? hideRow(courseId, store, last) : undefined))
      .catch(() => {});
  };

  const standing = status !== "ready" ? null : mine ? (
    <p className="board-you">You&rsquo;re {ordinal(mine.place)} of {ranked.length}</p>
  ) : you ? (
    <p className="board-you">Finding your place&hellip;</p>
  ) : (
    <button type="button" className="gh-btn" onClick={openJoinDialog}>
      Join the leaderboard
      <Icon name="arrow" />
    </button>
  );

  return (
    <>
      <header className="masthead board-masthead">
        {decor}
        <div className="masthead-inner">
          <h1>Leaderboard</h1>
          <p className="masthead-lede">How far everyone has grown</p>
          <div className="board-standing">{standing}</div>
        </div>
        {status === "ready" && ranked.length > 0 && <Garden rows={ranked} you={you} total={total} partStarts={partStarts} />}
      </header>
      <div className="board-body">
        {status === "loading" && <div className="board-placeholder" aria-busy="true" aria-label="Loading the leaderboard" />}
        {status === "off" && <p className="board-note">The leaderboard isn&rsquo;t set up yet.</p>}
        {status === "error" && <p className="board-note">The leaderboard can&rsquo;t be reached right now. Your progress is safe on this device.</p>}
        {status === "ready" && ranked.length === 0 && <p className="board-note">Nobody&rsquo;s here yet. Finish a chapter or solve a question to be the first.</p>}
        {status === "ready" && ranked.length > 0 && (
          <BoardList rows={ranked} you={you} labels={labels} now={now} total={total} onRename={rename} onLeave={leave} />
        )}
      </div>
    </>
  );
}
