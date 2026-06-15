/**
 * Shared result type for all transforms. Transforms never throw for *expected*
 * failures (bad input) — they return `{ ok: false, error }` so the UI can show
 * a precise, inline message (with line/column where we have it).
 */
export interface CodeError {
  message: string;
  /** 1-based line, when known. */
  line?: number;
  /** 1-based column, when known. */
  column?: number;
}

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: CodeError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const err = (error: CodeError | string): Result<never> => ({
  ok: false,
  error: typeof error === "string" ? { message: error } : error,
});

/** Count to a 1-based line/column for a 0-based character index in `text`. */
export function positionToLineCol(
  text: string,
  position: number,
): { line: number; column: number } {
  let line = 1;
  let column = 1;
  const end = Math.min(position, text.length);
  for (let i = 0; i < end; i++) {
    if (text[i] === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { line, column };
}
