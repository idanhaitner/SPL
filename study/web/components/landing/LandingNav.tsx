"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ResumeLink } from "@/components/landing/ResumeLink";
import { SearchBox } from "@/components/SearchBox";
import type { SearchHit } from "@/lib/types";

type Chapter = { id: string; title: string };

const assetBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const LINKS = [
  { href: "#map", label: "Course map" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "Questions" },
  { href: "/glossary", label: "Glossary" },
];

export function LandingNav({
  courseId,
  title,
  chapters,
  hits,
}: {
  courseId: string;
  title: string;
  chapters: Chapter[];
  hits: SearchHit[];
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const sections = LINKS.filter((link) => link.href.startsWith("#"))
      .map((link) => document.querySelector<HTMLElement>(link.href))
      .filter((node): node is HTMLElement => node !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const href = `#${entry.target.id}`;
          if (entry.isIntersecting) setActive(href);
          else setActive((current) => (current === href ? "" : current));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const wide = window.matchMedia("(min-width: 1024px)");
    const onWide = () => {
      if (wide.matches) setOpen(false);
    };
    document.documentElement.classList.add("nav-locked");
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      document.documentElement.classList.remove("nav-locked");
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <header className={`lnav${open ? " is-open" : ""}`}>
      <nav className="lnav-bar" aria-label="Main">
        <Link className="lnav-brand" href="/" aria-current="page" onClick={() => setOpen(false)}>
          <img src={`${assetBase}/icon.svg`} alt="" width="24" height="24" />
          <span>{title}</span>
        </Link>
        <ul className="lnav-links">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} aria-current={active === link.href ? "location" : undefined}>{link.label}</Link>
            </li>
          ))}
        </ul>
        <div className="lnav-search">
          <SearchBox hits={hits} id="lnav-q" />
        </div>
        <ResumeLink compact className="key lnav-cta" courseId={courseId} chapters={chapters} />
        <button
          type="button"
          className="lnav-toggle"
          aria-expanded={open}
          aria-controls="lnav-panel"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </nav>
      <div className="lnav-panel" id="lnav-panel" inert={!open}>
        <div className="lnav-panel-search">
          <SearchBox hits={hits} id="lnav-panel-q" />
        </div>
        <ul>
          {LINKS.map((link, index) => (
            <li key={link.href} style={{ transitionDelay: `${Math.min(index * 60, 400)}ms` }}>
              <Link href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>
            </li>
          ))}
          <li style={{ transitionDelay: `${Math.min(LINKS.length * 60, 400)}ms` }}>
            <ResumeLink className="key key--primary" courseId={courseId} chapters={chapters} />
          </li>
        </ul>
      </div>
    </header>
  );
}
