import { describe, it, expect } from "vitest";
import { jsonToYaml, yamlToJson } from "./yaml";

describe("jsonToYaml", () => {
  it("converts JSON to YAML", () => {
    const r = jsonToYaml('{"a":1,"b":["x","y"]}');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toContain("a: 1");
      expect(r.value).toContain("- x");
    }
  });

  it("propagates JSON parse errors", () => {
    expect(jsonToYaml("{bad").ok).toBe(false);
  });
});

describe("yamlToJson", () => {
  it("converts YAML to pretty JSON", () => {
    const r = yamlToJson("a: 1\nb:\n  - x\n  - y\n");
    expect(r.ok).toBe(true);
    if (r.ok) expect(JSON.parse(r.value)).toEqual({ a: 1, b: ["x", "y"] });
  });

  it("reports a line on invalid YAML", () => {
    const r = yamlToJson("a: b: c");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(typeof r.error.line).toBe("number");
  });

  it("round-trips JSON → YAML → JSON", () => {
    const original = { name: "Ann", tags: ["a", "b"], nested: { x: 1 } };
    const yaml = jsonToYaml(JSON.stringify(original));
    expect(yaml.ok).toBe(true);
    if (yaml.ok) {
      const back = yamlToJson(yaml.value);
      expect(back.ok).toBe(true);
      if (back.ok) expect(JSON.parse(back.value)).toEqual(original);
    }
  });
});
