"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Mixed } from "@/lib/bidi";
import { loadSearchIndex, matchHits } from "@/lib/search";
import type { SearchHit } from "@/lib/types";

const KINDS: Record<string, string> = {
  Chapter: "Chapter",
  Practice: "Practice",
  Worked: "Example",
  Glossary: "Term",
};

const NO_RESULTS = "No results. Try a shorter word, or browse the course.";
const LOAD_FAILED = "Search couldn't load. Check your connection and try again.";

// A combobox: focus stays in the input, and the arrows move a highlighted option in the list.
export function SearchBox({ id = "q" }: { id?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const hasQuery = query.trim() !== "";
  const matches = hits ? matchHits(hits, query) : [];
  const listId = `${id}-results`;
  const optionId = (index: number) => `${id}-result-${index}`;
  const showList = open && matches.length > 0;

  let message = "";
  if (failed) message = LOAD_FAILED;
  else if (hasQuery && !hits) message = "Loading search…";
  else if (hasQuery && matches.length === 0) message = NO_RESULTS;

  function load() {
    if (hits) return;
    setFailed(false);
    loadSearchIndex().then(setHits, () => setFailed(true));
  }

  function close() {
    setOpen(false);
    setActive(-1);
  }

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) close();
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  useEffect(() => {
    if (active < 0) return;
    list.current?.querySelector(`[aria-selected="true"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      // Only an open panel takes the key. Otherwise it still closes the course drawer.
      if (!open || (!showList && !message)) return;
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (matches.length === 0) return;
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setOpen(true);
      setActive((current) => {
        if (current < 0) return step > 0 ? 0 : matches.length - 1;
        return (current + step + matches.length) % matches.length;
      });
    } else if (event.key === "Enter") {
      const target = showList ? matches[Math.max(active, 0)] : undefined;
      if (!target) return;
      event.preventDefault();
      close();
      router.push(target.href);
    }
  }

  return (
    <div
      className="search"
      ref={box}
      onBlur={(event) => {
        if (!box.current?.contains(event.relatedTarget)) close();
      }}
    >
      <label className="sr-only" htmlFor={id}>Search the course</label>
      <input
        id={id}
        type="search"
        role="combobox"
        placeholder="Search"
        value={query}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(-1);
          if (!hits && !failed) load();
        }}
        onFocus={() => {
          setOpen(true);
          load();
        }}
        onKeyDown={onKeyDown}
      />
      <span className="sr-only" role="status">
        {open && !failed && (message || (hasQuery ? `${matches.length} results` : ""))}
      </span>
      {open && message && (
        <div className="search-results">
          <p role={failed ? "alert" : undefined}>{message}</p>
        </div>
      )}
      {showList && !message && (
        // Pressing on a result must not move focus first, or the list would close before the click lands.
        <div className="search-results" id={listId} role="listbox" aria-label="Search results" ref={list} onMouseDown={(event) => event.preventDefault()}>
          {matches.map((hit, index) => (
            <Link key={hit.href + hit.title} id={optionId(index)} href={hit.href} role="option" aria-selected={index === active} tabIndex={-1} onClick={close}>
              <span>{KINDS[hit.kind] ?? hit.kind}</span>
              <div><Mixed text={hit.title} /></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
