// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Split } from "@/components/session/Split";
import { clampFraction, fractionLimits, moveFraction, parseSaved } from "./split";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const wide = fractionLimits(1000, 320, 320);

describe("split limits and movement", () => {
  it("keeps both panes at their minimums", () => {
    expect(wide).toEqual({ min: 0.32, max: 0.68 });
  });
  it("clamps a position saved on a larger window", () => {
    expect(clampFraction(0.9, wide)).toBe(0.68);
  });
  it("splits by the minimums when the window is too small for both", () => {
    const tight = fractionLimits(320, 320, 320);
    expect(tight.min).toBe(0.5);
    expect(tight.max).toBe(0.5);
  });
  it("does not limit before the size is known", () => {
    expect(fractionLimits(0, 320, 320)).toEqual({ min: 0, max: 1 });
  });
  it("moves by 2%, or 10% with Shift, on the divider's own axis", () => {
    expect(moveFraction(0.4, "ArrowRight", false, "vertical", wide)).toBeCloseTo(0.42);
    expect(moveFraction(0.4, "ArrowLeft", true, "vertical", wide)).toBeCloseTo(0.32);
    expect(moveFraction(0.65, "ArrowDown", false, "horizontal", wide)).toBeCloseTo(0.67);
    expect(moveFraction(0.4, "ArrowUp", false, "vertical", wide)).toBeNull();
  });
  it("goes to the limits with Home and End", () => {
    expect(moveFraction(0.4, "Home", false, "vertical", wide)).toBe(0.32);
    expect(moveFraction(0.4, "End", false, "vertical", wide)).toBe(0.68);
  });
  it.each([[null], ["abc"], ["-1"], ["2"], ["NaN"], ["0"], ["1"]])("falls back on saved value %s", (raw) => {
    expect(parseSaved(raw, 0.4)).toBe(0.4);
  });
  it("reads a valid saved value", () => {
    expect(parseSaved("0.55", 0.4)).toBe(0.55);
  });
});

describe("Split", () => {
  let host: HTMLElement;
  let root: Root;

  const divider = () => host.querySelector<HTMLElement>('[role="separator"]')!;
  const now = () => divider().getAttribute("aria-valuenow");
  const press = (key: string, init: KeyboardEventInit = {}) =>
    act(() => {
      divider().dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
    });

  function render(orientation: "vertical" | "horizontal" = "vertical") {
    act(() => {
      root.render(
        createElement(Split, {
          courseId: "c",
          name: "question",
          orientation,
          start: 0.4,
          minFirst: 320,
          minSecond: 320,
          label: "Resize panels",
          first: createElement("p", { id: "one" }, "one"),
          second: createElement("p", { id: "two" }, "two"),
        }),
      );
    });
  }

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      width: 1000,
      height: 1000,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 1000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    host = document.body.appendChild(document.createElement("div"));
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.restoreAllMocks();
  });

  it("renders an accessible separator at the starting position", () => {
    render();
    expect(divider().getAttribute("aria-orientation")).toBe("vertical");
    expect(divider().getAttribute("aria-label")).toBe("Resize panels");
    expect(divider().getAttribute("tabindex")).toBe("0");
    expect(now()).toBe("40");
    expect(divider().getAttribute("aria-valuemin")).toBe("32");
    expect(divider().getAttribute("aria-valuemax")).toBe("68");
  });

  it("renders both panes and exposes the position for CSS", () => {
    render("horizontal");
    const split = host.querySelector<HTMLElement>(".split")!;
    expect(split.dataset.orientation).toBe("horizontal");
    expect(split.style.getPropertyValue("--split")).toBe("40%");
    expect(host.querySelector("#one")).not.toBeNull();
    expect(host.querySelector("#two")).not.toBeNull();
  });

  it("moves with the arrow keys, saves, and remembers on remount", () => {
    render();
    press("ArrowRight");
    expect(now()).toBe("42");
    expect(Number(localStorage.getItem("study:c:split:question"))).toBeCloseTo(0.42);

    act(() => root.unmount());
    root = createRoot(host);
    render();
    expect(now()).toBe("42");
  });

  it("stops at the limit with Shift and an arrow", () => {
    render();
    press("ArrowLeft", { shiftKey: true });
    expect(now()).toBe("32");
  });

  it("returns to the start on double-click", () => {
    render();
    press("ArrowRight");
    act(() => {
      divider().dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    });
    expect(now()).toBe("40");
  });

  it("falls back to the start when the saved value is garbage", () => {
    localStorage.setItem("study:c:split:question", "garbage");
    expect(() => render()).not.toThrow();
    expect(now()).toBe("40");
  });

  it("falls back to the start when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => render()).not.toThrow();
    expect(now()).toBe("40");
  });

  it("shows a too-large saved position clamped, without overwriting it", () => {
    localStorage.setItem("study:c:split:question", "0.9");
    render();
    expect(now()).toBe("68");
    expect(localStorage.getItem("study:c:split:question")).toBe("0.9");
    press("ArrowLeft");
    expect(now()).toBe("66");
  });

  it("drags with the pointer and saves on release", () => {
    Object.assign(HTMLElement.prototype, {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    });
    render();
    const fire = (type: string, clientX: number) =>
      act(() => {
        const event = new MouseEvent(type, { clientX, clientY: 0, bubbles: true });
        Object.defineProperty(event, "pointerId", { value: 1 });
        divider().dispatchEvent(event);
      });
    fire("pointerdown", 400);
    fire("pointermove", 550);
    expect(now()).toBe("55");
    expect(localStorage.getItem("study:c:split:question")).toBeNull();
    fire("pointerup", 550);
    expect(Number(localStorage.getItem("study:c:split:question"))).toBeCloseTo(0.55);
  });
});
