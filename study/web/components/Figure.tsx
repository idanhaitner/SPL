import { readFileSync } from "node:fs";
import path from "node:path";

// Text in a figure must not render smaller than this on a phone.
const MIN_TEXT_PX = 11;

function attribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function prepare(file: string, alt: string) {
  const svg = readFileSync(path.join(process.cwd(), "public", "figures", file), "utf8");
  // Every figure shares one page once inlined, so an id or a style block would leak into the others.
  if (/\sid="|<style\b/.test(svg)) throw new Error(`${file}: figures must not carry ids or style blocks`);
  const viewBox = svg.match(/viewBox="[\d.-]+ [\d.-]+ ([\d.]+) [\d.]+"/);
  if (!viewBox) throw new Error(`${file}: figure has no viewBox`);
  const smallest = Math.min(...[...svg.matchAll(/font-size="([\d.]+)"/g)].map((match) => Number(match[1])));
  const minWidth = Number.isFinite(smallest) ? Math.ceil((MIN_TEXT_PX * Number(viewBox[1])) / smallest) : 0;
  const html = svg.replace(/<svg\b[^>]*>/, (root) =>
    root
      .replace(/\s(width|height)="[^"]*"/g, "")
      .replace(/>$/, ` role="img" aria-label="${attribute(alt)}">`),
  );
  return { html, minWidth };
}

export function Figure({ src, alt }: { src: string; alt: string }) {
  const file = path.basename(src);
  const { html, minWidth } = prepare(file, alt);
  const name = file.replace(/\.svg$/, "").replace(/-/g, " ");
  return (
    <figure className="figure" data-figure={file}>
      <div
        className="figure-panel"
        role="region"
        aria-label={`Diagram: ${name}`}
        tabIndex={0}
        style={{ "--figure-min": `${minWidth}px` } as React.CSSProperties}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {alt ? <figcaption>{alt}</figcaption> : null}
    </figure>
  );
}
