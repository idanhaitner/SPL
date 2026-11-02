// Ctrl or Cmd + Enter or S runs, and Shift + Enter submits. Alt is left alone, since it belongs to the browser and the OS.
export function workspaceShortcut(event: Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey">): "run" | "submit" | null {
  if (event.altKey || !(event.ctrlKey || event.metaKey)) return null;
  if (event.key === "Enter") return event.shiftKey ? "submit" : "run";
  // A layout without Latin letters, like Hebrew, reports its own letter, so fall back to the physical key.
  const isS = /^[a-z]$/i.test(event.key) ? event.key.toLowerCase() === "s" : event.code === "KeyS";
  return isS && !event.shiftKey ? "run" : null;
}
