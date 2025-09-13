import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/,tailwindcss(),
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  server: {
    host: true,
    port: 5173,
    hmr: {
      host: "localhost",
      port: 5173,
      protocol: "ws",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.js"],
    globals: true,
  },
});
