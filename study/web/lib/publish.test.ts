// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import type { BoardStore, RowInput } from "./board-store";
import { hideRow, publishIfChanged } from "./publish";
import { joinAs, readPublished, renamePlayer, declinePlayer } from "./player";
import type { ChapterInfo } from "./progress";

const ch = (id: string, stepIds: string[] = []): ChapterInfo => ({ id, title: id, num: 1, pos: 0, stepIds });
const br = (id: string, stepIds: string[] = []): ChapterInfo => ({ id, title: id, num: 0, pos: 0, stepIds, kind: "bridge" });
const course = [ch("a", ["a1", "a2"]), ch("b", ["b1"]), br("r1", ["r1s"]), ch("c", ["c1"])].map((chapter, pos) => ({ ...chapter, pos }));

type Put = { courseId: string; id: string; row: RowInput };
function fakeStore() {
  const store = {
    puts: [] as Put[],
    failNext: false,
    async put(courseId: string, id: string, row: RowInput) {
      if (store.failNext) {
        store.failNext = false;
        throw new Error("offline");
      }
      store.puts.push({ courseId, id, row });
    },
    async once() {
      return [];
    },
    watch() {
      return () => {};
    },
  };
  return store satisfies BoardStore;
}

const setProgress = (progress: object) => localStorage.setItem("study:c", JSON.stringify(progress));

describe("publishIfChanged", () => {
  let fake: ReturnType<typeof fakeStore>;
  beforeEach(() => {
    localStorage.clear();
    fake = fakeStore();
  });

  it("does nothing for a student who has not joined", async () => {
    setProgress({ solved: ["a1"] });
    expect(await publishIfChanged("c", course, fake, 1)).toBe("skipped");
    expect(fake.puts).toEqual([]);
  });
  it("does nothing for a student who declined", async () => {
    setProgress({ solved: ["a1"] });
    declinePlayer("c");
    expect(await publishIfChanged("c", course, fake, 1)).toBe("skipped");
  });
  it("publishes current progress on join, including progress from before the upgrade", async () => {
    setProgress({ solved: ["a1", "a2"], read: ["a"], last: "b", seen: ["a", "b"] });
    const player = joinAs("c", "Dana");
    expect(await publishIfChanged("c", course, fake, 100)).toBe("published");
    expect(fake.puts[0]).toEqual({ courseId: "c", id: player.id, row: { name: "Dana", chapters: 1, reviews: 0, solved: 2, current: "b", reachedAt: 100, hidden: false } });
    expect(readPublished("c")?.reachedAt).toBe(100);
  });
  it("skips when nothing changed", async () => {
    setProgress({ solved: ["a1"] });
    joinAs("c", "Dana");
    await publishIfChanged("c", course, fake, 100);
    expect(await publishIfChanged("c", course, fake, 200)).toBe("skipped");
    expect(fake.puts.length).toBe(1);
  });
  it("sends hidden: false with every normal write, so a row hidden before comes back", async () => {
    setProgress({ solved: ["a1"] });
    joinAs("c", "Dana");
    await publishIfChanged("c", course, fake, 100);
    expect(fake.puts[0].row.hidden).toBe(false);
  });
  it("never publishes a student who opened every chapter before joining", async () => {
    setProgress({ solved: ["a1"], openAll: true });
    joinAs("c", "Dana");
    expect(await publishIfChanged("c", course, fake, 100)).toBe("skipped");
    expect(fake.puts).toEqual([]);
  });
  it("hides a joined student's row once they open every chapter, and shows it again when they stop", async () => {
    setProgress({ solved: ["a1"] });
    joinAs("c", "Dana");
    await publishIfChanged("c", course, fake, 100);
    setProgress({ solved: ["a1"], openAll: true });
    expect(await publishIfChanged("c", course, fake, 200)).toBe("published");
    expect(fake.puts[1].row).toMatchObject({ hidden: true, reachedAt: 100 });
    expect(await publishIfChanged("c", course, fake, 250)).toBe("skipped");
    setProgress({ solved: ["a1"] });
    expect(await publishIfChanged("c", course, fake, 300)).toBe("published");
    expect(fake.puts[2].row).toMatchObject({ hidden: false, reachedAt: 100 });
  });
  it("moves reachedAt on a gain", async () => {
    setProgress({ solved: ["a1"] });
    joinAs("c", "Dana");
    await publishIfChanged("c", course, fake, 100);
    setProgress({ solved: ["a1", "a2"] });
    await publishIfChanged("c", course, fake, 400);
    expect(fake.puts.at(-1)?.row.reachedAt).toBe(400);
  });
  it("republishes after a rename", async () => {
    setProgress({ solved: ["a1"] });
    joinAs("c", "Dana");
    await publishIfChanged("c", course, fake, 100);
    renamePlayer("c", "Dana K");
    expect(await publishIfChanged("c", course, fake, 200)).toBe("published");
    expect(fake.puts.at(-1)?.row).toMatchObject({ name: "Dana K", reachedAt: 100 });
  });
  it("a failed write is retried next time and never throws", async () => {
    setProgress({ solved: ["a1"] });
    joinAs("c", "Dana");
    fake.failNext = true;
    expect(await publishIfChanged("c", course, fake, 1)).toBe("failed");
    expect(readPublished("c")).toBeNull();
    expect(await publishIfChanged("c", course, fake, 2)).toBe("published");
  });
  it("never writes local progress", async () => {
    const before = JSON.stringify({ solved: ["a1"], read: ["a"] });
    localStorage.setItem("study:c", before);
    joinAs("c", "Dana");
    await publishIfChanged("c", course, fake, 1);
    expect(localStorage.getItem("study:c")).toBe(before);
  });
});

describe("hideRow", () => {
  beforeEach(() => localStorage.clear());

  it("sends the last published row again, hidden", async () => {
    const fake = fakeStore();
    setProgress({ solved: ["a1"] });
    const player = joinAs("c", "Dana");
    await publishIfChanged("c", course, fake, 50);
    await hideRow("c", fake);
    expect(fake.puts.at(-1)).toEqual({ courseId: "c", id: player.id, row: { name: "Dana", chapters: 0, reviews: 0, solved: 1, current: "a", reachedAt: 50, hidden: true } });
  });
  it("does nothing when nothing was published", async () => {
    const fake = fakeStore();
    await hideRow("c", fake);
    expect(fake.puts).toEqual([]);
  });
});
