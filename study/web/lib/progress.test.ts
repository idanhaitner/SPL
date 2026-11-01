import { beforeEach, describe, expect, it } from "vitest";
import { chapterState, isDone, isRead, markRead, nextChapter, readProgress, resumeHref, type ChapterInfo } from "./progress";

const ch = (id: string, stepIds: string[] = []): ChapterInfo => ({ id, title: id, num: 1, stepIds });

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
  it("names the four states", () => {
    const [a, b] = [ch("a"), ch("b", ["s"])];
    const next = b;
    expect(chapterState(a, next, { solved: [], read: ["a"] })).toBe("done");
    expect(chapterState(b, next, { solved: [], read: ["b"] })).toBe("here");
    expect(chapterState(b, a, { solved: [], read: ["b"] })).toBe("read");
    expect(chapterState(ch("z"), next, { solved: [] })).toBe("ahead");
  });
});
