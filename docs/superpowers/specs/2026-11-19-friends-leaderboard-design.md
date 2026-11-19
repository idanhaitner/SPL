# Friends leaderboard: design

Date: 2026-11-19

## Purpose

The site's author studies the course with a group of friends. A shared leaderboard turns that into a friendly race: each friend picks a name once, and everyone can see how far everyone else has grown through the course. The goal is motivation to keep learning, not a strict competition.

Success: a friend opens the site, types a name once, keeps studying exactly as today, and within a few seconds of finishing a chapter or solving a question their place on the board changes for everyone.

## Decisions made with the author

- Each person types a name the first time they start. The device remembers it; there is no login, password, PIN, or email.
- Progress stays on one device, in `localStorage`, exactly as today. No sync between devices. Clearing the browser loses progress, as today.
- Only a small summary of each friend's progress is shared.
- The site stays a static Next.js export on GitHub Pages at `idanhaitner.github.io/SPL`. No server of our own.
- The shared table lives in **Firebase Cloud Firestore** on the free Spark plan.
- No security beyond basic data-shape checks.
- **One board for anyone on the site**, not an invite-only friends group. Every student who makes progress is asked to join, so classmates the author doesn't know may appear too. The author accepts that, without accounts, anyone could technically rename or reset another row.
- Look and feel are left to the builder, inside the existing Greenhouse design system (`DESIGN.md`).

## Goals

- A one-time name prompt, then automatic, silent publishing of the friend's progress summary.
- A leaderboard page in the Greenhouse look: each friend's progress drawn as a plant, ranked.
- Works for students who already have progress from before this feature.
- The site keeps working fully when Firestore is unreachable, blocked, or not configured.

## Non-goals

- Syncing progress across devices, or restoring it after the browser is cleared.
- Accounts, passwords, email, or recovering a name on another device.
- Groups or private boards. There is one board for the whole site.
- Admin tools inside the site. The author edits or deletes rows in the Firebase console.

## Anti-goals (would be a failure even if it works)

- Studying waits on the network. Every click, Next, and Finish reading must stay as fast as today, with or without Firestore.
- Any loss or rewrite of local progress caused by the leaderboard. The board only reads local progress, never writes it.
- Pressure that hurts learning: no penalties, no "falling behind" warnings, no streak shaming.
- A big download on every page. Readers who never open the board should not pay for the Firebase SDK at first paint.
- Anti-cheat machinery. Friends are trusted.

## Approaches considered

| Approach | Trade-off | Verdict |
| --- | --- | --- |
| **Firebase Firestore** | Free plan has far more than enough room, never goes to sleep, fast, supports live updates. Costs a one-time Firebase project setup. | **Chosen by the author.** |
| Google Sheet with an Apps Script web app | Readable as a spreadsheet, but 1–3s per call, no live updates, fiddly deployment. | Rejected. |
| Supabase | Good database, but free projects pause after a week without visits, so the board would break over an exam break. | Rejected. |
| A file in the GitHub repo | Writing to it needs a GitHub token in the public site. | Rejected. |
| Free JSON-bin services | One shared blob, so two friends saving together can wipe each other. | Rejected. |

Earlier in the conversation the author also chose to sync whole progress across devices, then reversed that choice in favor of one device and no security. This design follows the final answer.

## How it works

### Identity (per device)

- On first join the device creates a random id (`crypto.randomUUID()`) and stores `{ id, name }` in `localStorage` under `study:<courseId>:player`.
- The id keys the shared row; the name is only a label. Two friends may pick the same name without overwriting each other, and a friend can rename themselves.
- Names: trimmed, 1–24 characters, any script. Hebrew names must display correctly (use the existing `lib/bidi.tsx` handling where needed).

### When the name is asked

- **Trigger** *(my call; the author said "when they first start progress")*: the first time a student who has not joined has real progress, meaning at least one chapter read (`progress.read`) or one question solved (`progress.solved`). Just opening a page does not count: `Visit` writes `last`/`seen` on every page open, and `setOpenAll` writes too, so `hasStarted` and the raw `study-progress` event would ask before the student has done anything. The check runs on `study-progress` and on page load. This also means the student has something on the board the moment they join.
- **Students who already have progress (required by the author):** the author and friends already have progress on the site. After the upgrade, anyone whose browser holds any existing progress (`hasStarted(progress)`, which includes chapters only visited) is asked for a name on their first visit, on any page. Joining publishes their full current progress right away, so they appear on the board at their true place. Their local progress is not changed in any way. *(Builder: test this path with a `localStorage` fixture that holds pre-feature progress.)*
- **Prompt:** a small, friendly dialog: "Join the leaderboard? Pick a name others studying the course will see." It has a text field, a primary "Join" button, and a quiet "Not now" button. One line says the name and progress will be visible to anyone who opens the leaderboard.
- **"Not now"** is remembered (`study:<courseId>:player` = `{ declined: true }`), and the dialog is not shown again automatically. The leaderboard page always offers a Join button, so a student can join later.
- The dialog never blocks reading. Opening it does not interrupt navigation or a session step. If it is triggered mid-session, it appears after the current action completes. *(Builder call: exact timing, as long as it never interrupts typing in the editor.)*

### What is shared (the summary row)

Firestore path: `courses/{courseId}/players/{playerId}`. One document per joined device.

```ts
{
  name: string,          // 1–24 chars
  chapters: number,      // chapters (not reviews) done: read + all practice solved, i.e. isDone
  reviews: number,       // review bridges done
  solved: number,        // progress.solved.length
  current: string | null,// id of nextChapter(), the chapter they are on
  reachedAt: Timestamp,  // when `chapters`/`solved` last went up (for tie-breaks)
  updatedAt: Timestamp,  // server time of the last write
}
```

- The summary is computed by one pure function `summarize(chapters, progress)` in a new `lib/leaderboard.ts`. It reuses `isDone`, `nextChapter`, and `leavesOf` from `lib/progress.ts` and does not change them.
- **Ranking:** by `chapters`, then `solved`, then earlier `reachedAt`. A tie on all three shares a place.
- "How far" in the UI means chapters done out of 16, plus the chapter they are on now.

### Publishing

- A small client module listens to the existing `study-progress` event, which `writeProgress` already dispatches, and to page load.
- If the device has joined, it computes the summary. If the summary differs from the last one published (kept in `localStorage`), it writes the row after a short debounce of about 2s. `reachedAt` moves only when `chapters` or `solved` went up.
- Failures (offline, blocked, quota) are silent and retried on the next progress change or page load. Nothing in the UI waits on them.
- Writes use `setDoc` with `merge`, so the row is created on first join.

### Firebase client

- Firebase's web config is public by design. It is committed as `lib/firebase-config.ts`. If the config is empty, all leaderboard features hide themselves and the site behaves exactly as today. This also covers local dev without a project.
- Use the modular Firebase JS SDK (`firebase/app`, `firebase/firestore`), loaded with a dynamic `import()` only when needed: when publishing, and on the leaderboard page. It must never be in the first-paint bundle of chapter, session, or home pages.
- The leaderboard page subscribes with `onSnapshot` so places update live while it is open.
- Optional hardening for the author: restrict the API key in Google Cloud to the referrers `idanhaitner.github.io/*` and `localhost`.

### Firestore security rules

Anyone may read. Anyone may create or update a player row only if it has the right shape; nobody may delete through the site.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /courses/{course}/players/{player} {
      allow read: if true;
      allow create, update: if
        request.resource.data.keys().hasOnly(['name','chapters','reviews','solved','current','reachedAt','updatedAt']) &&
        request.resource.data.name is string &&
        request.resource.data.name.size() >= 1 && request.resource.data.name.size() <= 24 &&
        request.resource.data.chapters is int && request.resource.data.chapters >= 0 && request.resource.data.chapters <= 50 &&
        request.resource.data.reviews is int && request.resource.data.reviews >= 0 && request.resource.data.reviews <= 50 &&
        request.resource.data.solved is int && request.resource.data.solved >= 0 && request.resource.data.solved <= 2000 &&
        (request.resource.data.current == null || (request.resource.data.current is string && request.resource.data.current.size() <= 64)) &&
        request.resource.data.reachedAt is timestamp &&
        request.resource.data.updatedAt == request.time;
      allow delete: if false;
    }
  }
}
```

The rules live in the repo as `firebase/firestore.rules` and are pasted into the console. There is no Firebase CLI in CI.

## The leaderboard page

- **Route:** `/leaderboard/`, a static page whose board renders on the client. A "Leaderboard" link sits in the top bar next to Glossary, and also in the Course drawer. Following `DESIGN.md`, the label is plain, with no plant pun.
- **Top:** a green masthead with arches, like the glossary's. Title "Leaderboard", one line ("How far everyone has grown"), and the student's own place ("You're 3rd of 7"), or a primary "Join the leaderboard" button if they have not joined.
- **The garden (signature):** each friend is a small plant in one shared bed, drawn with the existing stem and leaf drawings (`Stem`, `LeafShape`, `lib/stem.ts`). Height and leaf count show chapters done out of 16, a flower (`Flower`) marks each review done, and the four part tendrils sit at the same heights for everyone, so plants can be compared at a glance. Names sit under each plant, the leader's plant gets the `here` glow, and the student's own plant is marked "You". Plants are ordered by rank, left to right. At most about 12 plants are shown in the bed; the rest are in the list below.
- **Size** *(my call)*: the board can hold the whole class. The list shows the top 50, with a "Show everyone" button for the rest. If the student's own row is below the shown range, it is pinned at the bottom. Rows not updated in 60 days are greyed out but keep their place, and they are left out of the garden bed, so old visitors don't crowd the plants.
- **The list:** a ranked table under the bed: place, name, chapters done, reviews, solved questions, "now on: Chapter 8 · Threads", and a relative "active 2 hours ago" from `updatedAt`. The student's own row sits on the lighter "next" plate used in the Course Bed.
- **Your row actions:** "Change name" (inline edit) and "Leave the leaderboard". Leaving deletes the local identity and stops publishing. Since the rules forbid deletes, it also renames the row to a hidden marker or zeroes it. *(Builder call: simplest truthful option. The author can delete rows in the console.)*
- **Empty and error states:** with no rows, an invitation to be the first. When Firestore can't be reached, one calm line: "The leaderboard can't be reached right now. Your progress is safe on this device."
- **Motion:** follows the Growth Is Slow Rule. Plants grow in once on arrival, and a friend moving up animates their plant's growth. Everything is still under `prefers-reduced-motion`.
- **Phones (below 640px):** the bed becomes a horizontal scroll of plants, or is dropped in favor of the list with a small mini stem per row. *(Builder call.)*
- **Both themes** use the existing tokens. No new hues.

## Home page touch

Under the hero's Continue button on home (`app/page.tsx`, the `gh-hero-action` one, not the closing one), a joined student sees one quiet line, "You're 3rd of 7 on the leaderboard →", linking to the board. Nothing shows when they haven't joined or the board can't be reached. This is the only home change.

*(My call)* The rank is live: after first paint, once the browser is idle, home lazy-loads the Firebase SDK and reads the board once (`getDocs`, no live subscription). This keeps first paint unchanged and avoids showing a stale rank. The line fades in when the data arrives, with no layout shift (reserve its height).

## Docs to update

- `PRODUCT.md`: principle 5 becomes "No accounts and no server of our own; a small shared leaderboard summary lives in Firestore." Constraints: progress stays on the device; only a summary is shared.
- `README.md`: add Firestore to the stack table, plus a "Leaderboard setup" section with the one-time Firebase steps below.
- `DESIGN.md`: add a short "Leaderboard" component entry once built.

## One-time setup the author does

1. Create a Firebase project (free Spark plan, no billing account).
2. Create a Cloud Firestore database in production mode, in a region near Israel (for example `europe-west`).
3. Paste `firebase/firestore.rules` into the Rules tab and publish.
4. Register a Web app and copy its config object into `lib/firebase-config.ts`.
5. (Optional) Restrict the API key to the site's domain and `localhost`.

The builder should write these steps into the README and walk the author through them.

## Testing

- Unit tests (vitest) for `summarize` and ranking: a fresh student, a mid-course student, an `openAll` student who read ahead without solving, a student past a waived review, and ties.
- Unit tests for publishing decisions: no write when not joined, no write when the summary is unchanged, `reachedAt` moves only on gains, and name validation.
- The leaderboard page and dialog render with Firestore stubbed: empty, populated, error, and not configured.
- Manual check against the real Firestore project before merging, with two browsers as two friends.
- In CI, `npm test`, `npm run check:exercises`, and `npm run build` still pass, and the workflow is unchanged. Locally, the Playwright checks (`check:shell`, `check:chapter`, `check:session`) still pass with the leaderboard both configured and not configured.

## Left to the builder

- Exact copy, within `DESIGN.md`'s voice rules.
- Exact layout of the bed, plant scale, and the phone treatment.
- Exact dialog timing, within "never interrupt typing or a step".
- How "Leave the leaderboard" hides the row, given no deletes.
- File and component names beyond `lib/leaderboard.ts` and `firebase/firestore.rules`.
