import { useEffect, useMemo, useState } from "react";
import { Editor } from "./Editor";
import { TreeView } from "./TreeView";
import { Button } from "./ui/Button";
import { useFileDrop } from "./useFileDrop";
import { parseJson, formatJson, minifyJson } from "../lib/json/format";
import { buildTree } from "../lib/json/tree";
import { validateJson } from "../lib/json/validate";
import { openTextFile, saveTextFile } from "../lib/files/io";
import { consumePending } from "../lib/files/tauri-open";

const SAMPLE = `{
  "name": "DevPad",
  "offline": true,
  "tools": ["json", "convert", "markdown"],
  "stars": 0,
  "meta": { "private": true, "cost": 0 }
}`;

type Panel = "tree" | "validate";

export function JsonTool() {
  const [input, setInput] = useState(SAMPLE);
  const [panel, setPanel] = useState<Panel>("tree");
  const [schema, setSchema] = useState("");
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseJson(input), [input]);
  const tree = useMemo(
    () => (parsed.ok ? buildTree(parsed.value) : null),
    [parsed],
  );
  const validation = useMemo(() => {
    if (panel !== "validate" || schema.trim() === "") return null;
    return validateJson(input, schema);
  }, [panel, schema, input]);

  function apply(result: ReturnType<typeof formatJson>) {
    if (result.ok) setInput(result.value);
  }

  async function copy() {
    await navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function open() {
    const file = await openTextFile([".json", ".txt"]);
    if (file) setInput(file.content);
  }

  const { dragging, dropProps } = useFileDrop((file) => setInput(file.content));

  // Pick up files opened via the native app (double-click / "Open with").
  useEffect(() => {
    const load = () => {
      const pending = consumePending("json");
      if (pending) setInput(pending.content);
    };
    load();
    window.addEventListener("devpad:pending", load);
    return () => window.removeEventListener("devpad:pending", load);
  }, []);

  return (
    <div
      className={`space-y-3 rounded-lg transition-shadow ${
        dragging ? "ring-2 ring-[var(--color-accent)]" : ""
      }`}
      {...dropProps}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => apply(formatJson(input))} disabled={!parsed.ok}>
          Format
        </Button>
        <Button onClick={() => apply(minifyJson(input))} disabled={!parsed.ok}>
          Minify
        </Button>
        <Button onClick={copy}>{copied ? "Copied ✓" : "Copy"}</Button>
        <Button onClick={open}>Open…</Button>
        <Button onClick={() => saveTextFile(input, "data.json")}>Download</Button>
        <Button variant="ghost" onClick={() => setInput("")}>
          Clear
        </Button>
        <Button variant="ghost" onClick={() => setInput(SAMPLE)}>
          Sample
        </Button>

        <span className="ml-auto text-sm font-mono">
          {parsed.ok ? (
            <span className="text-[var(--color-ok)]">✓ Valid JSON</span>
          ) : (
            <span className="text-[var(--color-err)]">
              ✗ {parsed.error.message}
              {parsed.error.line != null &&
                ` (line ${parsed.error.line}${
                  parsed.error.column != null
                    ? `, col ${parsed.error.column}`
                    : ""
                })`}
            </span>
          )}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Editor
          value={input}
          onChange={setInput}
          language="json"
          ariaLabel="JSON input"
          className="h-[60vh] rounded-lg border border-[var(--color-border)] overflow-hidden"
        />

        <div className="h-[60vh] flex flex-col rounded-lg border border-[var(--color-border)] overflow-hidden">
          <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface)] text-sm">
            {(["tree", "validate"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPanel(p)}
                className={`px-4 py-2 capitalize transition-colors ${
                  panel === p
                    ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-fg)]"
                }`}
              >
                {p === "validate" ? "Schema validate" : "Tree"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            {panel === "tree" &&
              (tree ? (
                <TreeView root={tree} />
              ) : (
                <p className="p-4 text-sm text-[var(--color-muted)]">
                  Fix the JSON to see its tree.
                </p>
              ))}

            {panel === "validate" && (
              <div className="flex h-full flex-col">
                <Editor
                  value={schema}
                  onChange={setSchema}
                  language="json"
                  ariaLabel="JSON Schema"
                  className="h-40 border-b border-[var(--color-border)]"
                />
                <div className="p-3 text-sm">
                  {schema.trim() === "" ? (
                    <p className="text-[var(--color-muted)]">
                      Paste a JSON Schema above to validate the document against
                      it.
                    </p>
                  ) : validation && !validation.ok ? (
                    <p className="text-[var(--color-err)] font-mono">
                      {validation.error.message}
                    </p>
                  ) : validation && validation.ok && validation.value.valid ? (
                    <p className="text-[var(--color-ok)] font-mono">
                      ✓ Document matches the schema.
                    </p>
                  ) : validation && validation.ok ? (
                    <ul className="space-y-1 font-mono text-[var(--color-err)]">
                      {validation.value.issues.map((issue, i) => (
                        <li key={i}>
                          <span className="text-[var(--color-muted)]">
                            {issue.path}
                          </span>{" "}
                          {issue.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
