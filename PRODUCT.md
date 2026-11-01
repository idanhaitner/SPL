# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students taking Systems Programming (תכנות מערכות, 202-1-2031), starting with the site's author and shared with classmates in the same course. They start from zero and use the site to learn the course for the first time, in order, then come back to practise and check a definition.

## Product Purpose

A study site that replaces both the lectures and the practice sessions of the course. Each chapter teaches one idea area, and a guided session then walks the student through using it, one step at a time. Success means a student with no background can work through the course in order and leave able to write and reason about the code.

## Positioning

It follows this course's lecture order and terms rather than a generic curriculum, teaches from zero, and practises on questions from the course's own past exams.

## Operating Context

- Students read in long sittings on laptops, and sometimes review on phones.
- The course moves through four parts: memory management in C++, concurrency in Java, communication between processes in Java, and databases in SQL and Python.
- Content lives in `study/content/` as `course.yml` and topic Markdown files.
- Lecture decks, session decks, exams, and runnable practice files live in the gitignored `materials/` and `practice/` folders and are not part of the deployed site.

## Capabilities and Constraints

- Static Next.js export on GitHub Pages. No backend, no accounts, no sync between devices.
- Progress is stored in the browser (`localStorage`).
- Existing surfaces: home, 16 chapter pages, glossary, and search. Lessons include code blocks (Shiki), maths (KaTeX), definitions, traps, checks, and problems.
- Planned: guided sessions per chapter. Chapters in the C++ part get in-browser coding first; later parts have question-only sessions until their turn.
- Compiler Explorer lists C++, Java, and Python but not SQL. Running code from the browser has not yet been tested. Code sent to run leaves the browser, and the site must say so.
- Content is English, left to right, and gives the course's Hebrew term on first use.
- Past exam questions do not show their year.

Undecided: whether the site keeps stating that it is unofficial; which later parts get coding, and whether threads and sockets run usefully in a browser or need local labs.

## Evidence on Hand

- 16 chapters, about 85,000 words, 25 SVG figures, 323 checks, and 108 problems, of which 57 come from past exams, 32 are exercises, and 19 are worked examples.
- No testimonials, usage numbers, or endorsements exist. Do not invent any.

## Product Principles

1. A beginner can learn every page in order, without looking anything up.
2. Doing beats reading: every idea leads quickly to a question or to code the student runs.
3. Follow the course: its order and terms are the backbone.
4. Never lose the student's work or progress.
5. No account and no server of our own.
