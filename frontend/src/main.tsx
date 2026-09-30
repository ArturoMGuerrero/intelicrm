import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { Toaster } from 'sonner'
import App from './App'
import { ApiError } from './api/cliente'
import { ProveedorConfirmacion } from './components/ui'
import { ProveedorSesion } from './sesion/Sesion'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Reintentar solo fallas de red o del servidor; un 401/403/404 no se arregla reintentando.
      retry: (intentos, error) => intentos < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ProveedorSesion>
          <ProveedorConfirmacion>
            <App />
          </ProveedorConfirmacion>
        </ProveedorSesion>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton duration={3500} />
    </QueryClientProvider>
  </StrictMode>,
)
