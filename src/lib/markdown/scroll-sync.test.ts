import { describe, it, expect } from "vitest";
import { lineToTop, topToLine, type BlockOffset } from "./scroll-sync";

const blocks: BlockOffset[] = [
  { line: 0, top: 0 },
  { line: 10, top: 100 },
  { line: 20, top: 300 },
];

describe("lineToTop", () => {
  it("interpolates between blocks", () => {
    expect(lineToTop(blocks, 5)).toBe(50);
    expect(lineToTop(blocks, 15)).toBe(200);
  });
  it("clamps outside the range", () => {
    expect(lineToTop(blocks, -3)).toBe(0);
    expect(lineToTop(blocks, 999)).toBe(300);
  });
  it("returns 0 for no blocks", () => {
    expect(lineToTop([], 5)).toBe(0);
  });
});

describe("topToLine", () => {
  it("inverts the mapping", () => {
    expect(topToLine(blocks, 50)).toBe(5);
    expect(topToLine(blocks, 200)).toBe(15);
  });
  it("clamps outside the range", () => {
    expect(topToLine(blocks, -10)).toBe(0);
    expect(topToLine(blocks, 9999)).toBe(20);
  });
});
