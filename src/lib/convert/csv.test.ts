import { describe, it, expect } from "vitest";
import { jsonToCsv, csvToJson } from "./csv";

describe("jsonToCsv", () => {
  it("converts an array of objects", () => {
    const r = jsonToCsv('[{"name":"Ann","age":30},{"name":"Bo","age":25}]');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toMatch(/^name,age/);
      expect(r.value).toContain("Ann");
      expect(r.value).toContain("30");
    }
  });

  it("serializes nested values as JSON strings (no [object Object])", () => {
    const r = jsonToCsv('[{"a":1,"b":{"x":2}}]');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).not.toContain("[object Object]");
      expect(r.value).toContain("x");
      expect(r.value).toContain("2");
    }
  });

  it("rejects a non-array top level", () => {
    const r = jsonToCsv('{"a":1}');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/array/i);
  });

  it("returns empty string for an empty array", () => {
    expect(jsonToCsv("[]")).toEqual({ ok: true, value: "" });
  });
});

describe("csvToJson", () => {
  it("parses a CSV with a header row, typing numbers", () => {
    const r = csvToJson("name,age\nAnn,30\nBo,25");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(JSON.parse(r.value)).toEqual([
        { name: "Ann", age: 30 },
        { name: "Bo", age: 25 },
      ]);
    }
  });

  it("rejects empty input", () => {
    expect(csvToJson("  ").ok).toBe(false);
  });

  it("round-trips JSON → CSV → JSON for flat rows", () => {
    const original = [
      { name: "Ann", age: 30 },
      { name: "Bo", age: 25 },
    ];
    const csv = jsonToCsv(JSON.stringify(original));
    expect(csv.ok).toBe(true);
    if (csv.ok) {
      const back = csvToJson(csv.value);
      expect(back.ok).toBe(true);
      if (back.ok) expect(JSON.parse(back.value)).toEqual(original);
    }
  });
});
