export type JsonType =
  | "object"
  | "array"
  | "string"
  | "number"
  | "boolean"
  | "null";

export interface TreeNode {
  /** Property name (objects), index (arrays), or null for the root. */
  key: string | number | null;
  type: JsonType;
  /** Present only for primitive nodes (string/number/boolean/null). */
  value?: string | number | boolean | null;
  /** Present only for containers (object/array). */
  children?: TreeNode[];
  /** Number of direct children, for containers. */
  size?: number;
}

export function jsonType(value: unknown): JsonType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const t = typeof value;
  if (t === "object") return "object";
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  return "string";
}

/** Build a render-friendly tree model from an already-parsed JSON value. */
export function buildTree(
  value: unknown,
  key: TreeNode["key"] = null,
): TreeNode {
  const type = jsonType(value);

  if (type === "array") {
    const arr = value as unknown[];
    return {
      key,
      type,
      size: arr.length,
      children: arr.map((v, i) => buildTree(v, i)),
    };
  }

  if (type === "object") {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj);
    return {
      key,
      type,
      size: entries.length,
      children: entries.map(([k, v]) => buildTree(v, k)),
    };
  }

  return { key, type, value: value as TreeNode["value"] };
}
