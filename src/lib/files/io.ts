/**
 * File I/O abstraction. On the web we use the File System Access API where the
 * browser supports it (Chromium), falling back to an <input type=file> for open
 * and a Blob download for save. The Tauri build (see M5) overrides `openTextFile`
 * / `saveTextFile` with native dialogs + real disk writes via dynamic import,
 * gated behind `isTauri()` — so this module stays free of Tauri imports and
 * still builds (and runs) as a pure static web app.
 */

export interface OpenedFile {
  name: string;
  content: string;
}

export function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

const hasFsAccess = () =>
  typeof window !== "undefined" && "showOpenFilePicker" in window;

/** Open a text file. Returns null if the user cancels. */
export async function openTextFile(extensions: string[]): Promise<OpenedFile | null> {
  if (isTauri()) return openViaTauri(extensions);

  if (hasFsAccess()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [handle] = await (window as any).showOpenFilePicker({
        multiple: false,
        types: [{ description: "Text files", accept: { "text/plain": extensions } }],
      });
      const file = await handle.getFile();
      return { name: file.name, content: await file.text() };
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return null;
      // Otherwise fall back to the input picker.
    }
  }
  return openViaInput(extensions);
}

function openViaInput(extensions: string[]): Promise<OpenedFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = extensions.join(",");
    input.onchange = async () => {
      const file = input.files?.[0];
      resolve(file ? { name: file.name, content: await file.text() } : null);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/** Save text. Uses a native dialog (Tauri) / save picker (Chromium) / download. */
export async function saveTextFile(
  content: string,
  suggestedName: string,
): Promise<void> {
  if (isTauri()) return saveViaTauri(content, suggestedName);

  if (hasFsAccess()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as any).showSaveFilePicker({ suggestedName });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      // fall through to download
    }
  }
  downloadTextFile(content, suggestedName);
}

/** Always-available fallback: trigger a browser download. */
export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --- Tauri branch (wired up in M5; dynamic import keeps web builds clean) ---

async function openViaTauri(extensions: string[]): Promise<OpenedFile | null> {
  const [{ open }, { readTextFile }] = await Promise.all([
    import("@tauri-apps/plugin-dialog"),
    import("@tauri-apps/plugin-fs"),
  ]);
  const selected = await open({
    multiple: false,
    filters: [{ name: "Text", extensions: extensions.map((e) => e.replace(/^\./, "")) }],
  });
  if (typeof selected !== "string") return null;
  const content = await readTextFile(selected);
  return { name: selected.split("/").pop() ?? selected, content };
}

async function saveViaTauri(content: string, suggestedName: string): Promise<void> {
  const [{ save }, { writeTextFile }] = await Promise.all([
    import("@tauri-apps/plugin-dialog"),
    import("@tauri-apps/plugin-fs"),
  ]);
  const path = await save({ defaultPath: suggestedName });
  if (typeof path === "string") await writeTextFile(path, content);
}
