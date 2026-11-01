// Ctrl or Cmd + Enter runs, and adding Shift submits. Alt is left alone, since it belongs to the browser and the OS.
export function workspaceShortcut(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey">): "run" | "submit" | null {
  if (event.key !== "Enter" || event.altKey || !(event.ctrlKey || event.metaKey)) return null;
  return event.shiftKey ? "submit" : "run";
}
