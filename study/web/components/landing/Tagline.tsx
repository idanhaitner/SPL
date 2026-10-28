"use client";

import { useEffect, useRef, useState } from "react";

export function Tagline({ lines }: { lines: string[] }) {
  const root = useRef<HTMLParagraphElement>(null);
  const words = lines.map((line) => line.split(" "));
  const total = words.reduce((sum, line) => sum + line.length, 0);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLit(total);
      return;
    }
    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = node.getBoundingClientRect();
      const trigger = window.innerHeight * 0.72;
      const progress = (trigger - box.top) / Math.max(box.height, 1);
      setLit(Math.max(0, Math.min(total, Math.round(progress * total))));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [total]);

  let count = 0;
  return (
    <p className="tagline" ref={root}>
      <span className="sr-only">{lines.join(" ")}</span>
      {words.map((line, row) => (
        <span className="tagline-line" key={row} aria-hidden="true">
          {line.map((word, i) => {
            const on = count++ < lit;
            return (
              <span key={i} className={on ? "is-lit" : undefined}>
                {word}{i < line.length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      ))}
    </p>
  );
}
