import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const siteUrl =
  process.env.VITE_SITE_URL ?? "https://frontend-two-weld-14.vercel.app";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "inject-site-url",
      transformIndexHtml(html) {
        return html.replaceAll("%SITE_URL%", siteUrl);
      },
    },
  ],
});
