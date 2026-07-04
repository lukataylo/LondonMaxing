import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Read env from the monorepo root so the shared .env.local (VITE_MAPBOX_ACCESS_TOKEN,
  // VITE_API_BASE, VITE_MOCK) reaches the web app.
  envDir: fileURLToPath(new URL("../../", import.meta.url)),
  server: {
    host: true, // bind LAN so an Expo Go phone (and other devices) can reach the dev server
    port: 5173,
  },
  preview: {
    port: 4173,
    // Railway serves this behind grudgemap.com / *.up.railway.app. Vite 5+ preview
    // blocks unknown Host headers by default, which fails Railway's "/" healthcheck.
    // Allow all hosts so the healthcheck and custom domain reach the app.
    allowedHosts: true,
  },
});
