"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { readSplit, writeSplit } from "@/lib/session-store";
import { clampFraction, fractionLimits, moveFraction, parseSaved } from "@/lib/split";

type Props = {
  courseId: string;
  name: string;
  orientation: "vertical" | "horizontal";
  start: number;
  minFirst: number;
  minSecond: number;
  label: string;
  first: ReactNode;
  second: ReactNode;
  className?: string;
};

// The question and its answer area. Coding and quick question steps share this, so the divider stays in one place across them.
export const QUESTION_SPLIT = { name: "question", orientation: "vertical", start: 0.4, minFirst: 320, minSecond: 320 } as const;

// Two panes with a draggable, keyboard-friendly divider. "vertical" is a vertical
// divider with the panes side by side. Left to right only; no right-to-left dragging.
export function Split({ courseId, name, orientation, start, minFirst, minSecond, label, first, second, className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  // The student's chosen position. It is never overwritten by fitting a small window,
  // only by the student moving the divider, so a roomier window gets it back.
  const [preferred, setPreferred] = useState(start);
  const [size, setSize] = useState(0);

  const measure = useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) setSize(orientation === "vertical" ? rect.width : rect.height);
  }, [orientation]);

  // Read the saved position before paint so the panes don't jump.
  useLayoutEffect(() => {
    setPreferred(parseSaved(readSplit(courseId, name), start));
  }, [courseId, name, start]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined" || !rootRef.current) return;
    const observer = new ResizeObserver(measure);
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [measure]);

  const limits = fractionLimits(size, minFirst, minSecond);
  const shown = clampFraction(preferred, limits);

  const choose = (fraction: number) => {
    setPreferred(fraction);
    writeSplit(courseId, name, fraction);
  };

  // The divider's position as a fraction of the container, from a pointer event.
  const fromPointer = (event: PointerEvent) => {
    const rect = rootRef.current!.getBoundingClientRect();
    const [offset, length] = orientation === "vertical" ? [event.clientX - rect.left, rect.width] : [event.clientY - rect.top, rect.height];
    return clampFraction(offset / length, limits);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const next = moveFraction(shown, event.key, event.shiftKey, orientation, limits);
    if (next === null) return;
    event.preventDefault();
    choose(next);
  };

  const onPointerDown = (event: PointerEvent) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (dragging.current) setPreferred(fromPointer(event));
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    choose(fromPointer(event));
  };

  return (
    <div
      ref={rootRef}
      className={className ? `split ${className}` : "split"}
      data-orientation={orientation}
      style={{ "--split": `${shown * 100}%` } as CSSProperties}
    >
      <div className="split-pane">{first}</div>
      <div
        className="split-divider"
        role="separator"
        aria-orientation={orientation}
        aria-label={label}
        aria-valuenow={Math.round(shown * 100)}
        aria-valuemin={Math.round(limits.min * 100)}
        aria-valuemax={Math.round(limits.max * 100)}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onDoubleClick={() => choose(start)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      />
      <div className="split-pane">{second}</div>
    </div>
  );
}
