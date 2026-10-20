# Systems Programming — Study Guide

An interactive study site for **תכנות מערכות** (Systems Programming, 202-1-2031). It teaches the course from scratch in Hebrew: memory layout, pointers, C++ ownership, Java, concurrency, networking, the Reactor pattern, and persistence — with worked examples, diagrams, and practice drawn from lectures and past exams.

**Live site:** [idanhaitner.github.io/SPL](https://idanhaitner.github.io/SPL/)

## What’s inside

- Chapter-by-chapter lessons in syllabus order
- Worked examples with real code, hints, and solutions
- Practice cards you can mark as solved (progress stays in the browser)
- Diagrams for frames, heaps, vtables, reactors, and more
- Search across chapters, practice, and the glossary
- Fully RTL Hebrew reading experience

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 15 (static export) |
| UI | React 19, Tailwind CSS 4 |
| Content | Markdown + YAML under `study/content/` |
| Math / code | KaTeX, Shiki |
| Hosting | GitHub Pages via Actions |

## Repository layout

```text
study/
  content/          # course.yml + topic markdown (source of truth)
  web/              # Next.js app
    app/            # routes, layout, styles
    components/     # rail, practice cards, section switch
    public/figures/ # lesson diagrams
.github/workflows/  # Pages deploy on push to main
```

Lecture decks, exams, and local practice files can live under `materials/` and `practice/` on your machine; they are gitignored and are not required to run the site.

## Run locally

Requires Node.js 22+.

```bash
cd study/web
npm install
npm run dev
```

Open the URL Next prints (usually `http://localhost:3000`).

```bash
npm run build   # static export → study/web/out
npm run audit   # optional content/UI checks
```

## Edit content

1. Update or add a topic in `study/content/topics/*.md`.
2. Register it in `study/content/course.yml` if it is new.
3. Put new diagrams in `study/web/public/figures/` and reference them from markdown as `../assets/figures/name.svg` (the app remaps that path).
4. Refresh the local dev server to see changes.

Topic markdown uses the study dialect: definitions, traps, practice problems with hints/solutions, and `topic:` links between chapters.

## Deploy

Every push to `main` runs [.github/workflows/pages.yml](.github/workflows/pages.yml): install, `next build` with `NEXT_PUBLIC_BASE_PATH=/SPL`, and publish `study/web/out` to GitHub Pages.

## Course map

1. Memory model  
2. Pointers  
3. Classes and objects  
4. Rule of three  
5. Rule of five  
6. Inheritance  
7. Back to Java  
8. Concurrency  
9. Design by contract  
10. Networking  
11. Reactor  
12. Serialization  
13. Persistence  

## License

Course materials remain subject to their original institutional terms. Site code in this repository is provided for personal study use.
