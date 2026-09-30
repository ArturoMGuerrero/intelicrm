import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { Cargando, Icono } from '../components/ui'
import { useSesion } from './Sesion'

/** Rutas que requieren haber iniciado sesión. Si no, manda al login y regresa después. */
export function RequiereSesion() {
  const { usuario, verificando } = useSesion()
  const { pathname } = useLocation()

  if (verificando) return <div className="flex min-h-screen items-center justify-center"><Cargando texto="Verificando sesión…" /></div>
  if (!usuario) return <Navigate to="/login" replace state={{ desde: pathname }} />
  return <Outlet />
}

/** Página que requiere un permiso de lectura. Muestra un aviso en lugar de la pantalla. */
export function RequierePermiso({ permiso, children }: { permiso: string; children: ReactNode }) {
  const { puede } = useSesion()
  if (puede(permiso)) return <>{children}</>
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icono nombre="candado" className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-slate-900">Sin acceso</h1>
      <p className="mt-1 text-sm text-slate-500">Tu rol no tiene permiso para ver esta sección. Si lo necesitas, pídelo al administrador.</p>
    </div>
  )
}
