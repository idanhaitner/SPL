"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/home/Icon";
import { findFunctions, SUGGESTIONS, type CppFunction } from "@/lib/cpp-reference";

// A lens with a leaf in it: look something up, in the plant's own language.
function FinderMark() {
  return (
    <svg className="finder-mark" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.75" fill="none" strokeWidth="2" />
      <path d="M15.6 15.6 20.5 20.5" fill="none" strokeWidth="2.6" strokeLinecap="round" />
      <path className="finder-mark-leaf" d="M7.6 13.4c-.5-3.3 1.6-5.7 5.2-5.6.2 3.6-2 5.9-5.2 5.6Z" />
    </svg>
  );
}

function Card({ entry }: { entry: CppFunction }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(entry.example);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard access can be refused; the example stays on screen to select by hand.
    }
  };
  return (
    <article className="finder-card">
      <div className="finder-card-head">
        <code className="finder-name">{entry.name}</code>
        <span className="finder-header">{entry.header === "built in" ? "built in" : `#include ${entry.header}`}</span>
      </div>
      <p>{entry.does}</p>
      <code className="finder-signature">{entry.signature}</code>
      <div className="finder-example">
        <pre><code>{entry.example}</code></pre>
        <button type="button" className="finder-copy" onClick={copy} aria-label={`Copy the example for ${entry.name}`}>{copied ? "Copied" : "Copy"}</button>
      </div>
    </article>
  );
}

// A floating button on the coding steps that opens a small finder: describe what you need, get the C++ function for it.
export function FunctionFinder() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => findFunctions(query), [query]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    // A click anywhere else puts it away, like any popover.
    const away = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };

  return (
    <div className="finder">
      {open && (
        <div
          ref={panel}
          className="finder-panel"
          role="dialog"
          aria-label="Find a C++ function"
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.stopPropagation();
            close();
          }}
        >
          <div className="finder-head">
            <span className="finder-badge"><FinderMark /></span>
            <div>
              <p className="finder-title">Function finder</p>
              <p className="finder-sub">Say what you need to do, in plain words.</p>
            </div>
            <button type="button" className="finder-close" onClick={close} aria-label="Close the function finder"><Icon name="x" /></button>
          </div>
          <input
            ref={input}
            className="finder-input"
            type="search"
            placeholder="copy a string, length of an array…"
            aria-label="What do you need to do?"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="finder-body" aria-live="polite">
            {query.trim() === "" ? (
              <div className="finder-chips">
                <p>Try</p>
                {SUGGESTIONS.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => { setQuery(suggestion); input.current?.focus(); }}>{suggestion}</button>
                ))}
              </div>
            ) : results.length === 0 ? (
              <p className="finder-empty">Nothing here for &ldquo;{query}&rdquo;. Try a plainer word, like copy, length, compare, or print.</p>
            ) : (
              <ol className="finder-results">
                {results.map((entry) => <li key={entry.name}><Card entry={entry} /></li>)}
              </ol>
            )}
          </div>
          <p className="finder-foot">A built-in C++17 reference. It runs in this page and sends nothing anywhere.</p>
        </div>
      )}
      <button
        ref={button}
        type="button"
        className="finder-button"
        aria-expanded={open}
        aria-label={open ? "Close the function finder" : "Find a C++ function"}
        title="Find a C++ function"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <FinderMark />
      </button>
    </div>
  );
}
