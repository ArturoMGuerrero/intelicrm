import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En desarrollo, las llamadas a /api se redirigen al backend de .NET.
// Si cambias el puerto del backend (launchSettings.json), cámbialo aquí también.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En Windows, "localhost" puede resolverse solo a IPv6 (::1) y entonces http://127.0.0.1:5173 no abre.
    // Escuchando en 127.0.0.1 abre con las dos direcciones (el navegador cae a IPv4 para "localhost").
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5205',
    },
  },
})
