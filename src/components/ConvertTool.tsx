import { useEffect, useMemo, useState } from "react";
import { Editor, type EditorLanguage } from "./Editor";
import { Button } from "./ui/Button";
import { useFileDrop } from "./useFileDrop";
import { formatJson } from "../lib/json/format";
import { jsonToYaml, yamlToJson } from "../lib/convert/yaml";
import { jsonToCsv, csvToJson } from "../lib/convert/csv";
import { openTextFile, saveTextFile } from "../lib/files/io";
import { consumePending } from "../lib/files/tauri-open";
import type { Result } from "../lib/result";

type Format = "json" | "yaml" | "csv";

const FORMATS: Format[] = ["json", "yaml", "csv"];
const SAMPLE = `{
  "name": "DevPad",
  "offline": true,
  "tools": ["json", "convert", "markdown"]
}`;

/** Any source format → JSON text (the common intermediary). */
function toJson(input: string, from: Format): Result<string> {
  if (from === "json") return formatJson(input);
  if (from === "yaml") return yamlToJson(input);
  return csvToJson(input);
}

/** JSON text → any target format. */
function fromJson(jsonText: string, to: Format): Result<string> {
  if (to === "json") return formatJson(jsonText);
  if (to === "yaml") return jsonToYaml(jsonText);
  return jsonToCsv(jsonText);
}

function convert(input: string, from: Format, to: Format): Result<string> {
  if (input.trim() === "") return { ok: true, value: "" };
  const json = toJson(input, from);
  if (!json.ok) return json;
  return fromJson(json.value, to);
}

const editorLang = (f: Format): EditorLanguage => (f === "json" ? "json" : "plain");

function FormatSelect({
  value,
  onChange,
  label,
}: {
  value: Format;
  onChange: (f: Format) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-[var(--color-muted)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Format)}
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 uppercase"
      >
        {FORMATS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ConvertTool() {
  const [input, setInput] = useState(SAMPLE);
  const [from, setFrom] = useState<Format>("json");
  const [to, setTo] = useState<Format>("yaml");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => convert(input, from, to), [input, from, to]);

  function swap() {
    setFrom(to);
    setTo(from);
    if (output.ok) setInput(output.value);
  }

  async function copy() {
    if (!output.ok) return;
    await navigator.clipboard.writeText(output.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function open() {
    const file = await openTextFile([".json", ".yaml", ".yml", ".csv", ".txt"]);
    if (file) setInput(file.content);
  }

  const { dragging, dropProps } = useFileDrop((file) => setInput(file.content));

  // Pick up files opened via the native app (double-click / "Open with").
  useEffect(() => {
    const load = () => {
      const pending = consumePending("convert");
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
      <div className="flex flex-wrap items-center gap-3">
        <FormatSelect value={from} onChange={setFrom} label="From" />
        <Button variant="ghost" onClick={swap} title="Swap formats">
          ⇄ Swap
        </Button>
        <FormatSelect value={to} onChange={setTo} label="To" />
        <Button onClick={open}>Open…</Button>
        <Button
          onClick={() => output.ok && saveTextFile(output.value, `output.${to}`)}
          disabled={!output.ok}
        >
          Download
        </Button>
        <Button onClick={copy} disabled={!output.ok} className="ml-auto">
          {copied ? "Copied ✓" : "Copy output"}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            {from}
          </div>
          <Editor
            value={input}
            onChange={setInput}
            language={editorLang(from)}
            ariaLabel={`${from} input`}
            className="h-[60vh] rounded-lg border border-[var(--color-border)] overflow-hidden"
          />
        </div>

        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            {to}
          </div>
          {output.ok ? (
            <Editor
              value={output.value}
              language={editorLang(to)}
              readOnly
              ariaLabel={`${to} output`}
              className="h-[60vh] rounded-lg border border-[var(--color-border)] overflow-hidden"
            />
          ) : (
            <div className="h-[60vh] rounded-lg border border-[var(--color-err)] bg-[var(--color-surface)] p-4">
              <p className="font-mono text-sm text-[var(--color-err)]">
                ✗ {output.error.message}
                {output.error.line != null && ` (line ${output.error.line})`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
