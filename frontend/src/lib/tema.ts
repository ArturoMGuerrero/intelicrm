import { useEffect, useState } from 'react'

export type Tema = 'claro' | 'oscuro'

const CLAVE = 'tema'

/** Tema guardado; si no hay, el del sistema operativo. */
export function temaInicial(): Tema {
  try {
    const guardado = localStorage.getItem(CLAVE)
    if (guardado === 'claro' || guardado === 'oscuro') return guardado
  } catch { /* sin almacenamiento */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
}

/** Modo claro/oscuro de todo el sitio: pone la clase "dark" en <html> y recuerda la elección. */
export function useTema() {
  const [tema, setTema] = useState<Tema>(temaInicial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'oscuro')
  }, [tema])

  const alternar = () => {
    const nuevo: Tema = tema === 'oscuro' ? 'claro' : 'oscuro'
    setTema(nuevo)
    try { localStorage.setItem(CLAVE, nuevo) } catch { /* sin almacenamiento */ }
  }

  return { tema, alternar }
}
