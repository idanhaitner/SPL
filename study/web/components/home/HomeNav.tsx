"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SearchBox } from "@/components/SearchBox";
import type { SearchHit } from "@/lib/types";
import { Icon, PlantMark } from "./Icon";

const THEME_KEY = "study:theme";

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const chosen = document.documentElement.dataset.theme;
    setDark(chosen ? chosen === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // The choice just won't be remembered.
    }
  }

  return (
    <button type="button" className="gh-pill gh-round" onClick={toggle} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}

export function HomeNav({ title, hits }: { title: string; hits: SearchHit[] }) {
  return (
    <nav className="gh-nav" aria-label="Main">
      <Link className="gh-brand" href="/" aria-current="page">
        <PlantMark />
        <span>{title}</span>
      </Link>
      <div className="gh-nav-links">
        <a className="gh-nav-course" href="#course">Course</a>
        <Link href="/glossary">Glossary</Link>
      </div>
      <div className="gh-nav-search">
        <SearchBox hits={hits} id="nav-q" />
      </div>
      <ThemeToggle />
    </nav>
  );
}
