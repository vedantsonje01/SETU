import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built app runs from any local path / file server on a center laptop.
  base: './',
  plugins: [react(), tailwindcss()],
})
