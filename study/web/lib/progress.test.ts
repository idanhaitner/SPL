// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { blockerOf, hrefOf, isWaived, leafStates, leavesOf, nameOf, chapterState, courseStates, isDone, isRead, isUnlocked, lastOpen, markRead, nextChapter, readProgress, resumeHref, setOpenAll, type ChapterInfo } from "./progress";

const ch = (id: string, stepIds: string[] = []): ChapterInfo => ({ id, title: id, num: 1, pos: 0, stepIds });
const br = (id: string, stepIds: string[] = []): ChapterInfo => ({ id, title: id, num: 0, pos: 0, stepIds, kind: "bridge" });

describe("progress", () => {
  beforeEach(() => localStorage.clear());

  it("opening a chapter does not make it read", () => {
    expect(isRead(ch("a"), { solved: [], seen: ["a"] })).toBe(false);
  });
  it("done needs read and every step", () => {
    expect(isDone(ch("a", ["s"]), { solved: ["s"], read: [] })).toBe(false);
    expect(isDone(ch("a", ["s"]), { solved: ["s"], read: ["a"] })).toBe(true);
    expect(isDone(ch("a", ["s", "t"]), { solved: ["s"], read: ["a"] })).toBe(false);
  });
  it("a chapter with no steps is done once read", () => {
    expect(isDone(ch("a"), { solved: [], read: ["a"] })).toBe(true);
    expect(isDone(ch("a"), { solved: [], seen: ["a"] })).toBe(false);
  });
  it("keeps a live-site student's finished chapter", () => {
    expect(isRead(ch("a", ["s"]), { solved: ["s"], seen: ["a"] })).toBe(true);
  });
  it("resumes in the session once read, and in the chapter before that", () => {
    expect(resumeHref(ch("a", ["s"]), { solved: [], read: ["a"] })).toBe("/sessions/a/");
    expect(resumeHref(ch("a", ["s"]), { solved: [] })).toBe("/topics/a/");
    expect(resumeHref(ch("a", ["s"]), { solved: ["s"], read: ["a"] })).toBe("/topics/a/");
  });
  it("survives broken storage shapes", () => {
    localStorage.setItem("study:c", '{"solved":"x","read":3,"sections":7}');
    expect(readProgress("c")).toMatchObject({ solved: [], seen: [], read: [], sections: {} });
    localStorage.setItem("study:c", "not json");
    expect(readProgress("c").solved).toEqual([]);
  });
  it("marking read keeps everything else", () => {
    localStorage.setItem("study:c", JSON.stringify({ solved: ["s"], last: "a", seen: ["a"] }));
    markRead("c", "a");
    expect(readProgress("c")).toMatchObject({ solved: ["s"], last: "a", seen: ["a"], read: ["a"] });
  });
  it("next chapter stays on the unfinished one and moves on after it", () => {
    const list = [ch("a"), ch("b", ["s"]), ch("c")];
    expect(nextChapter(list, { solved: [] })?.id).toBe("a");
    expect(nextChapter(list, { solved: [], last: "b", read: ["a"] })?.id).toBe("b");
    expect(nextChapter(list, { solved: ["s"], last: "b", read: ["a", "b"] })?.id).toBe("c");
    expect(nextChapter(list, { solved: ["s"], read: ["a", "b", "c"] })).toBeNull();
  });
  it("opens a chapter only once the one before it is read and fully solved", () => {
    const list = [ch("a"), ch("b", ["s"]), ch("c")];
    expect(isUnlocked(list, "a", { solved: [] })).toBe(true);
    expect(isUnlocked(list, "b", { solved: [] })).toBe(false);
    expect(isUnlocked(list, "b", { solved: [], read: ["a"] })).toBe(true);
    // Reading b is not enough while a question is unsolved.
    expect(isUnlocked(list, "c", { solved: [], read: ["a", "b"] })).toBe(false);
    expect(isUnlocked(list, "c", { solved: ["s"], read: ["a"] })).toBe(false);
    expect(isUnlocked(list, "c", { solved: ["s"], read: ["a", "b"] })).toBe(true);
    // No way around it: reading a later chapter does not open it.
    expect(isUnlocked(list, "c", { solved: [], read: ["c"] })).toBe(false);
    expect(blockerOf(list, "c", { solved: [], read: ["a", "b"] })?.id).toBe("b");
  });
  it("never sends the student to a locked chapter", () => {
    const list = [ch("a"), ch("b"), ch("c")];
    expect(nextChapter(list, { solved: [], last: "c" })?.id).toBe("a");
    expect(nextChapter([ch("a", ["s"]), ...list.slice(1)], { solved: [], read: ["a"], last: "c" })?.id).toBe("a");
  });
  it("locks what has not opened, and grows to the last open chapter", () => {
    const list = [ch("a"), ch("b"), ch("c"), ch("d")];
    const states = courseStates(list, { solved: [], read: ["a"] });
    expect(states).toEqual(["done", "here", "locked", "locked"]);
    expect(lastOpen(states)).toBe(1);
    expect(lastOpen(courseStates(list, { solved: [], read: ["a", "b", "c", "d"] }))).toBe(3);
    // A later chapter read out of order stays locked behind the unfinished one.
    expect(courseStates([ch("a", ["s"]), ch("b")], { solved: [], read: ["a", "b"] })).toEqual(["here", "locked"]);
  });
  it("opens every chapter when the student chooses to", () => {
    const list = [ch("a", ["s"]), ch("b"), ch("c")];
    const progress = { solved: [], openAll: true };
    expect(list.every((chapter) => isUnlocked(list, chapter.id, progress))).toBe(true);
    expect(courseStates(list, progress)).not.toContain("locked");
    expect(lastOpen(courseStates(list, progress))).toBe(2);
  });
  it("still points to the next unfinished chapter in order with every chapter open", () => {
    const list = [ch("a"), ch("b"), ch("c")];
    expect(nextChapter(list, { solved: [], openAll: true })?.id).toBe("a");
    expect(nextChapter(list, { solved: [], read: ["a"], openAll: true })?.id).toBe("b");
  });
  it("saves the choice to open every chapter, and keeps progress when it is turned off", () => {
    localStorage.setItem("study:c", JSON.stringify({ solved: ["s"], read: ["a", "c"] }));
    setOpenAll("c", true);
    expect(readProgress("c")).toMatchObject({ solved: ["s"], read: ["a", "c"], openAll: true });
    setOpenAll("c", false);
    const progress = readProgress("c");
    expect(progress).toMatchObject({ solved: ["s"], read: ["a", "c"] });
    expect(progress.openAll).toBeFalsy();
    expect(isUnlocked([ch("a", ["s"]), ch("b", ["t"]), ch("c")], "c", progress)).toBe(false);
  });
  it("treats a broken open-every-chapter value as off", () => {
    localStorage.setItem("study:c", '{"solved":[],"openAll":"yes"}');
    expect(readProgress("c").openAll).toBeFalsy();
  });
  it("names the four states", () => {
    const [a, b] = [ch("a"), ch("b", ["s"])];
    const next = b;
    expect(chapterState(a, next, { solved: [], read: ["a"] })).toBe("done");
    expect(chapterState(b, next, { solved: [], read: ["b"] })).toBe("here");
    expect(chapterState(b, a, { solved: [], read: ["b"] })).toBe("read");
    expect(chapterState(ch("z"), next, { solved: [] })).toBe("ahead");
  });

  describe("bridges", () => {
    const [a, r, c] = [ch("a"), br("r", ["r--one", "q"]), ch("c")];
    const list = [a, r, c];
    it("a bridge is done once every step is solved, with no read mark", () => {
      expect(isDone(r, { solved: ["r--one", "q"], read: [] })).toBe(true);
    });
    it("a bridge with an unsolved step is not done", () => {
      expect(isDone(r, { solved: ["r--one"], read: ["r"] })).toBe(false);
    });
    it("a bridge blocks the chapter after it until done", () => {
      const progress = { solved: ["r--one"], read: ["a"] };
      expect(isUnlocked(list, "c", progress)).toBe(false);
      expect(blockerOf(list, "c", progress)).toBe(r);
      expect(isUnlocked(list, "c", { solved: ["r--one", "q"], read: ["a"] })).toBe(true);
    });
    it("openAll opens past an unfinished bridge", () => {
      expect(isUnlocked(list, "c", { solved: [], openAll: true })).toBe(true);
    });
    it("resumes a bridge in its session", () => {
      expect(resumeHref(r, { solved: [] })).toBe("/sessions/r/");
      expect(resumeHref(r, { solved: ["r--one"] })).toBe("/sessions/r/");
    });
    it("a bridge is never in the read state", () => {
      expect(chapterState(r, a, { solved: [] })).toBe("ahead");
    });
    it("draws leaves for chapters only, with states that still respect the bridge", () => {
      expect(leavesOf(list)).toEqual([a, c]);
      expect(leafStates(list, { solved: [], read: ["a"] })).toEqual(["done", "locked"]);
      expect(leafStates(list, { solved: ["r--one", "q"], read: ["a"] })).toEqual(["done", "here"]);
    });
    it("links and names chapters and bridges", () => {
      expect(hrefOf(a)).toBe("/topics/a/");
      expect(nameOf(a)).toBe("Chapter 1");
      expect(hrefOf(r)).toBe("/sessions/r/");
      expect(nameOf(r)).toBe("Review");
    });
  });

  describe("a bridge the student is already past", () => {
    const [a, r, c, d] = [ch("a"), br("r", ["r--one", "q"]), ch("c", ["cs"]), ch("d")];
    const list = [a, r, c, d];

    it("is waived once a later chapter was read", () => {
      expect(isWaived(list, r, { solved: [], read: ["a", "c"] })).toBe(true);
    });
    it("is waived once any step of a later chapter was solved", () => {
      expect(isWaived(list, r, { solved: ["cs"], read: ["a"] })).toBe(true);
    });
    it("is not waived for a student who has not gone past it", () => {
      expect(isWaived(list, r, { solved: [], read: ["a"] })).toBe(false);
      expect(isWaived(list, r, { solved: ["r--one"], read: ["a"], seen: ["c"], last: "c" })).toBe(false);
    });
    it("is not waived by openAll alone, only by going on", () => {
      expect(isWaived(list, r, { solved: [], read: ["a"], openAll: true })).toBe(false);
    });
    it("is never waived once done, and a chapter is never waived", () => {
      expect(isWaived(list, r, { solved: ["r--one", "q", "cs"], read: ["c"] })).toBe(false);
      expect(isWaived(list, a, { solved: [], read: ["c"] })).toBe(false);
    });
    it("does not block the chapters after it", () => {
      const progress = { solved: [], read: ["a", "c"] };
      expect(isUnlocked(list, "c", progress)).toBe(true);
      expect(isUnlocked(list, "d", progress)).toBe(false);
      expect(blockerOf(list, "d", { solved: ["cs"], read: ["a", "c"] })).toBe(null);
      expect(isUnlocked(list, "d", { solved: ["cs"], read: ["a", "c"] })).toBe(true);
    });
    it("is not offered as the next thing to do", () => {
      expect(nextChapter(list, { solved: [], read: ["a", "c"], last: "c" })).toBe(c);
      expect(nextChapter(list, { solved: ["cs"], read: ["a", "c", "d"], last: "d" })).toBe(null);
    });
    it("shows as open but not finished, never locked", () => {
      expect(courseStates(list, { solved: [], read: ["a", "c"] })[1]).toBe("read");
      expect(isDone(r, { solved: [], read: ["a", "c"] })).toBe(false);
    });
    it("keeps working as a normal bridge for a student who is not past it", () => {
      expect(courseStates(list, { solved: [], read: ["a"] }).slice(1)).toEqual(["here", "locked", "locked"]);
    });
  });
});
