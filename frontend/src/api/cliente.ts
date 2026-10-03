/** Error devuelto por la API (ProblemDetails). */
export class ApiError extends Error {
  status: number
  errores: Record<string, string[]>

  constructor(status: number, mensaje: string, errores: Record<string, string[]> = {}) {
    super(mensaje)
    this.status = status
    this.errores = errores
  }
}

// ---------- Token de sesión ----------
// Se guarda en localStorage para sobrevivir a recargas. Puede no estar disponible
// (modo privado, almacenamiento bloqueado): en ese caso la sesión dura mientras la pestaña esté abierta.
const CLAVE_TOKEN = 'intelicrm.token'
let tokenEnMemoria: string | null = null

export const token = {
  obtener(): string | null {
    if (tokenEnMemoria) return tokenEnMemoria
    try { tokenEnMemoria = localStorage.getItem(CLAVE_TOKEN) } catch { /* sin almacenamiento */ }
    return tokenEnMemoria
  },
  guardar(valor: string) {
    tokenEnMemoria = valor
    try { localStorage.setItem(CLAVE_TOKEN, valor) } catch { /* sin almacenamiento */ }
  },
  borrar() {
    tokenEnMemoria = null
    try { localStorage.removeItem(CLAVE_TOKEN) } catch { /* sin almacenamiento */ }
  },
}

/** Se dispara cuando la API responde 401 a una petición autenticada (token vencido o revocado). */
export const EVENTO_SESION_EXPIRADA = 'intelicrm:sesion-expirada'

async function solicitar<T>(metodo: string, url: string, cuerpo?: unknown, comoArchivo = false): Promise<T> {
  const t = token.obtener()
  const headers: Record<string, string> = {}
  // FormData (subida de archivos) lleva su propio Content-Type con el separador.
  const esFormulario = cuerpo instanceof FormData
  if (cuerpo !== undefined && !esFormulario) headers['Content-Type'] = 'application/json'
  if (t) headers.Authorization = `Bearer ${t}`

  let respuesta: Response
  try {
    respuesta = await fetch(`/api${url}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : esFormulario ? cuerpo : JSON.stringify(cuerpo),
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. ¿Está corriendo el backend?')
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && t) window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA))

    let mensaje = mensajePorEstado[respuesta.status] ?? `Error ${respuesta.status}`
    let errores: Record<string, string[]> = {}
    try {
      const problema = await respuesta.json()
      errores = problema.errors ?? {}
      const primerError = Object.values(errores)[0]?.[0]
      mensaje = problema.detail ?? primerError ?? problema.title ?? mensaje
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    throw new ApiError(respuesta.status, mensaje, errores)
  }

  if (respuesta.status === 204) return undefined as T
  if (comoArchivo) return (await respuesta.blob()) as T
  return (await respuesta.json()) as T
}

const mensajePorEstado: Record<number, string> = {
  401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para realizar esta acción.',
  429: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.',
}

/** Construye un query string ignorando valores vacíos. */
export function qs(parametros: Record<string, string | number | boolean | null | undefined>): string {
  const p = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '' && valor !== false) p.set(clave, String(valor))
  }
  const texto = p.toString()
  return texto ? `?${texto}` : ''
}

export const api = {
  get: <T>(url: string) => solicitar<T>('GET', url),
  post: <T>(url: string, cuerpo?: unknown) => solicitar<T>('POST', url, cuerpo ?? {}),
  put: <T>(url: string, cuerpo: unknown) => solicitar<T>('PUT', url, cuerpo),
  patch: <T>(url: string, cuerpo: unknown) => solicitar<T>('PATCH', url, cuerpo),
  delete: (url: string) => solicitar<void>('DELETE', url),

  /** Descarga un archivo autenticado y lo ofrece al navegador con el nombre indicado. */
  async descargar(url: string, nombreArchivo: string) {
    const blob = await solicitar<Blob>('GET', url, undefined, true)
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(blob)
    enlace.download = nombreArchivo
    enlace.click()
    URL.revokeObjectURL(enlace.href)
  },
}
