"use client";

import Link from "next/link";
import { useState } from "react";
import { PlantMark } from "@/components/home/Icon";
import { SearchBox } from "@/components/SearchBox";
import type { CourseNav } from "@/lib/nav";
import type { SearchHit } from "@/lib/types";
import { CourseDrawer } from "./CourseDrawer";
import { ThemeToggle } from "./ThemeToggle";

// `flat` sits on a green field the page already paints; `canopy` paints its own and stays pinned on wide screens.
export function TopBar({ courseId, title, hits, nav, where, tone = "canopy" }: { courseId: string; title: string; hits: SearchHit[]; nav: CourseNav; where?: string; tone?: "canopy" | "flat" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`gh-topbar${tone === "flat" ? " is-flat" : ""}`}>
      <nav className="gh-nav" aria-label="Main">
        <Link className="gh-brand" href="/">
          <PlantMark />
          <span>{title}</span>
        </Link>
        {where && <span className="gh-where">{where}</span>}
        <div className="gh-nav-links">
          <Link href="/glossary">Glossary</Link>
        </div>
        <span className="gh-nav-spacer" />
        <div className="gh-nav-search">
          <SearchBox hits={hits} id="nav-q" />
        </div>
        <ThemeToggle />
        <button type="button" className="gh-pill" onClick={() => setOpen(true)}>Course</button>
      </nav>
      <CourseDrawer open={open} onClose={() => setOpen(false)} courseId={courseId} nav={nav} hits={hits} />
    </div>
  );
}
