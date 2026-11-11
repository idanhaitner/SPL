export const TOUR_KEY = "study:tour";
// Sent by the Tour button when the home page is already open.
export const TOUR_EVENT = "study-tour-start";
// Holds the visitor's own progress while the tour opens real pages, so the tour leaves no trace in it.
export const TOUR_SNAPSHOT_KEY = "study:tour-snapshot";

// Something the tour does on a page so the next thing is on screen.
export type TourEnter = "start-session" | "last-step";

export type TourStep = {
  id: string;
  // A CSS selector for what to point at. Without one the card sits in the middle of the page.
  anchor?: string;
  // The page the step lives on. The tour goes there by itself, and a step without one stays where it is.
  path?: string;
  enter?: TourEnter;
  title: string;
  body: string;
};

const CHAPTER = "/topics/run-time-environment/";
const SESSION = "/sessions/run-time-environment/";

export const TOUR_STEPS: TourStep[] = [
  { id: "welcome", path: "/", title: "Welcome to the course", body: "A short tour: the path, a chapter, and a guided session with its questions and code editor. Skip it any time, and replay it from Tour." },
  { id: "path", path: "/", anchor: '[data-tour="course"]', title: "The path through the course", body: "Chapters come in the course's order. Finish one and its leaf lights up; the reviews between them become flowers." },
  { id: "continue", path: "/", anchor: '[data-tour="continue"]', title: "Pick up where you stopped", body: "This always opens your next chapter. Your progress stays in this browser, with no account. Now, a look inside a chapter." },

  { id: "sections", path: CHAPTER, anchor: ".section-stem, .section-menu, .section-solo", title: "A chapter is read in sections", body: "Each section is one short page. Its leaf fills in when you have read it, and you can jump between sections from here." },
  { id: "lesson", path: CHAPTER, anchor: ".reader-body", title: "Lessons that start from zero", body: "Plain explanations with diagrams, code and the course's Hebrew terms, written to be read in order without looking anything up." },
  { id: "to-session", path: CHAPTER, anchor: ".section-session", title: "Then, a guided session", body: "From any page of the chapter this takes you to its practice. Let's open it." },

  { id: "session", path: SESSION, anchor: ".session-intro", title: "The guided session", body: "It teaches nothing new. It has you use the chapter one step at a time, and your place is saved." },
  { id: "questions", path: SESSION, enter: "start-session", anchor: ".session-reading:not(.session-intro)", title: "Questions, one at a time", body: "Many are multiple choice, some with several right answers, and many come from past exams. A wrong answer explains itself, and Reread takes you back to the lesson." },
  { id: "steps", path: SESSION, anchor: ".session-bar", title: "Every step is a leaf", body: "Jump to any step, skip one and come back later. Solved steps grow, and finishing the session grows the plant." },
  { id: "task", path: SESSION, enter: "last-step", anchor: ".workspace-fill", title: "Coding exercises", body: "Some steps are programming tasks, like on LeetCode: a description, examples, and hints you can open one at a time." },
  { id: "editor", path: SESSION, anchor: ".workspace-code", title: "Write the code right here", body: "A real editor with highlighting and completion. Your code is saved as you type, so closing the tab loses nothing." },
  { id: "run", path: SESSION, anchor: ".workspace-actions", title: "Run it, then submit it", body: "Run shows what your program prints. Submit checks it against the tests. The code is compiled on godbolt.org, so it leaves your browser when you run it." },

  { id: "done", path: "/", title: "That's the tour", body: "Press Tour in the top bar or the footer to see it again. Happy studying." },
];

export function tourSeen(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) !== null;
  } catch {
    // Without storage the tour would start on every visit, so treat it as seen.
    return true;
  }
}

export function markTourSeen() {
  try {
    localStorage.setItem(TOUR_KEY, "1");
  } catch {
    // It may show again next time.
  }
}

// A step on the page the tour starts from is left out when its element is missing or hidden. Steps on other pages are checked when the tour gets there.
export function usableSteps(steps: TourStep[], path: string, visible: (anchor: string) => boolean): TourStep[] {
  return steps.filter((step) => !step.anchor || step.path !== path || visible(step.anchor));
}

export function moveTo(index: number, delta: number, count: number): number {
  return Math.min(count - 1, Math.max(0, index + delta));
}

// The visitor's saved progress, code and place in sessions: every key of this course.
function ownKeys(courseId: string): string[] {
  const keys: string[] = [];
  for (let at = 0; at < localStorage.length; at += 1) {
    const key = localStorage.key(at);
    if (key && (key === `study:${courseId}` || key.startsWith(`study:${courseId}:`))) keys.push(key);
  }
  return keys;
}

export function saveSnapshot(courseId: string) {
  try {
    if (sessionStorage.getItem(TOUR_SNAPSHOT_KEY)) return;
    const saved: Record<string, string> = {};
    for (const key of ownKeys(courseId)) saved[key] = localStorage.getItem(key) ?? "";
    sessionStorage.setItem(TOUR_SNAPSHOT_KEY, JSON.stringify(saved));
  } catch {
    // The tour then simply leaves whatever pages it opened in the history.
  }
}

// Puts progress back exactly as it was before the tour opened chapter and session pages.
export function restoreSnapshot(courseId: string): boolean {
  try {
    const raw = sessionStorage.getItem(TOUR_SNAPSHOT_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw) as Record<string, string>;
    for (const key of ownKeys(courseId)) if (!(key in saved)) localStorage.removeItem(key);
    for (const [key, value] of Object.entries(saved)) localStorage.setItem(key, value);
    sessionStorage.removeItem(TOUR_SNAPSHOT_KEY);
    window.dispatchEvent(new Event("study-progress"));
    return true;
  } catch {
    return false;
  }
}
