import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { join } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": join(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
