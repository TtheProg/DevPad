import { useCallback, useState, type DragEvent } from "react";
import type { OpenedFile } from "../lib/files/io";

/**
 * Drag-and-drop support for dropping a text file onto a tool. Powers the
 * "drag any .json/.md file into the browser" claim — and works fully offline,
 * since the file is read locally via the File API and never uploaded.
 */
export function useFileDrop(onFile: (file: OpenedFile) => void) {
  const [dragging, setDragging] = useState(false);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const onDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile({ name: file.name, content: await file.text() });
    },
    [onFile],
  );

  return { dragging, dropProps: { onDragOver, onDragLeave, onDrop } };
}
