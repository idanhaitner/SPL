# Systems Programming — Study Guide

An interactive study site for **Systems Programming** (תכנות מערכות, 202-1-2031). It teaches the course from scratch in English: the run-time environment, memory layout, pointers, C++ ownership, Java, concurrency, networking, the reactor, and persistence — with worked examples, diagrams, and practice drawn from lectures and past exams.

**Live site:** [idanhaitner.github.io/SPL](https://idanhaitner.github.io/SPL/)

## What’s inside

- Chapter-by-chapter lessons in syllabus order
- Worked examples with real code, hints, and solutions
- Practice cards you can mark as solved (progress stays in the browser)
- A public leaderboard: pick a name once and see how far everyone has grown
- Diagrams for frames, heaps, vtables, reactors, and more
- Six review bridges between chapters: short reminders, questions, and a coding exercise that combine the last two or three chapters
- Search across chapters, reviews, practice, and the glossary
- English, read left to right, with the course's Hebrew term on first use

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 15 (static export) |
| UI | React 19, Tailwind CSS 4 |
| Content | Markdown + YAML under `study/content/` |
| Math / code | KaTeX, Shiki |
| Hosting | GitHub Pages via Actions |
| Leaderboard | Firebase Cloud Firestore (free Spark plan) |

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
   Coding exercises live in `study/content/exercises/<id>/` (`README.md`, `starter`, `solution`, `test`). Add `lang: java` or `lang: python` to the README's frontmatter for those languages; C++ is the default. Java exercises must not start threads or open sockets, because the online runner blocks them. Run `npm run check:exercises` in `study/web` to check every exercise.
2. Register it in `study/content/course.yml` if it is new.
3. Put new diagrams in `study/web/public/figures/` and reference them from a topic as `../../web/public/figures/name.svg`. That path is a real file, so GitHub can show it. The app remaps it to `/figures/name.svg` on the site.
4. Refresh the local dev server to see changes.

Topic markdown uses the study dialect: definitions, traps, practice problems with hints/solutions, and `topic:` links between chapters.

**Every practice problem must stand on its own.** A session shows one problem at a time, without the chapter text around it. So write every class, interface, and table a problem uses inside that problem, even if the chapter already showed it (a forward declaration such as `class Bag;` is enough for a type the problem only points at). Never write "the class above", "from the previous question", "from the chapter", or "as before". `npm test` in `study/web` checks this (`lib/self-contained.test.ts`), and the site does not deploy while it fails.

## Leaderboard setup

The leaderboard keeps one small row per student in Cloud Firestore: their name, chapters done, reviews done, questions solved, and the chapter they are on. Progress itself stays in each browser. Until `study/web/lib/firebase-config.ts` holds a config, the leaderboard stays switched off and the site works as before.

One-time setup:

1. In the [Firebase console](https://console.firebase.google.com/), create a project on the free Spark plan (no billing account needed).
2. Create a Cloud Firestore database in **production mode**, in a region near you (for example `europe-west`).
3. Open Firestore → **Rules**, paste the contents of [firebase/firestore.rules](firebase/firestore.rules), and publish.
4. In Project settings → **Your apps**, register a Web app and copy its `firebaseConfig` object into `FIREBASE_CONFIG` in `study/web/lib/firebase-config.ts`. This config is public by design; the rules decide what anyone may do.
5. Optional: in Google Cloud → APIs & Services → Credentials, restrict the API key to the referrers `idanhaitner.github.io/*` and `localhost`.

To remove or fix a row, edit it in the Firebase console under `courses/systems-programming/players`.

## Deploy

Every push to `main` runs [.github/workflows/pages.yml](.github/workflows/pages.yml): install, `next build` with `NEXT_PUBLIC_BASE_PATH=/SPL`, and publish `study/web/out` to GitHub Pages.

## Course map

The chapters follow the order of the lecture notes.

1. The run-time environment
2. The memory model
3. Variables, pointers, and references
4. Classes and objects
5. The rule of three
6. The rule of five and smart pointers
7. Inheritance and polymorphism
8. Threads
9. Safety and correctness
10. Synchronization
11. Waiting and liveness
12. Communication between processes
13. Server design and the reactor
14. The command-invocation server
15. Databases
16. Course review

## License

Course materials remain subject to their original institutional terms. Site code in this repository is provided for personal study use.
