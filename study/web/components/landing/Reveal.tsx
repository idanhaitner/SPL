"use client";

import { useEffect } from "react";

export function Reveal() {
  useEffect(() => {
    const root = document.querySelector(".landing");
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    nodes.forEach((node) => {
      const box = node.getBoundingClientRect();
      if (box.top < window.innerHeight) node.classList.add("is-in");
      else observer.observe(node);
    });
    root.classList.add("fx-ready");

    const route = root.querySelector<HTMLElement>(".l-parts");
    const parts = Array.from(root.querySelectorAll<HTMLElement>(".l-part"));
    let frame = 0;
    const trace = () => {
      frame = 0;
      if (!route) return;
      const box = route.getBoundingClientRect();
      const line = window.innerHeight * 0.5;
      const fill = Math.max(0, Math.min(1, (line - box.top) / Math.max(box.height, 1)));
      route.style.setProperty("--route", fill.toFixed(4));
      for (const part of parts) {
        const top = part.getBoundingClientRect().top;
        part.classList.toggle("is-reached", top < line);
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(trace);
    };
    trace();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
