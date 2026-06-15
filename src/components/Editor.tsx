import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

export type EditorLanguage = "json" | "markdown" | "plain";

export interface EditorHandle {
  /** Underlying CodeMirror view (for scroll-sync etc.). Null before mount. */
  getView: () => EditorView | null;
}

interface EditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: EditorLanguage;
  readOnly?: boolean;
  ariaLabel?: string;
  className?: string;
}

function languageExtension(lang: EditorLanguage) {
  if (lang === "json") return [json()];
  if (lang === "markdown") return [markdown()];
  return [];
}

const heightTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "13px" },
  ".cm-scroller": { overflow: "auto", fontFamily: "var(--font-mono)" },
});

/**
 * Thin CodeMirror 6 wrapper. The view is created once; prop changes are pushed
 * in via transactions so we don't tear down the editor on every keystroke.
 */
export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { value, onChange, language = "plain", readOnly = false, ariaLabel, className },
  ref,
) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useImperativeHandle(ref, () => ({ getView: () => viewRef.current }), []);

  // Create the view once.
  useEffect(() => {
    if (!hostRef.current) return;

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]),
          ...languageExtension(language),
          oneDark,
          heightTheme,
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current?.(u.state.doc.toString());
          }),
          ...(ariaLabel
            ? [EditorView.contentAttributes.of({ "aria-label": ariaLabel })]
            : []),
        ],
      }),
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Recreate only if language/readOnly change (rare).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, readOnly]);

  // Push external value changes into the editor.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={hostRef} className={className} />;
});
