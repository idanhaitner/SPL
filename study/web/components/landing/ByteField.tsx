"use client";

import { useEffect, useRef } from "react";

const CELL_W = 8;
const CELL_H = 16;

function noise(x: number, y: number) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function smooth(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const top = noise(ix, iy) * (1 - ux) + noise(ix + 1, iy) * ux;
  const bottom = noise(ix, iy + 1) * (1 - ux) + noise(ix + 1, iy + 1) * ux;
  return top * (1 - uy) + bottom * uy;
}

function bytesOf(source: string) {
  return Array.from(source, (char) => char.charCodeAt(0).toString(16).padStart(2, "0")).join("");
}

// A still dump of `source`: its bytes in hex, with its lines readable among them.
export function ByteField({ source, weight }: { source: string; weight: "hero" | "band" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const hex = bytesOf(source);
    const lines = source.split("\n").map((line) => line.trim()).filter(Boolean);
    const styles = getComputedStyle(canvas);
    const tints = ["--color-glyph-1", "--color-glyph-2", "--color-glyph-3", "--color-glyph-4"].map((name) =>
      styles.getPropertyValue(name).trim(),
    );

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.clearRect(0, 0, width, height);
      context.font = `11px ${styles.getPropertyValue("--font-outlier")}`;
      context.textBaseline = "top";
      const columns = Math.ceil(width / CELL_W);
      const rows = Math.ceil(height / CELL_H);
      const readable = new Map<string, string>();
      lines.forEach((line, index) => {
        const row = 1 + index * 2;
        const start = Math.floor(columns * (weight === "hero" ? 0.48 + (index % 3) * 0.14 : 0.62 + (index % 2) * 0.05));
        Array.from(line).forEach((char, offset) => readable.set(`${row}:${start + offset}`, char));
      });
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const u = column / columns;
          const v = row / rows;
          const shape =
            weight === "hero"
              ? Math.max(0, Math.min(1, (u - 0.42) * 3)) * Math.max(0, Math.min(1, 1 - v * 1.7))
              : Math.max(0, Math.min(1, (u - 0.58) * 3));
          const char = readable.get(`${row}:${column}`);
          if (char !== undefined && shape > 0) {
            context.fillStyle = tints[tints.length - 1];
            context.fillText(char, column * CELL_W, row * CELL_H);
            continue;
          }
          const value = smooth(column * 0.09, row * 0.2) * 0.75 + smooth(column * 0.31, row * 0.5) * 0.25;
          const level = value * shape * 1.45 - 0.36;
          if (level <= 0) continue;
          context.fillStyle = tints[Math.min(tints.length - 1, Math.floor(level * tints.length))];
          context.fillText(hex[(row * columns + column) % hex.length], column * CELL_W, row * CELL_H);
        }
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [source, weight]);

  return <canvas ref={canvasRef} className="byte-field" aria-hidden="true" />;
}
