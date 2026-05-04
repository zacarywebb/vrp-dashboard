import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // VITE_BASE is set in the GitHub Actions workflow to /repo-name/
  // In local dev it's unset so the app runs at /
  base: process.env.VITE_BASE || "/",
  server: {
    port: 5173,
    proxy: command === "serve"
      ? { "/api": { target: "http://localhost:8000", changeOrigin: true } }
      : {},
  },
}));
