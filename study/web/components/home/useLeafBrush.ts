import { useEffect, type RefObject } from "react";

const REACH = 170;
const STIFFNESS = 70;
const DAMPING = 7;
const LIMIT = 20;

// Moving the pointer through the plant pushes the leaves it passes, and they spring back.
// It also marks the green field `is-away` while off screen, so CSS loops pause there.
export function useLeafBrush(ref: RefObject<SVGSVGElement | null>) {
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const field = svg.closest<HTMLElement>("header") ?? svg.parentElement;
    if (!field) return;

    const watcher = new IntersectionObserver(([entry]) => field.classList.toggle("is-away", !entry.isIntersecting));
    watcher.observe(field);

    const stop = () => watcher.disconnect();
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return stop;

    const leaves = [...svg.querySelectorAll<SVGGElement>(".gh-leaf")].map((element) => {
      const radians = (Number(element.dataset.angle) * Math.PI) / 180;
      const [dx, dy] = [Math.cos(radians), Math.sin(radians)];
      return {
        brush: element.querySelector<SVGGElement>(".gh-leaf-brush"),
        x: Number(element.dataset.x) + dx * 45,
        y: Number(element.dataset.y) + dy * 45,
        dx,
        dy,
        turn: 0,
        spin: 0,
      };
    });

    let last: DOMPoint | null = null;
    let frame = 0;
    let then = 0;

    const step = (now: number) => {
      const seconds = Math.min((now - then) / 1000, 1 / 30);
      then = now;
      let moving = false;
      for (const leaf of leaves) {
        leaf.spin += (-STIFFNESS * leaf.turn - DAMPING * leaf.spin) * seconds;
        leaf.turn = Math.max(-LIMIT, Math.min(LIMIT, leaf.turn + leaf.spin * seconds));
        const resting = Math.abs(leaf.turn) < 0.03 && Math.abs(leaf.spin) < 0.1;
        if (resting) {
          leaf.turn = 0;
          leaf.spin = 0;
        } else {
          moving = true;
        }
        if (leaf.brush) leaf.brush.style.transform = resting ? "" : `rotate(${leaf.turn.toFixed(2)}deg)`;
      }
      frame = moving ? requestAnimationFrame(step) : 0;
    };

    const move = (event: PointerEvent) => {
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      if (last) {
        const [mx, my] = [point.x - last.x, point.y - last.y];
        for (const leaf of leaves) {
          const distance = Math.hypot(point.x - leaf.x, point.y - leaf.y);
          if (distance > REACH) continue;
          const falloff = (1 - distance / REACH) ** 2;
          leaf.spin = Math.max(-140, Math.min(140, leaf.spin + (leaf.dx * my - leaf.dy * mx) * falloff * 2.4));
        }
        if (!frame) {
          then = performance.now();
          frame = requestAnimationFrame(step);
        }
      }
      last = point;
    };
    const leave = () => {
      last = null;
    };

    field.addEventListener("pointermove", move, { passive: true });
    field.addEventListener("pointerleave", leave);
    return () => {
      stop();
      cancelAnimationFrame(frame);
      field.removeEventListener("pointermove", move);
      field.removeEventListener("pointerleave", leave);
    };
  }, [ref]);
}
