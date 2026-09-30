import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, EVENTO_SESION_EXPIRADA, token } from '../api/cliente'
import type { RespuestaLogin, SesionUsuario } from '../api/tipos'
import { notificar } from '../components/ui'

interface ContextoSesion {
  usuario: SesionUsuario | null
  /** true mientras se valida el token guardado al abrir la app. */
  verificando: boolean
  iniciarSesion: (correo: string, password: string) => Promise<void>
  cerrarSesion: () => void
  puede: (permiso: string) => boolean
}

const Contexto = createContext<ContextoSesion | null>(null)

export function useSesion() {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useSesion debe usarse dentro de <ProveedorSesion>')
  return ctx
}

/** Atajo: ¿el usuario tiene este permiso? p. ej. usePuede('clientes.editar') */
export const usePuede = (permiso: string) => useSesion().puede(permiso)

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [usuario, setUsuario] = useState<SesionUsuario | null>(null)
  const [verificando, setVerificando] = useState(() => token.obtener() !== null)

  const cerrarSesion = useCallback(() => {
    token.borrar()
    setUsuario(null)
    // Borrar los datos en caché para que el siguiente usuario no vea los del anterior.
    queryClient.clear()
  }, [queryClient])

  // Al abrir la app con un token guardado, confirmar que sigue siendo válido.
  useEffect(() => {
    if (!token.obtener()) return
    api.get<SesionUsuario>('/auth/yo')
      .then(setUsuario)
      .catch(() => token.borrar())
      .finally(() => setVerificando(false))
  }, [])

  // Si la API rechaza el token (vencido, usuario desactivado, permisos cambiados).
  useEffect(() => {
    const alExpirar = () => {
      if (!token.obtener()) return
      cerrarSesion()
      notificar.info('Tu sesión terminó. Vuelve a iniciar sesión.')
    }
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
  }, [cerrarSesion])

  const iniciarSesion = useCallback(async (correo: string, password: string) => {
    const r = await api.post<RespuestaLogin>('/auth/login', { correo, password })
    queryClient.clear()
    token.guardar(r.token)
    setUsuario(r.usuario)
  }, [queryClient])

  const valor = useMemo<ContextoSesion>(() => ({
    usuario,
    verificando,
    iniciarSesion,
    cerrarSesion,
    puede: (permiso) => usuario?.permisos.includes(permiso) ?? false,
  }), [usuario, verificando, iniciarSesion, cerrarSesion])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

/** Muestra el contenido solo si el usuario tiene el permiso. */
export function SiPuede({ permiso, children }: { permiso: string; children: ReactNode }) {
  return usePuede(permiso) ? <>{children}</> : null
}
