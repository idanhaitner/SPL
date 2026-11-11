import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadCourse, withPracticeTitles } from "./course";
import { matchHits } from "./search";
import type { Course, SearchHit } from "./types";

const hit = (kind: string, title: string, text = "", href = `/${title}`): SearchHit => ({ kind, title, text, href });

const HITS = [
  hit("Practice", "A question", "Why does a stack frame vanish?"),
  hit("Chapter", "Memory", "The stack and the heap. מצביע"),
  hit("Chapter", "Pointers", "An address in a variable. מצביע, מחסנית"),
  hit("Glossary", "Stack", "Where calls keep their locals."),
];

describe("matchHits", () => {
  it("finds a chapter by a Hebrew term in its text", () => {
    expect(matchHits(HITS, "מצביע").map((item) => item.title)).toContain("Pointers");
  });

  it("ranks a whole review before a single question, like a chapter", () => {
    const hits = [hit("Practice", "stack question", "stack"), hit("Review", "Review: stack", "stack")];
    expect(matchHits(hits, "stack").map((item) => item.kind)).toEqual(["Review", "Practice"]);
  });

  it("ignores case in the query and in the index", () => {
    expect(matchHits(HITS, "POINTERS").map((item) => item.title)).toEqual(["Pointers"]);
    expect(matchHits([hit("Chapter", "RAII")], "raii")).toHaveLength(1);
  });

  it("returns nothing for an empty or blank query", () => {
    expect(matchHits(HITS, "")).toEqual([]);
    expect(matchHits(HITS, "  \t ")).toEqual([]);
  });

  it("ignores bidi control marks in the query and in the index", () => {
    expect(matchHits(HITS, "‏מצב‎יע‬").map((item) => item.title)).toContain("Pointers");
    expect(matchHits([hit("Chapter", "Heap", "⁧ערימה⁩")], "ערימה")).toHaveLength(1);
    expect(matchHits([hit("Chapter", "Heap", "‏ערי‏מה")], "ערימה")).toHaveLength(1);
    expect(matchHits(HITS, "‏‎")).toEqual([]);
  });

  it("ranks title matches above text matches", () => {
    expect(matchHits(HITS, "stack").map((item) => item.title)).toEqual(["Stack", "Memory", "A question"]);
  });

  it("returns at most 8 results, and keeps title matches when cutting", () => {
    const many = Array.from({ length: 12 }, (_, index) => hit("Practice", `Q${index}`, "pointer"));
    const list = [...many, hit("Glossary", "Pointer")];
    const found = matchHits(list, "pointer");
    expect(found).toHaveLength(8);
    expect(found[0].title).toBe("Pointer");
  });

  it("matches across a line break in the index", () => {
    expect(matchHits([hit("Chapter", "Heap", "dangling\n  pointer")], "dangling pointer")).toHaveLength(1);
  });
});

describe("loadSearchIndex", () => {
  const ok = (body: unknown) => ({ ok: true, json: async () => body }) as Response;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("fetches once and keeps the result for the session", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
    const fetchMock = vi.fn(async () => ok([hit("Chapter", "Pointers")]));
    vi.stubGlobal("fetch", fetchMock);
    const { loadSearchIndex: load } = await import("./search");
    await load();
    expect((await load())[0].title).toBe("Pointers");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/search.json");
  });

  it("uses the base path", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/SPL");
    const fetchMock = vi.fn(async () => ok([]));
    vi.stubGlobal("fetch", fetchMock);
    const { loadSearchIndex: load } = await import("./search");
    await load();
    expect(fetchMock).toHaveBeenCalledWith("/SPL/search.json");
  });

  it("does not keep a failure, so the next call tries again", async () => {
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValueOnce(ok({ not: "a list" }))
      .mockResolvedValueOnce(ok([hit("Chapter", "Pointers")]));
    vi.stubGlobal("fetch", fetchMock);
    const { loadSearchIndex: load } = await import("./search");
    await expect(load()).rejects.toThrow();
    await expect(load()).rejects.toThrow();
    await expect(load()).rejects.toThrow();
    await expect(load()).resolves.toHaveLength(1);
  });
});

describe("practice links", () => {
  const problem = (id: string, kind: string) => ({ type: "directive", name: "problem", attrs: { id, kind, title: `Title of ${id}` }, children: [] });
  const course = {
    topics: [{ id: "pointers", blocks: [problem("ps-one", "exercise"), problem("exam-one", "exam"), problem("worked-one", "worked")] }],
    search: [
      hit("Chapter", "Pointers", "", "/topics/pointers"),
      hit("Practice", "raw", "", "/topics/pointers#ps-one"),
      hit("Practice", "raw", "", "/topics/pointers#exam-one"),
      hit("Practice", "raw", "", "/topics/pointers#worked-one"),
    ],
  } as unknown as Course;

  const hrefs = () => withPracticeTitles(course).search.map((item) => item.href);

  it("sends exercises and exam questions to their session step", () => {
    expect(hrefs()).toContain("/sessions/pointers/?step=ps-one");
    expect(hrefs()).toContain("/sessions/pointers/?step=exam-one");
  });

  it("keeps a worked example in its chapter", () => {
    expect(hrefs()).toContain("/topics/pointers/#worked-one");
  });

  it("names worked examples for what they are, and uses the problem's own title", () => {
    const worked = withPracticeTitles(course).search.find((item) => item.href.endsWith("#worked-one"));
    expect(worked?.kind).toBe("Worked");
    expect(worked?.title).toBe("Title of worked-one");
  });

  it("leaves other hits alone", () => {
    expect(hrefs()).toContain("/topics/pointers");
  });
});

describe("the real course index", () => {
  it("finds the pointers chapter by its Hebrew term", { timeout: 60_000 }, () => {
    const found = matchHits(loadCourse().search, "מצביע");
    expect(found.some((item) => item.kind === "Chapter" && item.href === "/topics/pointers")).toBe(true);
  });

  it("finds a chapter by words deep in its body, and stays compact", { timeout: 60_000 }, () => {
    const { search } = loadCourse();
    const found = matchHits(search, "uninitialized pointer");
    expect(found.some((item) => item.href === "/topics/pointers")).toBe(true);
    expect(JSON.stringify(search).length).toBeLessThan(200_000);
  });

  it("gives every worked example a chapter link and no session link", { timeout: 60_000 }, () => {
    const { search } = loadCourse();
    const pointerStep = search.find((item) => item.href.includes("#worked-pointer-step"));
    expect(pointerStep?.href).toBe("/topics/pointers/#worked-pointer-step");
    expect(search.some((item) => item.href.includes("step=worked-"))).toBe(false);
  });
});
