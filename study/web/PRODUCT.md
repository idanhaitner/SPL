# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students taking Systems Programming (תכנות מערכות, 202-1-2031) at BGU this term: the site's author and their classmates. They read the chapter that matches the week's lecture, usually in shorter sessions, and come back to practice and review as the exam approaches.

## Product Purpose

An interactive study guide that teaches the course from scratch, in English and in syllabus order: the run-time environment, memory, pointers, C++ ownership, Java, concurrency, networking, the reactor, and persistence. Success means a student can follow the week's lecture, check their understanding on practice drawn from past exams, and know where they stand across the course.

## Positioning

It follows this course's own lecture notes, exercise sessions, and past exams, chapter by chapter, and keeps the course's Hebrew term next to each English one on first use. A generic C++ or Java tutorial cannot match the course's order, vocabulary, or exam style.

## Operating Context

- Read alongside the weekly lecture, often on a laptop, sometimes on a phone.
- Practice cards can be marked as solved; progress lives only in the visitor's browser.
- Search covers chapters, practice, and the glossary.

## Capabilities and Constraints

- Next.js 15 static export, hosted on GitHub Pages at a `/SPL/` base path; no server.
- Content is Markdown and YAML under `study/content/`, which remains the source of truth.
- Code is highlighted with Shiki, math with KaTeX; diagrams are SVG figures under `public/figures/`.
- English, left to right, with Hebrew course terms inline (bidi handling in `lib/bidi.tsx`).
- Examples in a chapter use only material already taught by that chapter.

## Evidence on Hand

Real chapters, worked examples, practice questions, diagrams, and a glossary under `study/content/` and `public/figures/`. No testimonials, usage numbers, or grades exist; do not invent any.

## Product Principles

1. Follow the course: its order, its terms, its exam style.
2. Reading comes first; anything on the page must help a student understand or check themselves.
3. Progress belongs to the student, kept in their browser with no account.
4. Teach from scratch: never lean on something not yet covered.
