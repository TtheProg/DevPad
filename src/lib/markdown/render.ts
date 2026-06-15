import { marked, type Token } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ gfm: true, breaks: false });

/**
 * Render Markdown to HTML where each top-level block is wrapped in a
 * `<div class="md-block" data-source-line="N">` (N = 0-based source line of the
 * block's first line). That attribute is what powers the edit↔view scroll sync.
 *
 * This function is pure (marked only) and node-testable. It does NOT sanitize —
 * callers MUST pass the output through `sanitizeHtml` before inserting it into
 * the DOM.
 */
export function markdownToHtml(md: string): string {
  const tokens = marked.lexer(md);
  const parts: string[] = [];
  let line = 0; // lines consumed so far (0-based index of the next block)

  for (const token of tokens) {
    const startLine = line;
    line += countLines((token as Token & { raw?: string }).raw ?? "");

    if (token.type === "space") continue;

    const html = marked.parser([token] as Token[]);
    parts.push(`<div class="md-block" data-source-line="${startLine}">${html}</div>`);
  }

  return parts.join("");
}

function countLines(raw: string): number {
  let n = 0;
  for (let i = 0; i < raw.length; i++) if (raw[i] === "\n") n++;
  return n;
}

/** Sanitize rendered HTML. Browser-only (DOMPurify needs a DOM at call time). */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

/** Convenience: render + sanitize. Browser-only. */
export function renderMarkdown(md: string): string {
  return sanitizeHtml(markdownToHtml(md));
}
