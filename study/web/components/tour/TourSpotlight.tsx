"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { moveTo, type TourEnter, type TourStep } from "@/lib/tour";
import { findAnchor } from "./anchor";

const PAD = 8;
const GAP = 14;
const CARD_MAX = 380;
// Where the card sits at the bottom of the screen instead of beside what it points at.
const NARROW = 640;
// Long enough for a smooth scroll to land before the hole is measured.
const SETTLE_MS = 450;
const POLL_MS = 120;
// How long to wait for something to appear before the step is left out: longer after a page change or a click.
const WAIT_HERE_MS = 1500;
const WAIT_NEW_MS = 5000;

type Box = { top: number; left: number; width: number; height: number };
type Place = { style: CSSProperties; docked: boolean };

const CENTER: Place = { docked: false, style: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" } };
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Only what is on screen, so a tall element is shown by the part that can be seen.
function boxOf(el: HTMLElement): Box {
  const rect = el.getBoundingClientRect();
  const top = Math.max(PAD, rect.top - PAD);
  const bottom = Math.min(window.innerHeight - PAD, rect.bottom + PAD);
  return { top, left: rect.left - PAD, width: rect.width + PAD * 2, height: Math.max(0, bottom - top) };
}

// Below the element when there is room, else above it, else docked at the bottom of the screen.
function place(box: Box | null, cardHeight: number): Place {
  if (!box) return CENTER;
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (width < NARROW) return { docked: true, style: {} };
  const cardWidth = Math.min(CARD_MAX, width - 32);
  const left = Math.min(Math.max(16, box.left), width - cardWidth - 16);
  if (height - (box.top + box.height) >= cardHeight + GAP + 16) return { docked: false, style: { top: box.top + box.height + GAP, left } };
  if (box.top >= cardHeight + GAP + 16) return { docked: false, style: { top: box.top - GAP - cardHeight, left } };
  return { docked: true, style: {} };
}

// Brings the element into view with room left for the card.
function bringIntoView(el: HTMLElement, cardHeight: number) {
  const rect = el.getBoundingClientRect();
  const height = window.innerHeight;
  const fits = window.innerWidth >= NARROW && rect.height + cardHeight + 2 * (PAD + GAP) + 32 <= height;
  const wanted = fits ? (height - (rect.height + cardHeight + GAP)) / 2 : 24 + PAD;
  window.scrollBy({ top: rect.top - wanted, behavior: reduced() ? "auto" : "smooth" });
}

// The clicks that put the page into the state a step shows. Each reports whether it has done its job yet.
function enterPage(how: TourEnter): boolean {
  if (how === "start-session") {
    const start = document.querySelector<HTMLElement>(".session-intro .gh-btn");
    if (start) start.click();
    return !start;
  }
  const leaves = document.querySelectorAll<HTMLElement>(".step-stem .step-leaf");
  if (leaves.length === 0) return false;
  leaves[leaves.length - 1].click();
  return true;
}

export function TourSpotlight({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [where, setWhere] = useState<Place>(CENTER);
  // True while the page changes or the thing to show has not appeared: the card waits and the page is only dimmed.
  const [waiting, setWaiting] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const direction = useRef(1);
  const step = steps[index];
  const last = index === steps.length - 1;
  const onPage = !step.path || step.path === pathname;

  const go = useCallback(
    (delta: number) => {
      direction.current = delta;
      const next = moveTo(index, delta, steps.length);
      if (next === index) return;
      const target = steps[next].path;
      if (target && target !== pathname) router.push(target);
      setIndex(next);
    },
    [index, steps, pathname, router],
  );

  // Moves to the step's element once it exists, and keeps the hole on it through scrolling and resizing.
  useEffect(() => {
    if (!onPage) {
      setWaiting(true);
      return;
    }
    const anchor = step.anchor;
    if (!anchor) {
      setBox(null);
      setWhere(CENTER);
      setWaiting(false);
      return;
    }
    const measure = () => {
      const el = findAnchor(anchor);
      const next = el ? boxOf(el) : null;
      setBox(next);
      setWhere(place(next, card.current?.offsetHeight ?? 220));
    };
    let timers: ReturnType<typeof setTimeout>[] = [];
    let poll: ReturnType<typeof setInterval> | undefined;
    const started = Date.now();
    const limit = step.enter || step.path !== steps[Math.max(0, index - 1)].path ? WAIT_NEW_MS : WAIT_HERE_MS;
    let entered = !step.enter;
    setWaiting(true);
    const look = () => {
      if (!entered && step.enter) entered = enterPage(step.enter);
      const el = entered ? findAnchor(anchor) : null;
      if (el) {
        clearInterval(poll);
        setWaiting(false);
        bringIntoView(el, card.current?.offsetHeight ?? 220);
        measure();
        timers = [setTimeout(measure, SETTLE_MS), setTimeout(measure, SETTLE_MS * 2)];
        window.addEventListener("scroll", measure, { passive: true });
        window.addEventListener("resize", measure);
      } else if (Date.now() - started > limit) {
        // It is not on this page (a check card on a lesson without one, or a session already under way), so leave the step out.
        clearInterval(poll);
        if (direction.current < 0 && index === 0) return;
        if (index + direction.current < 0 || index + direction.current >= steps.length) return onClose();
        go(direction.current);
      }
    };
    poll = setInterval(look, POLL_MS);
    look();
    return () => {
      clearInterval(poll);
      timers.forEach(clearTimeout);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
    // The step is what matters; `go` and `steps` change with it.
  }, [index, onPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // The card is announced when it arrives on each step.
  useEffect(() => {
    if (!waiting) card.current?.focus({ preventScroll: true });
  }, [index, waiting]);

  // Hands focus back to whatever had it before the tour started.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    return () => before?.focus?.({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // Tab stays on the card.
  function trap(event: React.KeyboardEvent) {
    if (event.key !== "Tab" || !card.current) return;
    const stops = [...card.current.querySelectorAll<HTMLElement>("button:not([disabled])")];
    if (stops.length === 0) return;
    const first = stops[0];
    const end = stops[stops.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === card.current)) {
      event.preventDefault();
      end.focus();
    } else if (!event.shiftKey && active === end) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="tour">
      <div className="tour-block" />
      {box && !waiting ? <div className="tour-hole" style={{ top: box.top, left: box.left, width: box.width, height: box.height }} /> : <div className="tour-dim" />}
      {!waiting && (
        <div
          ref={card}
          className={`tour-card${where.docked ? " is-docked" : ""}`}
          style={where.style}
          role="dialog"
          aria-labelledby="tour-title"
          aria-describedby="tour-body"
          tabIndex={-1}
          onKeyDown={trap}
        >
          <p className="tour-count">{index + 1} of {steps.length}</p>
          <h2 id="tour-title">{step.title}</h2>
          <p id="tour-body">{step.body}</p>
          <div className="tour-actions">
            {!last && <button type="button" className="tour-skip" onClick={onClose}>Skip tour</button>}
            <span className="tour-gap" />
            {index > 0 && <button type="button" className="tour-back" onClick={() => go(-1)}>Back</button>}
            <button type="button" className="tour-next" onClick={() => (last ? onClose() : go(1))}>{last ? "Done" : index === 0 ? "Start" : "Next"}</button>
          </div>
        </div>
      )}
      {waiting && <p className="tour-wait" role="status">Loading the tour…</p>}
    </div>
  );
}
