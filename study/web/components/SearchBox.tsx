"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Mixed } from "@/lib/bidi";
import type { SearchHit } from "@/lib/types";

const KINDS: Record<string, string> = {
  Chapter: "Chapter",
  Practice: "Practice",
  Glossary: "Term",
};

export function SearchBox({ hits }: { hits: SearchHit[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? hits.filter((hit) => `${hit.title} ${hit.text}`.toLowerCase().includes(needle)).slice(0, 8)
    : [];

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  return (
    <div className="search" ref={box}>
      <label className="sr-only" htmlFor="q">Search the course</label>
      <input
        id="q"
        type="search"
        placeholder="Search"
        value={query}
        autoComplete="off"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && needle && (
        <div className="search-results">
          {matches.length === 0 && <p>No results.</p>}
          {matches.map((hit) => (
            <Link key={hit.href + hit.title} href={hit.href} onClick={() => setOpen(false)}>
              <span>{KINDS[hit.kind] ?? hit.kind}</span>
              <Mixed text={hit.title} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
