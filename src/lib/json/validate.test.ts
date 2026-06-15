import { describe, it, expect } from "vitest";
import { validateJson } from "./validate";

const schema = JSON.stringify({
  type: "object",
  properties: { name: { type: "string" }, age: { type: "number" } },
  required: ["name"],
});

describe("validateJson", () => {
  it("passes valid data", () => {
    const r = validateJson('{"name":"Ann","age":30}', schema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.valid).toBe(true);
  });

  it("reports schema violations with a path", () => {
    const r = validateJson('{"name":123}', schema);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.valid).toBe(false);
      expect(r.value.issues.length).toBeGreaterThan(0);
      expect(r.value.issues[0].path).toBe("/name");
    }
  });

  it("errors on unparseable data", () => {
    const r = validateJson("{bad", schema);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/^Data:/);
  });

  it("errors on an unparseable schema", () => {
    const r = validateJson("{}", "{bad");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/^Schema:/);
  });
});
