"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CourseMap } from "@/components/home/CourseMap";
import { Icon } from "@/components/home/Icon";
import { SearchBox } from "@/components/SearchBox";
import type { CourseNav } from "@/lib/nav";

// A native dialog: it keeps focus inside, closes on Esc, and hands focus back to the button that opened it.
export function CourseDrawer({ open, onClose, courseId, nav }: { open: boolean; onClose: () => void; courseId: string; nav: CourseNav }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="gh-drawer"
      aria-label="Course"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
        if ((event.target as HTMLElement).closest("a")) onClose();
      }}
    >
      {open && (
        <>
          <div className="gh-drawer-head">
            <h2>The course</h2>
            <button type="button" className="gh-pill gh-round" onClick={onClose} aria-label="Close the course list">
              <Icon name="x" />
            </button>
          </div>
          <div className="gh-drawer-body">
            <SearchBox id="drawer-q" />
            <div className="gh-drawer-links">
              <Link href="/">Home</Link>
              <Link href="/glossary">Glossary</Link>
            </div>
            <CourseMap courseId={courseId} parts={nav.parts} finale={nav.finale} chapters={nav.chapters} />
          </div>
        </>
      )}
    </dialog>
  );
}
