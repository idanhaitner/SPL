"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/home/Icon";

const THEME_KEY = "study:theme";

export function ThemeToggle() {
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
