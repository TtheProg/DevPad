import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { EditorView } from "@codemirror/view";
import { Editor, type EditorHandle } from "./Editor";
import { Button } from "./ui/Button";
import { useFileDrop } from "./useFileDrop";
import { renderMarkdown } from "../lib/markdown/render";
import { exportToPdf } from "../lib/markdown/pdf";
import { lineToTop, topToLine, type BlockOffset } from "../lib/markdown/scroll-sync";
import { openTextFile, saveTextFile } from "../lib/files/io";
import { consumePending } from "../lib/files/tauri-open";

type Mode = "split" | "edit" | "view";

const SAMPLE = `# DevPad Markdown

Write Markdown on the left, see it rendered on the right.

## Why it's nice

- **Live preview** as you type
- Press **⌘E / Ctrl+E** to flip edit↔view — your scroll position is kept
- Export to a clean **PDF** (everything stays on your device)

> No upload, no account, no server.

\`\`\`js
console.log("runs in your browser");
\`\`\`

| Feature | Status |
| --- | --- |
| Offline | ✅ |
| Private | ✅ |
`;

/** 0-based source line currently at the top of the editor viewport. */
function editorTopLine(view: EditorView): number {
  const block = view.lineBlockAtHeight(view.scrollDOM.scrollTop);
  return view.state.doc.lineAt(block.from).number - 1;
}

function scrollEditorToLine(view: EditorView, line0: number) {
  const lineNo = Math.min(Math.max(line0 + 1, 1), view.state.doc.lines);
  const pos = view.state.doc.line(lineNo).from;
  view.dispatch({ effects: EditorView.scrollIntoView(pos, { y: "start" }) });
}

function readBlocks(preview: HTMLElement): BlockOffset[] {
  return [...preview.querySelectorAll<HTMLElement>("[data-source-line]")].map(
    (el) => ({ line: Number(el.dataset.sourceLine), top: el.offsetTop }),
  );
}

export function MarkdownTool() {
  const [md, setMd] = useState(SAMPLE);
  const [mode, setMode] = useState<Mode>("split");

  const editorRef = useRef<EditorHandle>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  // A scroll target to apply *after* a mode change re-renders the panes.
  const pendingScroll = useRef<{ target: "editor" | "preview"; line: number } | null>(null);
  const syncing = useRef(false);

  const html = useMemo(() => renderMarkdown(md), [md]);

  /** The ⌘E showcase: flip edit↔view, carrying the scroll position across. */
  function toggleEditView() {
    const view = editorRef.current?.getView();
    const preview = previewRef.current;

    if (mode === "view") {
      // View → Edit: map preview scroll back to a source line.
      let line = 0;
      if (preview) line = topToLine(readBlocks(preview), preview.scrollTop);
      pendingScroll.current = { target: "editor", line };
      setMode("edit");
    } else {
      // Edit/Split → View: map the editor's top line to a preview offset.
      const line = view ? editorTopLine(view) : 0;
      pendingScroll.current = { target: "preview", line };
      setMode("view");
    }
  }

  // Apply the carried-over scroll position once the new pane is in the DOM.
  useLayoutEffect(() => {
    const pending = pendingScroll.current;
    if (!pending) return;
    pendingScroll.current = null;

    if (pending.target === "preview" && previewRef.current) {
      previewRef.current.scrollTop = lineToTop(
        readBlocks(previewRef.current),
        pending.line,
      );
    } else if (pending.target === "editor") {
      const view = editorRef.current?.getView();
      if (view) scrollEditorToLine(view, pending.line);
    }
  }, [mode]);

  // Keyboard shortcut: ⌘E / Ctrl+E.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        toggleEditView();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Live scroll sync (editor → preview) while in split mode.
  function onEditorScroll() {
    if (mode !== "split" || syncing.current) return;
    const view = editorRef.current?.getView();
    const preview = previewRef.current;
    if (!view || !preview) return;
    syncing.current = true;
    preview.scrollTop = lineToTop(readBlocks(preview), editorTopLine(view));
    requestAnimationFrame(() => (syncing.current = false));
  }

  // Attach a scroll listener to the editor's scroller in split mode.
  useEffect(() => {
    if (mode !== "split") return;
    const view = editorRef.current?.getView();
    const scroller = view?.scrollDOM;
    if (!scroller) return;
    scroller.addEventListener("scroll", onEditorScroll);
    return () => scroller.removeEventListener("scroll", onEditorScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function open() {
    const file = await openTextFile([".md", ".markdown", ".txt"]);
    if (file) setMd(file.content);
  }

  const { dragging, dropProps } = useFileDrop((file) => setMd(file.content));

  // Pick up files opened via the native app (double-click / "Open with").
  useEffect(() => {
    const load = () => {
      const pending = consumePending("markdown");
      if (pending) setMd(pending.content);
    };
    load();
    window.addEventListener("devpad:pending", load);
    return () => window.removeEventListener("devpad:pending", load);
  }, []);

  const showEditor = mode === "split" || mode === "edit";
  const showPreview = mode === "split" || mode === "view";

  return (
    <div
      className={`space-y-3 rounded-lg transition-shadow ${
        dragging ? "ring-2 ring-[var(--color-accent)]" : ""
      }`}
      {...dropProps}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-[var(--color-border)] overflow-hidden text-sm">
          {(["edit", "split", "view"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 capitalize transition-colors ${
                mode === m
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                  : "hover:bg-[var(--color-surface)]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <Button variant="ghost" onClick={toggleEditView} title="Toggle edit/view">
          ⌘E Toggle
        </Button>

        <Button onClick={open} className="ml-auto">
          Open…
        </Button>
        <Button onClick={() => saveTextFile(md, "document.md")}>Download</Button>
        <Button
          variant="primary"
          onClick={() => exportToPdf(html, "DevPad document")}
        >
          Export PDF
        </Button>
      </div>

      <div
        className={`grid gap-3 ${mode === "split" ? "md:grid-cols-2" : "grid-cols-1"}`}
      >
        {showEditor && (
          <Editor
            ref={editorRef}
            value={md}
            onChange={setMd}
            language="markdown"
            ariaLabel="Markdown source"
            className="h-[70vh] rounded-lg border border-[var(--color-border)] overflow-hidden"
          />
        )}

        {showPreview && (
          <div
            ref={previewRef}
            className="md-preview h-[70vh] overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
