import type { ReactNode } from "react";

const HEBREW = /[\u0590-\u05FF]/;
const NUMERIC_CODE = /\d+(?:[-/:]\d+)+/g;

function isLatin(char: string) {
  return /[A-Za-z_]/.test(char);
}

function isDigit(char: string) {
  return /[0-9]/.test(char);
}

// Latin words and the punctuation glued to them (.cpp, C++, foo(a)) must be
// one left-to-right unit. Otherwise an RTL paragraph paints ++C and cpp.
function latinSpans(text: string): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1] ?? "";
    if (((char === "." || char === "#") && isLatin(next)) || isLatin(char)) {
      let start = index;
      if (char === "." || char === "#") index += 1;
      while (start > 0 && /[0-9]/.test(text[start - 1])) start -= 1;
      while (index < text.length) {
        const current = text[index];
        const following = text[index + 1] ?? "";
        if (isLatin(current) || isDigit(current) || current === "_") {
          index += 1;
          continue;
        }
        if (
          (current === "+" || current === "*" || current === ":" || current === "/" || current === "#" || current === ".") &&
          (isLatin(following) || isDigit(following) || following === "+" || following === "*" || following === "_" || following === "." || following === ":")
        ) {
          index += 1;
          continue;
        }
        if ((current === "+" || current === "*") && /[A-Za-z0-9_+*]/.test(text[index - 1] ?? "")) {
          index += 1;
          continue;
        }
        if (current === "(" || current === "[" || current === "<") {
          const close = current === "(" ? ")" : current === "[" ? "]" : ">";
          const end = text.indexOf(close, index + 1);
          if (end > index && end - index < 80 && !HEBREW.test(text.slice(index, end))) {
            index = end + 1;
            continue;
          }
        }
        break;
      }
      spans.push([start, index]);
      continue;
    }
    index += 1;
  }
  for (const match of text.matchAll(NUMERIC_CODE)) {
    const start = match.index ?? 0;
    spans.push([start, start + match[0].length]);
  }
  spans.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: Array<[number, number]> = [];
  for (const span of spans) {
    const previous = merged[merged.length - 1];
    if (!previous) {
      merged.push(span);
      continue;
    }
    if (span[0] <= previous[1]) {
      previous[1] = Math.max(previous[1], span[1]);
      continue;
    }
    const gap = text.slice(previous[1], span[0]);
    // A period starts the next sentence, so "B. avi" stays two words.
    if (/^[\s,+\-*/:=#0-9]*$/.test(gap)) previous[1] = span[1];
    else merged.push(span);
  }
  return merged;
}

export function Mixed({ text }: { text: string }) {
  const spans = latinSpans(text);
  if (spans.length === 0) return text;
  const nodes: ReactNode[] = [];
  let last = 0;
  spans.forEach(([start, end], index) => {
    if (start > last) nodes.push(text.slice(last, start));
    nodes.push(
      <bdi key={index} dir="ltr">
        {text.slice(start, end)}
      </bdi>,
    );
    last = end;
  });
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}
