// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// DevPad — static client-side dev tools (web) + Tauri macOS shell.
// Output is fully static so it can be hosted for ~€0 AND wrapped by Tauri.
// Clean per-tool URLs (/json/, /convert/, /markdown/) for SEO long-tail.
// Dev port: 4600 — see ../PORTS.md (4500 is CutOut)
export default defineConfig({
  output: "static",
  integrations: [react()],
  server: { port: 4600, host: "127.0.0.1" },
});
