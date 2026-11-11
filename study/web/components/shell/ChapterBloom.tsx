"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import { CourseStem } from "@/components/home/CourseStem";
import { HeroAir } from "@/components/home/HeroAir";
import { Icon } from "@/components/home/Icon";
import { Mixed } from "@/lib/bidi";
import { courseStates, hrefOf, isPassed, lastOpen, leavesOf, nameOf, readProgress, type ChapterInfo } from "@/lib/progress";

type Bloom = { from: number; to: number };

// Long enough to see the answer that finished the chapter marked right before the plant takes over.
const OPEN_AFTER = 600;
// Matches gh-bloom-out in motion.css.
const CLOSE_MS = 220;

function measure(courseId: string, chapters: ChapterInfo[]) {
  const progress = readProgress(courseId);
  return { open: lastOpen(courseStates(chapters, progress)), finished: chapters.every((chapter) => isPassed(chapters, chapter, progress)), openAll: Boolean(progress.openAll) };
}

// Finishing a chapter is the one moment the whole plant comes forward: it fills the screen, the leaf just finished ripens,
// and the stem grows on until the next leaf breaks out of its bud. It lives in the layout, so it outlasts the page change
// that Finish reading starts, and it listens only to progress saved in this tab.
export function ChapterBloom({ courseId, chapters, partStarts }: { courseId: string; chapters: ChapterInfo[]; partStarts: { label: string; num: number }[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [bloom, setBloom] = useState<Bloom | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let before = measure(courseId, chapters);
    let timer = 0;
    const check = () => {
      const now = measure(courseId, chapters);
      // Opening every chapter by choice grows the plant too, but nothing was finished, so there is nothing to celebrate.
      const chose = now.openAll !== before.openAll;
      if (!chose && (now.open > before.open || (now.finished && !before.finished))) {
        const next = { from: Math.max(0, before.open), to: now.open };
        clearTimeout(timer);
        timer = window.setTimeout(() => setBloom(next), OPEN_AFTER);
      }
      before = now;
    };
    window.addEventListener("study-progress", check);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("study-progress", check);
    };
  }, [courseId, chapters]);

  useEffect(() => {
    const node = dialog.current;
    if (bloom && node && !node.open) node.showModal();
  }, [bloom]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => {
      dialog.current?.close();
      setLeaving(false);
      setBloom(null);
    }, CLOSE_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  const finishedChapter = bloom ? chapters[bloom.from] : null;
  const opened = bloom && bloom.to > bloom.from ? chapters[bloom.to] : null;
  const words = opened ? ["Your", "plant", "grew."] : ["Your", "plant", "is", "in", "flower."];

  return (
    <dialog
      ref={dialog}
      className={`gh-bloom${leaving ? " is-leaving" : ""}`}
      aria-labelledby="bloom-title"
      onCancel={(event) => {
        event.preventDefault();
        setLeaving(true);
      }}
      onClose={() => setBloom(null)}
    >
      {bloom && finishedChapter && (
        <>
          <div className="gh-arch gh-arch-1" />
          <div className="gh-arch gh-arch-2" />
          <HeroAir />
          <div className="gh-frame">
            <button type="button" className="gh-pill gh-round gh-bloom-close" onClick={() => setLeaving(true)} aria-label="Close">
              <Icon name="x" />
            </button>
            <div className="gh-bloom-copy">
              <p className="gh-bloom-kicker">{nameOf(finishedChapter)} finished</p>
              <h2 id="bloom-title">
                {words.map((word, index) => (
                  <Fragment key={index}>
                    <span className="gh-word"><span style={{ "--w": index } as CSSProperties}>{index === words.length - 1 ? <em>{word}</em> : word}</span></span>{" "}
                  </Fragment>
                ))}
              </h2>
              <p className="gh-bloom-lede">
                {opened ? (
                  opened.kind === "bridge" ? (
                    <>You finished <Mixed text={finishedChapter.title} />. A look back at the last chapters, <Mixed text={opened.title} />, is open now.</>
                  ) : (
                    <>You finished <Mixed text={finishedChapter.title} />. Chapter {opened.num}, <Mixed text={opened.title} />, is open now.</>
                  )
                ) : (
                  <>You finished all {leavesOf(chapters).length} chapters. Every leaf on the stem is grown.</>
                )}
              </p>
            </div>
            <div className="gh-bloom-action">
              {opened ? (
                <Link className="gh-btn" href={hrefOf(opened)} onClick={() => dialog.current?.close()}>
                  {opened.kind === "bridge" ? "Open the review" : `Open chapter ${opened.num}`}
                  <Icon name="arrow" />
                </Link>
              ) : (
                <Link className="gh-btn" href="/" onClick={() => dialog.current?.close()}>
                  Back to the course
                  <Icon name="arrow" />
                </Link>
              )}
            </div>
            <CourseStem courseId={courseId} chapters={chapters} partStarts={partStarts} name="bloom" since={Math.max(0, leavesOf(chapters.slice(0, bloom.from + 1)).length - 1)} />
          </div>
        </>
      )}
    </dialog>
  );
}
