"use client";

import { setOpenAll, useProgress } from "@/lib/progress";

// Some students want to skip ahead. The course still suggests an order; this only stops it from being enforced.
export function OpenAllSwitch({ courseId }: { courseId: string }) {
  const on = Boolean(useProgress(courseId).openAll);
  return (
    <label className="gh-switch">
      <input type="checkbox" role="switch" checked={on} onChange={(event) => setOpenAll(courseId, event.target.checked)} aria-describedby="open-all-hint" />
      <span className="gh-switch-track" aria-hidden="true" />
      <span className="gh-switch-text">
        <span>Open every chapter</span>
        <span id="open-all-hint" className="gh-switch-hint">Skip the order. Your progress is kept either way.</span>
      </span>
    </label>
  );
}
