"use client";

import { useEffect, useRef } from "react";

type Mote = { x: number; y: number; r: number; drift: number; phase: number; rise: number; pushX: number; pushY: number };

const MOTES = 34;

// The air in the glasshouse: a soft light that leans toward the pointer, and specks of pollen the pointer stirs.
// Decoration only, so it stays off under reduced motion and stops whenever the hero is off screen.
export function HeroAir() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sun = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const field = element?.parentElement;
    const context = element?.getContext("2d");
    if (!element || !field || !context || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let width = 0;
    let height = 0;
    const resize = () => {
      width = field.clientWidth;
      height = field.clientHeight;
      const scale = Math.min(devicePixelRatio || 1, 1.5);
      element.width = width * scale;
      element.height = height * scale;
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };
    resize();
    const sizing = new ResizeObserver(resize);
    sizing.observe(field);

    const motes: Mote[] = Array.from({ length: MOTES }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.8 + Math.random() * 1.8,
      drift: 8 + Math.random() * 18,
      phase: Math.random() * Math.PI * 2,
      rise: 5 + Math.random() * 11,
      pushX: 0,
      pushY: 0,
    }));

    const pointer = { x: width * 0.72, y: height * 0.3, lastX: 0, lastY: 0, seen: false };
    const light = { x: pointer.x, y: pointer.y };
    let visible = true;
    let frame = 0;
    let then = performance.now();

    const draw = (now: number) => {
      const seconds = Math.min((now - then) / 1000, 0.05);
      then = now;
      context.clearRect(0, 0, width, height);
      for (const mote of motes) {
        mote.pushX *= 1 - 1.8 * seconds;
        mote.pushY *= 1 - 1.8 * seconds;
        mote.y -= (mote.rise - mote.pushY) * seconds;
        mote.x += (Math.sin(now / 2600 + mote.phase) * mote.drift * 0.4 + mote.pushX) * seconds;
        if (mote.y < -8) mote.y = height + 8;
        if (mote.x < -8) mote.x = width + 8;
        if (mote.x > width + 8) mote.x = -8;
        // Pollen only shows inside the light of the arches, on the right of the hero.
        const lit = Math.min(1, Math.max(0, (mote.x / width - 0.42) * 5));
        context.globalAlpha = lit * (0.22 + 0.34 * (0.5 + 0.5 * Math.sin(now / 1300 + mote.phase * 3)));
        context.fillStyle = "#EEF8C9";
        context.beginPath();
        context.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
        context.fill();
      }
      light.x += (pointer.x - light.x) * Math.min(1, seconds * 1.6);
      light.y += (pointer.y - light.y) * Math.min(1, seconds * 1.6);
      if (sun.current) sun.current.style.transform = `translate3d(${light.x.toFixed(1)}px, ${light.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      frame = visible ? requestAnimationFrame(draw) : 0;
    };
    frame = requestAnimationFrame(draw);

    const resume = () => {
      if (visible && !document.hidden && !frame) {
        then = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    watcher.observe(field);
    document.addEventListener("visibilitychange", resume);

    const move = (event: PointerEvent) => {
      const box = field.getBoundingClientRect();
      const [x, y] = [event.clientX - box.left, event.clientY - box.top];
      if (pointer.seen) {
        const [dx, dy] = [x - pointer.lastX, y - pointer.lastY];
        for (const mote of motes) {
          const distance = Math.hypot(mote.x - x, mote.y - y);
          if (distance > 150) continue;
          const force = (1 - distance / 150) * 2.2;
          mote.pushX = Math.max(-90, Math.min(90, mote.pushX + dx * force));
          mote.pushY = Math.max(-90, Math.min(90, mote.pushY + dy * force));
        }
      }
      pointer.x = x;
      pointer.y = y;
      pointer.lastX = x;
      pointer.lastY = y;
      pointer.seen = true;
    };
    field.addEventListener("pointermove", move, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      visible = false;
      sizing.disconnect();
      watcher.disconnect();
      document.removeEventListener("visibilitychange", resume);
      field.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <>
      <div ref={sun} className="gh-sun" aria-hidden="true" />
      <canvas ref={canvas} className="gh-air" aria-hidden="true" />
    </>
  );
}
