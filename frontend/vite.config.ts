import dns from 'node:dns'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En Windows, "localhost" puede resolverse solo a IPv6 (::1) y entonces http://127.0.0.1:5173 no abre.
// Con IPv4 primero, el servidor escucha en 127.0.0.1 y abre igual con localhost.
dns.setDefaultResultOrder('ipv4first')

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
