"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TOUR_EVENT, TOUR_STEPS, markTourSeen, restoreSnapshot, saveSnapshot, tourSeen, usableSteps, type TourStep } from "@/lib/tour";
import { findAnchor } from "./anchor";
import { TourSpotlight } from "./TourSpotlight";

// Waits for the hero's words to arrive before the first visit's tour begins.
const AUTO_START_MS = 1200;

// Lives in the layout, so the tour carries on from the home page into a chapter and its session.
export function TourLauncher({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const running = steps !== null;

  const start = useCallback(() => {
    saveSnapshot(courseId);
    setSteps(usableSteps(TOUR_STEPS, "/", (anchor) => findAnchor(anchor) !== null));
  }, [courseId]);

  const close = useCallback(() => {
    restoreSnapshot(courseId);
    markTourSeen();
    setSteps(null);
  }, [courseId]);

  // A reload in the middle of the tour leaves the pages it opened in the visitor's progress, so put that back.
  useEffect(() => {
    restoreSnapshot(courseId);
  }, [courseId]);

  useEffect(() => {
    if (running || pathname !== "/") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (window.location.hash === "#tour") {
      // Arrived from the Tour button on another page.
      history.replaceState(null, "", window.location.pathname + window.location.search);
      timer = setTimeout(start, 600);
    } else if (!tourSeen()) {
      timer = setTimeout(() => {
        if (!document.querySelector("dialog[open]")) start();
      }, AUTO_START_MS);
    }
    window.addEventListener(TOUR_EVENT, start);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(TOUR_EVENT, start);
    };
  }, [pathname, running, start]);

  if (!steps) return null;
  return <TourSpotlight steps={steps} onClose={close} />;
}
