import { useEffect } from "react";
import { initTauriFileOpen } from "../lib/files/tauri-open";

/** Headless island: wires up native "open file" handling. No-op on the web. */
export function TauriBootstrap() {
  useEffect(() => {
    void initTauriFileOpen();
  }, []);
  return null;
}
