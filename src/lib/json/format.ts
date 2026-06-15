import { ok, err, positionToLineCol, type CodeError, type Result } from "../result";

/**
 * Parse JSON, returning a precise error (line/column) on failure instead of
 * throwing. V8's SyntaxError messages vary across versions, so we extract a
 * position from whatever shape we get and compute line/column ourselves.
 */
export function parseJson(text: string): Result<unknown> {
  if (text.trim() === "") {
    return err("Empty input — nothing to parse.");
  }
  try {
    return ok(JSON.parse(text));
  } catch (e) {
    return err(toJsonError(text, e));
  }
}

function toJsonError(text: string, e: unknown): CodeError {
  const message = e instanceof Error ? e.message : String(e);

  // Newer V8: "... in JSON at position 12 (line 2 column 5)"
  const lc = message.match(/line (\d+) column (\d+)/i);
  if (lc) {
    return {
      message: cleanMessage(message),
      line: Number(lc[1]),
      column: Number(lc[2]),
    };
  }

  // Older V8: "... in JSON at position 12"
  const pos = message.match(/position (\d+)/i);
  if (pos) {
    const { line, column } = positionToLineCol(text, Number(pos[1]));
    return { message: cleanMessage(message), line, column };
  }

  return { message: cleanMessage(message) };
}

/** Drop the trailing "in JSON at position …" noise once we've parsed it out. */
function cleanMessage(message: string): string {
  return message.replace(/\s+in JSON at position.*$/i, "").trim();
}

/** Pretty-print JSON with the given indent (spaces). */
export function formatJson(text: string, indent = 2): Result<string> {
  const parsed = parseJson(text);
  if (!parsed.ok) return parsed;
  return ok(JSON.stringify(parsed.value, null, indent));
}

/** Minify JSON to a single line. */
export function minifyJson(text: string): Result<string> {
  const parsed = parseJson(text);
  if (!parsed.ok) return parsed;
  return ok(JSON.stringify(parsed.value));
}
