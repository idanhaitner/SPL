import { describe, expect, it } from "vitest";
import { workspaceShortcut } from "./workspace";

const press = (key: string, mods: Partial<KeyboardEvent> = {}) =>
  workspaceShortcut({ key, code: "", ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...mods });

describe("workspaceShortcut", () => {
  it("runs on Cmd or Ctrl + Enter and submits with Shift", () => {
    expect(press("Enter", { metaKey: true })).toBe("run");
    expect(press("Enter", { ctrlKey: true })).toBe("run");
    expect(press("Enter", { metaKey: true, shiftKey: true })).toBe("submit");
  });

  it("runs on Cmd or Ctrl + S, with caps lock too", () => {
    expect(press("s", { metaKey: true })).toBe("run");
    expect(press("s", { ctrlKey: true })).toBe("run");
    expect(press("S", { metaKey: true })).toBe("run");
  });

  it("finds S by its physical key on a layout without Latin letters", () => {
    expect(press("ד", { code: "KeyS", metaKey: true })).toBe("run");
    // On Dvorak the physical S key types o, and that is not a save.
    expect(press("o", { code: "KeyS", metaKey: true })).toBeNull();
  });

  it("leaves other combinations to the browser and the editor", () => {
    expect(press("Enter")).toBeNull();
    expect(press("s")).toBeNull();
    expect(press("s", { metaKey: true, shiftKey: true })).toBeNull();
    expect(press("s", { metaKey: true, altKey: true })).toBeNull();
    expect(press("Enter", { metaKey: true, altKey: true })).toBeNull();
  });
});
