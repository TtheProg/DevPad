/**
 * Pure scroll-sync math for the Markdown edit↔view toggle.
 *
 * The view pane has block elements tagged with `data-source-line` (see
 * markdownToHtml). We read each block's source line + pixel offset into an array
 * of {line, top}, then interpolate in either direction. Keeping the math pure
 * (no DOM) makes the fiddly part unit-testable; a thin DOM reader lives in the
 * component.
 */
export interface BlockOffset {
  /** 0-based source line of the block. */
  line: number;
  /** Pixel offset (scrollTop) at which the block sits. */
  top: number;
}

/** Source line → pixel offset, linearly interpolated between known blocks. */
export function lineToTop(blocks: BlockOffset[], line: number): number {
  if (blocks.length === 0) return 0;
  if (line <= blocks[0].line) return blocks[0].top;
  const last = blocks[blocks.length - 1];
  if (line >= last.line) return last.top;

  for (let i = 0; i < blocks.length - 1; i++) {
    const a = blocks[i];
    const b = blocks[i + 1];
    if (line >= a.line && line <= b.line) {
      return interpolate(line, a.line, b.line, a.top, b.top);
    }
  }
  return last.top;
}

/** Pixel offset → source line, the inverse mapping. */
export function topToLine(blocks: BlockOffset[], top: number): number {
  if (blocks.length === 0) return 0;
  if (top <= blocks[0].top) return blocks[0].line;
  const last = blocks[blocks.length - 1];
  if (top >= last.top) return last.line;

  for (let i = 0; i < blocks.length - 1; i++) {
    const a = blocks[i];
    const b = blocks[i + 1];
    if (top >= a.top && top <= b.top) {
      return Math.round(interpolate(top, a.top, b.top, a.line, b.line));
    }
  }
  return last.line;
}

function interpolate(
  x: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): number {
  if (x1 === x0) return y0;
  const t = (x - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}
