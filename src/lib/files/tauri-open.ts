import { isTauri } from "./io";

/**
 * "Open with DevPad" / double-click handling for the native macOS app.
 *
 * The Rust side captures opened file paths (RunEvent::Opened) and both stores
 * them (drained via the `take_opened_files` command, for cold start) and emits
 * a `devpad://open-file` event (for files opened while running). This module
 * reads the file, routes it to the right tool by extension, stashes it in
 * sessionStorage, and navigates there. Each tool calls `consumePending` on
 * mount to pick it up. All of this only runs inside Tauri.
 */

export type ToolKind = "json" | "convert" | "markdown";

const ROUTES: Record<ToolKind, string> = {
  json: "/json/",
  convert: "/convert/",
  markdown: "/markdown/",
};

const KEY = "devpad:pending-file";

export interface PendingFile {
  tool: ToolKind;
  name: string;
  content: string;
}

export function toolForName(name: string): ToolKind {
  const lower = name.toLowerCase();
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  if (lower.endsWith(".yaml") || lower.endsWith(".yml") || lower.endsWith(".csv"))
    return "convert";
  return "json";
}

export function consumePending(tool: ToolKind): PendingFile | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const pending = JSON.parse(raw) as PendingFile;
    if (pending.tool !== tool) return null;
    sessionStorage.removeItem(KEY);
    return pending;
  } catch {
    return null;
  }
}

/** Run once per page (via the TauriBootstrap island). No-op on the web. */
export async function initTauriFileOpen(): Promise<void> {
  if (!isTauri()) return;

  const [{ invoke }, { listen }, { readTextFile }] = await Promise.all([
    import("@tauri-apps/api/core"),
    import("@tauri-apps/api/event"),
    import("@tauri-apps/plugin-fs"),
  ]);

  async function handlePaths(paths: string[] | null | undefined) {
    if (!paths || paths.length === 0) return;
    const path = paths[0];
    const name = path.split("/").pop() ?? path;
    let content: string;
    try {
      content = await readTextFile(path);
    } catch {
      return;
    }
    const tool = toolForName(name);
    sessionStorage.setItem(KEY, JSON.stringify({ tool, name, content }));

    const current = location.pathname.replace(/index\.html$/, "");
    if (current !== ROUTES[tool]) {
      location.assign(ROUTES[tool]);
    } else {
      window.dispatchEvent(new CustomEvent("devpad:pending"));
    }
  }

  // Cold start: files captured before this page's JS was ready.
  try {
    const initial = await invoke<string[]>("take_opened_files");
    await handlePaths(initial);
  } catch {
    /* command unavailable — ignore */
  }

  // Files opened while the app is already running.
  await listen<string[]>("devpad://open-file", (e) => {
    void handlePaths(e.payload);
  });
}
