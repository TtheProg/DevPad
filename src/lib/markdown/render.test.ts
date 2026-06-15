import { describe, it, expect } from "vitest";
import { markdownToHtml } from "./render";

function sourceLines(html: string): number[] {
  return [...html.matchAll(/data-source-line="(\d+)"/g)].map((m) => Number(m[1]));
}

describe("markdownToHtml", () => {
  it("wraps each top-level block with an ascending data-source-line", () => {
    const html = markdownToHtml("# Title\n\nA paragraph.");
    const lines = sourceLines(html);
    expect(lines.length).toBe(2);
    expect(lines[0]).toBe(0);
    expect(lines[1]).toBeGreaterThan(0);
    // ascending
    expect([...lines].sort((a, b) => a - b)).toEqual(lines);
    expect(html).toContain("<h1");
    expect(html).toContain("A paragraph.");
  });

  it("renders GFM tables and lists", () => {
    const html = markdownToHtml("- one\n- two\n");
    expect(html).toContain("<li>one");
    expect(html).toContain('class="md-block"');
  });

  it("does not crash on empty input", () => {
    expect(markdownToHtml("")).toBe("");
  });
});
