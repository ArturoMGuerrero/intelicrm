import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En desarrollo, las llamadas a /api se redirigen al backend de .NET.
// Si cambias el puerto del backend (launchSettings.json), cámbialo aquí también.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5205',
    },
  },
})
