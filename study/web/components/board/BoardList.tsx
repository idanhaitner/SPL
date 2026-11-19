"use client";

import { useId, useState, type CSSProperties, type FormEvent } from "react";
import { ago, labelOf, NAME_MAX, type RankedRow } from "@/lib/leaderboard";

export const LIST_MAX = 50;

function YourActions({ name, onRename, onLeave }: { name: string; onRename: (name: string) => boolean; onLeave: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState(false);
  const errorId = useId();
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (onRename(value)) setEditing(false);
    else setError(true);
  };
  if (editing) {
    return (
      <form className="board-rename" onSubmit={save} noValidate>
        <label className="sr-only" htmlFor={`${errorId}-input`}>New name</label>
        <input
          id={`${errorId}-input`}
          type="text"
          value={value}
          maxLength={NAME_MAX}
          autoFocus
          aria-invalid={error || undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(false);
          }}
        />
        <button type="submit" className="gh-pill">Save</button>
        <button type="button" className="gh-quiet" onClick={() => setEditing(false)}>Cancel</button>
        {error && <p id={errorId} className="board-error" role="alert">Use 1 to 24 characters.</p>}
      </form>
    );
  }
  return (
    <div className="board-your-actions">
      <button type="button" className="gh-quiet" onClick={() => { setValue(name); setEditing(true); }}>Change name</button>
      <button type="button" className="gh-quiet" onClick={onLeave}>Leave the leaderboard</button>
    </div>
  );
}

function Row({ row, you, label, now, total, index, onRename, onLeave }: { row: RankedRow; you: boolean; label: string | null; now: number; total: number; index: number; onRename: (name: string) => boolean; onLeave: () => void }) {
  return (
    <li className={`board-row${you ? " is-you" : ""}${row.stale ? " is-stale" : ""}`} style={{ "--r": Math.min(index, 12) } as CSSProperties}>
      <span className="board-place">{row.place}</span>
      <div className="board-who">
        <bdi className="board-name">{row.name}</bdi>
        {you && <span className="board-you-tag">You</span>}
        <span className="board-meta">{row.chapters >= total ? <>Finished the course · </> : label ? <>Now on {label} · </> : null}active {ago(row.updatedAt, now)}</span>
      </div>
      <dl className="board-stats">
        <div><dt>Chapters</dt><dd>{row.chapters}<span> of {total}</span></dd></div>
        <div><dt>Reviews</dt><dd>{row.reviews}</dd></div>
        <div><dt>Solved</dt><dd>{row.solved}</dd></div>
      </dl>
      {you && <YourActions name={row.name} onRename={onRename} onLeave={onLeave} />}
    </li>
  );
}

// The ranked list: the top 50 with a way to see everyone, and the student's own row kept in view at the bottom if it falls below.
export function BoardList({ rows, you, labels, now, total, onRename, onLeave }: { rows: RankedRow[]; you: string | null; labels: Record<string, string>; now: number; total: number; onRename: (name: string) => boolean; onLeave: () => void }) {
  const [everyone, setEveryone] = useState(false);
  const shown = everyone ? rows : rows.slice(0, LIST_MAX);
  const mine = rows.find((row) => row.id === you);
  const pinned = mine && !shown.includes(mine) ? mine : null;
  const row = (entry: RankedRow, index: number) => (
    <Row key={entry.id} row={entry} you={entry.id === you} label={labelOf(labels, entry.current)} now={now} total={total} index={index} onRename={onRename} onLeave={onLeave} />
  );
  return (
    <section className="board-list-wrap" aria-label="Everyone, ranked">
      <ol className="board-list">{shown.map(row)}</ol>
      {pinned && <ol className="board-list is-pinned" aria-label="Your place">{row(pinned, 0)}</ol>}
      {!everyone && rows.length > LIST_MAX && (
        <button type="button" className="gh-pill board-more" onClick={() => setEveryone(true)}>Show everyone ({rows.length})</button>
      )}
    </section>
  );
}
