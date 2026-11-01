import type { ReactNode } from "react";

export function ResultsPanel({ children }: { children: ReactNode }) {
  return (
    <section className="results-panel" aria-label="Results">
      <h3 className="results-title">Results</h3>
      <div className="results-body" aria-live="polite">{children}</div>
    </section>
  );
}
