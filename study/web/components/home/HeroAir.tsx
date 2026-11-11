"use client";

import { useEffect, useRef } from "react";

type Mote = { x: number; y: number; r: number; drift: number; phase: number; rise: number; pushX: number; pushY: number };

const MOTES = 34;
const PETALS = 18;
const FIREFLIES = 14;
const PETAL_COLORS = ["#E27C98", "#F3A6BA", "#FFFDF5", "#FFD97A"];

type Petal = { x: number; y: number; size: number; fall: number; sway: number; phase: number; spin: number; tumble: number; angle: number; color: string; alpha: number; pushX: number; pushY: number };
type Firefly = { x: number; y: number; reach: number; speed: number; phase: number; blink: number };

// A soft round glow, drawn once and stamped for every firefly, so a frame costs a few drawImage calls and no gradients.
function glowSprite() {
  const size = 48;
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = size;
  const paint = sprite.getContext("2d");
  if (paint) {
    const fill = paint.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    fill.addColorStop(0, "rgba(255, 244, 190, 1)");
    fill.addColorStop(0.18, "rgba(255, 226, 130, 0.65)");
    fill.addColorStop(1, "rgba(255, 214, 110, 0)");
    paint.fillStyle = fill;
    paint.fillRect(0, 0, size, size);
  }
  return sprite;
}

// The air in the glasshouse: light shafts through the arches, a soft light that leans toward the pointer, pollen and blossom petals the pointer stirs, and fireflies.
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

    const petals: Petal[] = Array.from({ length: PETALS }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 4.5 + Math.random() * 4.5,
      fall: 14 + Math.random() * 20,
      sway: 14 + Math.random() * 22,
      phase: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 1.6,
      tumble: 0.9 + Math.random() * 1.3,
      angle: Math.random() * Math.PI * 2,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      alpha: 0.5 + Math.random() * 0.3,
      pushX: 0,
      pushY: 0,
    }));
    const fireflies: Firefly[] = Array.from({ length: FIREFLIES }, () => ({
      x: Math.random() * width,
      y: height * (0.3 + Math.random() * 0.65),
      reach: 18 + Math.random() * 34,
      speed: 0.18 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      blink: 0.5 + Math.random() * 0.7,
    }));
    const glow = glowSprite();

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
      // Petals tumble down on a slow wind: each one flips edge-on as it turns, so it reads as a petal and not a dot.
      for (const petal of petals) {
        petal.pushX *= 1 - 1.4 * seconds;
        petal.pushY *= 1 - 1.4 * seconds;
        petal.y += (petal.fall + petal.pushY * 0.6) * seconds;
        petal.x += (Math.sin(now / 2100 + petal.phase) * petal.sway + 10 + petal.pushX) * seconds;
        petal.angle += petal.spin * seconds;
        if (petal.y > height + 12) {
          petal.y = -12;
          petal.x = Math.random() * width;
        }
        if (petal.x > width + 12) petal.x = -12;
        if (petal.x < -12) petal.x = width + 12;
        const flip = Math.cos(now / 1000 * petal.tumble + petal.phase);
        context.save();
        context.translate(petal.x, petal.y);
        context.rotate(petal.angle);
        context.globalAlpha = petal.alpha;
        context.fillStyle = petal.color;
        context.beginPath();
        context.ellipse(0, 0, petal.size, Math.max(0.6, petal.size * 0.55 * Math.abs(flip)), 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
      // Fireflies wander in slow loops and blink on their own beat.
      for (const fly of fireflies) {
        const t = now / 1000 * fly.speed + fly.phase;
        const x = fly.x + Math.sin(t * 1.3) * fly.reach;
        const y = fly.y + Math.cos(t * 0.9) * fly.reach * 0.6;
        const blink = Math.max(0, Math.sin(now / 1000 * fly.blink + fly.phase * 2));
        context.globalAlpha = blink * blink * 0.9;
        const span = 20 + blink * 14;
        context.drawImage(glow, x - span / 2, y - span / 2, span, span);
      }
      context.globalAlpha = 1;
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
        for (const mote of [...motes, ...petals]) {
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
      <div className="gh-beams" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div ref={sun} className="gh-sun" aria-hidden="true" />
      <canvas ref={canvas} className="gh-air" aria-hidden="true" />
    </>
  );
}
