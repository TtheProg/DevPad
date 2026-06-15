import { describe, it, expect } from "vitest";
import { buildTree, jsonType } from "./tree";

describe("jsonType", () => {
  it("distinguishes null, array and object from primitives", () => {
    expect(jsonType(null)).toBe("null");
    expect(jsonType([])).toBe("array");
    expect(jsonType({})).toBe("object");
    expect(jsonType("x")).toBe("string");
    expect(jsonType(1)).toBe("number");
    expect(jsonType(true)).toBe("boolean");
  });
});

describe("buildTree", () => {
  it("builds a tree for nested structures", () => {
    const tree = buildTree({ a: 1, b: [true, "x"] });
    expect(tree.type).toBe("object");
    expect(tree.size).toBe(2);
    expect(tree.children?.[0]).toEqual({ key: "a", type: "number", value: 1 });

    const arr = tree.children?.[1];
    expect(arr?.type).toBe("array");
    expect(arr?.key).toBe("b");
    expect(arr?.size).toBe(2);
    expect(arr?.children?.[0]).toEqual({ key: 0, type: "boolean", value: true });
    expect(arr?.children?.[1]).toEqual({ key: 1, type: "string", value: "x" });
  });

  it("represents a primitive root", () => {
    expect(buildTree(42)).toEqual({ key: null, type: "number", value: 42 });
  });
});
