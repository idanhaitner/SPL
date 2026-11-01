import type { SearchHit } from "./types";

const MAX_RESULTS = 8;

// Invisible direction marks would otherwise split a Hebrew word in two.
const BIDI_MARKS = /[؜‎‏‪-‮⁦-⁩]/g;

function normalize(text: string) {
  return text.replace(BIDI_MARKS, "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function matchHits(hits: SearchHit[], query: string): SearchHit[] {
  const needle = normalize(query);
  if (!needle) return [];
  const ranked: { hit: SearchHit; rank: number }[] = [];
  for (const hit of hits) {
    const inTitle = normalize(hit.title).includes(needle);
    if (!inTitle && !normalize(hit.text).includes(needle)) continue;
    // Titles first; within each, a whole chapter before a single question or term.
    ranked.push({ hit, rank: (inTitle ? 0 : 2) + (hit.kind === "Chapter" ? 0 : 1) });
  }
  return ranked
    .sort((a, b) => a.rank - b.rank)
    .slice(0, MAX_RESULTS)
    .map((item) => item.hit);
}

let index: Promise<SearchHit[]> | null = null;

async function fetchIndex(): Promise<SearchHit[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/search.json`);
  if (!response.ok) throw new Error(`search.json answered ${response.status}`);
  const hits: unknown = await response.json();
  if (!Array.isArray(hits)) throw new Error("search.json is not a list");
  return hits as SearchHit[];
}

// Shared by every search box on the page. A failure is not kept, so the next call tries again.
export function loadSearchIndex(): Promise<SearchHit[]> {
  index ??= fetchIndex().catch((error) => {
    index = null;
    throw error;
  });
  return index;
}
