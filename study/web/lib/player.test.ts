// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { boardSeedScript, declinePlayer, joinAs, readPlayer, readPublished, readSeed, renamePlayer, shouldAsk, writePublished } from "./player";

describe("player", () => {
  beforeEach(() => localStorage.clear());

  it("asks a new student only after real progress", () => {
    expect(shouldAsk({ solved: [], last: "a", seen: ["a"] }, null, "new")).toBe(false);
    expect(shouldAsk({ solved: [], read: ["a"] }, null, "new")).toBe(true);
    expect(shouldAsk({ solved: ["s"] }, null, "new")).toBe(true);
  });
  it("asks a student from before the upgrade who has only visited", () => {
    expect(shouldAsk({ solved: [], last: "a", seen: ["a"] }, null, "existing")).toBe(true);
    expect(shouldAsk({ solved: [] }, null, "existing")).toBe(false);
  });
  it("never asks again after joining or declining", () => {
    expect(shouldAsk({ solved: ["s"] }, { id: "i", name: "n" }, "new")).toBe(false);
    expect(shouldAsk({ solved: ["s"] }, { declined: true }, "existing")).toBe(false);
  });
  it("the seed script marks a browser with progress as existing, once", () => {
    localStorage.setItem("study:c", "{}");
    new Function(boardSeedScript("c"))();
    expect(readSeed("c")).toBe("existing");
    localStorage.removeItem("study:c");
    new Function(boardSeedScript("c"))();
    expect(readSeed("c")).toBe("existing");
  });
  it("the seed script marks a fresh browser as new", () => {
    new Function(boardSeedScript("c"))();
    expect(readSeed("c")).toBe("new");
  });
  it("an unseeded browser counts as new", () => {
    expect(readSeed("c")).toBe("new");
  });
  it("joining keeps the device id across renames and rejoins", () => {
    const first = joinAs("c", "Dana");
    expect(readPlayer("c")).toEqual(first);
    expect(renamePlayer("c", "Dana K")).toEqual({ id: first.id, name: "Dana K" });
    expect(joinAs("c", "D").id).toBe(first.id);
  });
  it("renaming before joining does nothing", () => {
    expect(renamePlayer("c", "Dana")).toBeNull();
  });
  it("declining forgets what was published", () => {
    joinAs("c", "Dana");
    writePublished("c", { id: "x", name: "Dana", summary: { chapters: 1, reviews: 0, solved: 1, current: null }, reachedAt: 1 });
    expect(readPublished("c")?.name).toBe("Dana");
    declinePlayer("c");
    expect(readPlayer("c")).toEqual({ declined: true });
    expect(readPublished("c")).toBeNull();
  });
  it("tells the page when the player changes", () => {
    let heard = 0;
    window.addEventListener("study-player", () => (heard += 1));
    joinAs("c", "Dana");
    expect(heard).toBe(1);
  });
  it("survives broken storage", () => {
    localStorage.setItem("study:c:player", "nope");
    expect(readPlayer("c")).toBeNull();
    localStorage.setItem("study:c:player", '{"id":5}');
    expect(readPlayer("c")).toBeNull();
    localStorage.setItem("study:c:published", '{"id":"x"}');
    expect(readPublished("c")).toBeNull();
  });
});
