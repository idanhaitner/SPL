// The first element matching the selector that is actually on screen: a selector can name both a wide and a narrow version of the same thing.
export function findAnchor(selector: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== "hidden") return el;
  }
  return null;
}
