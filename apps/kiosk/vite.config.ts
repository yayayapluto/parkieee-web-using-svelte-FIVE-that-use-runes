import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    host: true,          // listen di 0.0.0.0, bukan hanya localhost
    port: 5174,
    allowedHosts: 'all', // izinkan semua host — diperlukan untuk cloudflared tunnel
  },
});
