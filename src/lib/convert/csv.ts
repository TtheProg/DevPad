import Papa from "papaparse";
import { ok, err, type Result } from "../result";
import { parseJson } from "../json/format";

/**
 * JSON text → CSV text. Expects an array of objects (the common API-response
 * shape). Nested values (objects/arrays) are stored as compact JSON strings in
 * the cell so the data survives the round-trip instead of becoming
 * "[object Object]".
 */
export function jsonToCsv(jsonText: string): Result<string> {
  const parsed = parseJson(jsonText);
  if (!parsed.ok) return parsed;

  const value = parsed.value;
  if (!Array.isArray(value)) {
    return err("CSV export expects a top-level array of objects.");
  }
  if (value.length === 0) return ok("");

  const rows = value.map((row) => flattenCell(row));
  try {
    return ok(Papa.unparse(rows));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

function flattenCell(row: unknown): Record<string, unknown> {
  if (row === null || typeof row !== "object" || Array.isArray(row)) {
    // A non-object row (e.g. a bare number) becomes a single "value" column.
    return { value: row };
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
    out[k] = v !== null && typeof v === "object" ? JSON.stringify(v) : v;
  }
  return out;
}

/** CSV text → pretty JSON text (array of objects, header row required). */
export function csvToJson(csvText: string, indent = 2): Result<string> {
  if (csvText.trim() === "") return err("Empty input — nothing to parse.");

  const result = Papa.parse(csvText.trim(), {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    const e = result.errors[0];
    return err({
      message: e.message,
      line: typeof e.row === "number" ? e.row + 2 : undefined, // +1 header, +1 for 1-based
    });
  }

  return ok(JSON.stringify(result.data, null, indent));
}
