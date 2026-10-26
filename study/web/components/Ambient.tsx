"use client";

import { useEffect } from "react";

const SPOT = ".chapter-list a, .continue, .chapter-hop, .glossary-card, .section-pop";

export function Ambient() {
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      const node = event.target.closest<HTMLElement>(SPOT);
      if (!node) return;
      const box = node.getBoundingClientRect();
      node.style.setProperty("--mx", `${event.clientX - box.left}px`);
      node.style.setProperty("--my", `${event.clientY - box.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="ambient" aria-hidden="true">
      <span className="orb orb-a" />
      <span className="orb orb-b" />
      <span className="orb orb-c" />
      <span className="grain" />
    </div>
  );
}
