import { describe, it, expect } from "vitest";
import { buildPrintDocument } from "./pdf";

describe("buildPrintDocument", () => {
  it("embeds the title, body and print styles", () => {
    const doc = buildPrintDocument("<p>Hi</p>", "My Doc");
    expect(doc).toContain("<!doctype html>");
    expect(doc).toContain("<title>My Doc</title>");
    expect(doc).toContain("<p>Hi</p>");
    expect(doc).toContain("@media print");
  });

  it("escapes the title to prevent markup injection", () => {
    const doc = buildPrintDocument("body", "<b>&");
    expect(doc).toContain("&lt;b&gt;&amp;");
    expect(doc).not.toContain("<title><b>");
  });
});
