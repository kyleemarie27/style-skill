/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Shown in Settings so it's easy to tell which version a phone is running.
const BUILD = (process.env.VERCEL_GIT_COMMIT_SHA ?? "dev").slice(0, 7);

export default defineConfig({
  define: {
    __BUILD__: JSON.stringify(BUILD),
    __BUILT_AT__: JSON.stringify(new Date().toISOString().slice(0, 16).replace("T", " ")),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Registered from src/main.tsx so the app can check for updates and reload itself.
      injectRegister: null,
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Bloom — cycle & fertility",
        short_name: "Bloom",
        description: "A private, ad-free cycle and fertility tracker.",
        theme_color: "#b4475f",
        background_color: "#fbf6f3",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: { navigateFallbackDenylist: [/^\/api\//] },
    }),
  ],
  server: { proxy: { "/api": "http://localhost:3001" } },
  test: { include: ["tests/**/*.test.ts"] },
});
