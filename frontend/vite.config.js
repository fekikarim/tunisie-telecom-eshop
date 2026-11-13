import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The API runs on port 4000; requests are proxied so the browser sees one origin.
const API = process.env.VITE_API_PROXY || 'http://localhost:4000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': API,
      '/uploads': API,
    },
  },
  preview: {
    port: 5173,
    proxy: {
      '/api': API,
      '/uploads': API,
    },
  },
});
