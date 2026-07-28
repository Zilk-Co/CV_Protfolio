import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT || "3000";
const port = Number(rawPort);
const basePath = process.env.BASE_PATH || "/";

const plugins: any[] = [react(), tailwindcss()];

// Only load Replit plugins in Replit environment
if (process.env.REPL_ID !== undefined) {
  try {
    const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal").then(m => m.default);
    plugins.push(runtimeErrorOverlay());
    if (process.env.NODE_ENV !== "production") {
      const cartographer = await import("@replit/vite-plugin-cartographer").then(m => m.default);
      const devBanner = await import("@replit/vite-plugin-dev-banner").then(m => m.default);
      plugins.push(cartographer({ root: path.resolve(import.meta.dirname, "..") }));
      plugins.push(devBanner());
    }
  } catch { /* not on replit */ }
}

export default defineConfig({
  base: basePath,
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
