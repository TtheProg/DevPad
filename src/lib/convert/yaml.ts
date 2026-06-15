import { load, dump, YAMLException } from "js-yaml";
import { ok, err, type CodeError, type Result } from "../result";
import { parseJson } from "../json/format";

/** JSON text → YAML text. */
export function jsonToYaml(jsonText: string): Result<string> {
  const parsed = parseJson(jsonText);
  if (!parsed.ok) return parsed;
  try {
    // lineWidth: -1 keeps long strings on one line (no surprise wrapping).
    return ok(dump(parsed.value, { lineWidth: -1, noRefs: true }));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/** YAML text → pretty JSON text. */
export function yamlToJson(yamlText: string, indent = 2): Result<string> {
  if (yamlText.trim() === "") return err("Empty input — nothing to parse.");
  try {
    const value = load(yamlText);
    return ok(JSON.stringify(value, null, indent));
  } catch (e) {
    return err(toYamlError(e));
  }
}

function toYamlError(e: unknown): CodeError {
  if (e instanceof YAMLException && e.mark) {
    return {
      message: e.reason || e.message,
      line: e.mark.line + 1, // js-yaml marks are 0-based
      column: e.mark.column + 1,
    };
  }
  return { message: e instanceof Error ? e.message : String(e) };
}
