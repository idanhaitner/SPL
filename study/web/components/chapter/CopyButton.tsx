"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/home/Icon";

export function CopyButton() {
  const button = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    const code = button.current?.closest(".code-panel")?.querySelector("pre code, pre");
    try {
      await navigator.clipboard.writeText(code?.textContent ?? "");
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 1600);
  }

  return (
    <button ref={button} type="button" className="code-copy" onClick={copy}>
      <Icon name={state === "copied" ? "check" : "copy"} />
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Couldn’t copy" : "Copy"}</span>
    </button>
  );
}
