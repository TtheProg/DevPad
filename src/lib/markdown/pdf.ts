/**
 * Markdown → PDF via the browser's print pipeline (zero-dependency, zero-cost,
 * and produces clean, selectable-text PDFs). `buildPrintDocument` is a pure
 * string builder (testable); `exportToPdf` performs the browser-only print.
 */

const PRINT_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    font: 16px/1.6 -apple-system, system-ui, "Segoe UI", sans-serif;
    color: #1a1a1a; background: #fff;
    max-width: 720px; margin: 2rem auto; padding: 0 1.5rem;
  }
  h1, h2, h3 { line-height: 1.25; margin: 1.4em 0 0.5em; }
  h1 { font-size: 2em; } h2 { font-size: 1.5em; } h3 { font-size: 1.2em; }
  p, ul, ol, blockquote, table { margin: 0 0 1em; }
  code { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 0.9em;
    background: #f2f2f2; padding: 0.15em 0.35em; border-radius: 4px; }
  pre { background: #f6f8fa; padding: 1em; border-radius: 8px; overflow: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 4px solid #ddd; padding-left: 1em; color: #555; margin-left: 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 0.4em 0.6em; text-align: left; }
  img { max-width: 100%; }
  a { color: #0969da; }
  @media print {
    body { margin: 0; max-width: none; }
    @page { margin: 2cm; }
  }
`;

/** Wrap sanitized body HTML in a standalone, print-styled HTML document. */
export function buildPrintDocument(bodyHtml: string, title = "Document"): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>${PRINT_STYLES}</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Browser-only: render the document into a hidden iframe and trigger the print
 * dialog ("Save as PDF"). Using an iframe keeps the app's own styles out of the
 * printout and avoids popup blockers.
 */
export function exportToPdf(bodyHtml: string, title = "Document"): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(buildPrintDocument(bodyHtml, title));
  doc.close();

  const win = iframe.contentWindow;
  const cleanup = () => setTimeout(() => iframe.remove(), 1000);
  win?.addEventListener("afterprint", cleanup);
  // Give the iframe a tick to lay out before printing.
  setTimeout(() => {
    win?.focus();
    win?.print();
    cleanup();
  }, 50);
}
