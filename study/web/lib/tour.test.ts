// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { TOUR_KEY, TOUR_STEPS, markTourSeen, moveTo, restoreSnapshot, saveSnapshot, tourSeen, usableSteps } from "./tour";

describe("tour", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("shows once, then never again until cleared", () => {
    expect(tourSeen()).toBe(false);
    markTourSeen();
    expect(localStorage.getItem(TOUR_KEY)).toBe("1");
    expect(tourSeen()).toBe(true);
  });
  it("is independent of reading progress", () => {
    localStorage.setItem("study:spl", JSON.stringify({ solved: ["a"] }));
    expect(tourSeen()).toBe(false);
  });
  it("drops home steps whose element is missing, and trusts the other pages until it gets there", () => {
    const steps = usableSteps(TOUR_STEPS, "/", () => false);
    expect(steps.some((step) => step.id === "path")).toBe(false);
    expect(steps.some((step) => step.id === "welcome")).toBe(true);
    expect(steps.some((step) => step.id === "editor")).toBe(true);
  });
  it("stays inside the steps", () => {
    expect(moveTo(0, -1, 5)).toBe(0);
    expect(moveTo(4, 1, 5)).toBe(4);
    expect(moveTo(2, 1, 5)).toBe(3);
  });
  it("has unique ids and goes home, to the chapter, then its session", () => {
    expect(new Set(TOUR_STEPS.map((step) => step.id)).size).toBe(TOUR_STEPS.length);
    const pages = TOUR_STEPS.map((step) => step.path).filter((path, at, all) => path !== all[at - 1]);
    expect(pages).toEqual(["/", "/topics/run-time-environment/", "/sessions/run-time-environment/", "/"]);
  });

  describe("snapshot", () => {
    it("removes what the tour added and restores what it changed, and touches nothing else", () => {
      localStorage.setItem("study:spl", '{"solved":["a"]}');
      localStorage.setItem("study:spl:session:x", '{"skipped":[]}');
      localStorage.setItem("study:theme", "dark");
      saveSnapshot("spl");
      localStorage.setItem("study:spl", '{"solved":["a"],"last":"x"}');
      localStorage.setItem("study:spl:session:y", '{"skipped":[]}');
      localStorage.removeItem("study:spl:session:x");
      localStorage.setItem("study:theme", "light");
      expect(restoreSnapshot("spl")).toBe(true);
      expect(localStorage.getItem("study:spl")).toBe('{"solved":["a"]}');
      expect(localStorage.getItem("study:spl:session:x")).toBe('{"skipped":[]}');
      expect(localStorage.getItem("study:spl:session:y")).toBeNull();
      expect(localStorage.getItem("study:theme")).toBe("light");
    });
    it("does nothing without a snapshot, and a second save keeps the first", () => {
      expect(restoreSnapshot("spl")).toBe(false);
      localStorage.setItem("study:spl", "1");
      saveSnapshot("spl");
      localStorage.setItem("study:spl", "2");
      saveSnapshot("spl");
      restoreSnapshot("spl");
      expect(localStorage.getItem("study:spl")).toBe("1");
    });
  });
});
