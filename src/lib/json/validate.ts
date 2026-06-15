import Ajv from "ajv";
import addFormats from "ajv-formats";
import { ok, err, type Result } from "../result";
import { parseJson } from "./format";

export interface ValidationIssue {
  /** JSON Pointer-ish path to the offending value, e.g. "/items/0/name". */
  path: string;
  message: string;
}

export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * Validate a JSON document against a JSON Schema. Both inputs are raw text;
 * parse errors in either are returned as a Result error. A *schema mismatch*
 * is not an error — it's a successful run with `valid: false` + issues.
 */
export function validateJson(
  dataText: string,
  schemaText: string,
): Result<ValidationReport> {
  const data = parseJson(dataText);
  if (!data.ok) return err({ ...data.error, message: `Data: ${data.error.message}` });

  const schema = parseJson(schemaText);
  if (!schema.ok)
    return err({ ...schema.error, message: `Schema: ${schema.error.message}` });

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  let validate;
  try {
    validate = ajv.compile(schema.value as object);
  } catch (e) {
    return err(`Invalid schema: ${e instanceof Error ? e.message : String(e)}`);
  }

  const valid = validate(data.value);
  if (valid) return ok({ valid: true, issues: [] });

  const issues: ValidationIssue[] = (validate.errors ?? []).map((e) => ({
    path: e.instancePath || "/",
    message: `${e.message ?? "is invalid"}${
      e.keyword === "additionalProperties" && e.params?.additionalProperty
        ? ` ('${e.params.additionalProperty}')`
        : ""
    }`,
  }));

  return ok({ valid: false, issues });
}
