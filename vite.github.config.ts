import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
    rollupOptions: {
      // `revision.html`: revisión de alias del tablón para la persona adulta; no se enlaza desde el juego.
      input: { main: resolve(process.cwd(), "index.html"), revision: resolve(process.cwd(), "revision.html") },
    },
  },
});
