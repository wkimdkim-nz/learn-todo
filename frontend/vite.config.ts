import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Fail if 5173 is taken, rather than quietly moving to 5174.
    strictPort: true,
    // Forward /api to the API, so the browser only talks to Vite and the API needs no CORS.
    proxy: {
      "/api": "http://localhost:5080",
    },
  },
});
