import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/,tailwindcss(),
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
});
