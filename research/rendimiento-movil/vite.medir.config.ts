import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// Compilación de producción (React en modo producción, minificada) con los ganchos ?prueba= activos.
export default defineConfig({
  root: process.cwd(),
  base: "./",
  plugins: [react()],
  define: { "import.meta.env.DEV": "true" },
  build: { outDir: process.env.OUT_DIR, emptyOutDir: true, rollupOptions: { input: resolve(process.cwd(), "index.html") } },
});
