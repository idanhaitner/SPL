"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { PlantMark } from "@/components/home/Icon";
import { boardEnabled } from "@/lib/board-store";
import { cleanName, NAME_MAX } from "@/lib/leaderboard";
import { declinePlayer, joinAs, readPlayer, readSeed, shouldAsk } from "@/lib/player";
import { readProgress } from "@/lib/progress";

// Opens the name dialog from anywhere, such as the Join button on the leaderboard page.
export function openJoinDialog() {
  window.dispatchEvent(new Event("study-join"));
}

// Someone typing code or a search should not be interrupted; the dialog waits until they leave the field.
function busyTyping() {
  const active = document.activeElement;
  return !!active && active !== document.body && (!!active.closest(".cm-editor") || active.matches("input, textarea, select, [contenteditable='true']"));
}

export function JoinDialog({ courseId }: { courseId: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  const titleId = useId();
  const errorId = useId();

  useEffect(() => setEnabled(boardEnabled()), []);

  useEffect(() => {
    if (!enabled) return;
    const show = () => {
      const dialog = ref.current;
      const player = readPlayer(courseId);
      if (!dialog || dialog.open || (player && "id" in player)) return;
      setName("");
      setError(false);
      dialog.showModal();
    };
    const check = () => {
      if (shouldAsk(readProgress(courseId), readPlayer(courseId), readSeed(courseId)) && !busyTyping()) show();
    };
    // Focus has not moved anywhere yet while focusout runs, so look once it has landed.
    const afterFocusMoves = () => window.setTimeout(check, 0);
    check();
    window.addEventListener("study-progress", check);
    window.addEventListener("study-join", show);
    document.addEventListener("focusout", afterFocusMoves);
    return () => {
      window.removeEventListener("study-progress", check);
      window.removeEventListener("study-join", show);
      document.removeEventListener("focusout", afterFocusMoves);
    };
  }, [enabled, courseId]);

  if (!enabled) return null;

  const join = (event: FormEvent) => {
    event.preventDefault();
    const clean = cleanName(name);
    if (!clean) {
      setError(true);
      return;
    }
    joinAs(courseId, clean);
    ref.current?.close();
  };
  const notNow = () => {
    declinePlayer(courseId);
    ref.current?.close();
  };

  return (
    <dialog ref={ref} className="board-join" aria-labelledby={titleId} onCancel={() => declinePlayer(courseId)}>
      <form className="board-join-form" onSubmit={join} noValidate>
        <span className="board-join-mark"><PlantMark /></span>
        <h2 id={titleId}>Join the leaderboard?</h2>
        <p className="board-join-lede">Pick a name others studying the course will see. Your name and how far you&rsquo;ve grown will be visible to anyone who opens the leaderboard.</p>
        <label className="board-field">
          <span>Your name</span>
          <input
            type="text"
            value={name}
            maxLength={NAME_MAX}
            autoComplete="nickname"
            autoFocus
            aria-invalid={error || undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError(false);
            }}
          />
        </label>
        {error && <p id={errorId} className="board-error" role="alert">Use 1 to 24 characters.</p>}
        <div className="board-join-actions">
          <button type="submit" className="gh-btn is-compact">Join</button>
          <button type="button" className="gh-quiet" onClick={notNow}>Not now</button>
        </div>
      </form>
    </dialog>
  );
}
