import { describe, it, expect } from "vitest";
import { parseJson, formatJson, minifyJson } from "./format";
import { positionToLineCol } from "../result";

describe("parseJson", () => {
  it("parses valid JSON", () => {
    const r = parseJson('{"a": 1, "b": [2, 3]}');
    expect(r).toEqual({ ok: true, value: { a: 1, b: [2, 3] } });
  });

  it("rejects empty input", () => {
    const r = parseJson("   ");
    expect(r.ok).toBe(false);
  });

  it("reports a line/column on a syntax error", () => {
    const r = parseJson('{\n  "a": 1,\n}');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(typeof r.error.line).toBe("number");
      expect(r.error.line).toBeGreaterThanOrEqual(1);
      expect(r.error.message).not.toMatch(/in JSON at position/i);
    }
  });
});

describe("positionToLineCol", () => {
  it("maps a character index to 1-based line/column", () => {
    expect(positionToLineCol("ab\ncd\nef", 4)).toEqual({ line: 2, column: 2 });
    expect(positionToLineCol("abc", 0)).toEqual({ line: 1, column: 1 });
  });
});

describe("formatJson / minifyJson", () => {
  it("pretty-prints with the given indent", () => {
    const r = formatJson('{"a":1}', 2);
    expect(r).toEqual({ ok: true, value: '{\n  "a": 1\n}' });
  });

  it("minifies to a single line", () => {
    const r = minifyJson('{\n  "a": 1\n}');
    expect(r).toEqual({ ok: true, value: '{"a":1}' });
  });

  it("propagates parse errors", () => {
    expect(formatJson("not json").ok).toBe(false);
  });
});
