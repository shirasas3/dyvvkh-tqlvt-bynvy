import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// base "./" lets the built site work from any address (GitHub Pages included)
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});
