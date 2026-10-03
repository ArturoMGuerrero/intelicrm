import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Boton, BotonIcono } from './Boton'
import { cn } from './cn'
import { Icono } from './Icono'

export function Modal({ abierto, titulo, onCerrar, children, ancho = 'max-w-lg' }: {
  abierto: boolean; titulo: string; onCerrar: () => void; children: ReactNode; ancho?: string
}) {
  useEffect(() => {
    if (!abierto) return
    const alPresionar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alPresionar)
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alPresionar)
      document.body.style.overflow = overflowPrevio
    }
  }, [abierto, onCerrar])

  if (!abierto) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-[2px] sm:p-8"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div role="dialog" aria-modal="true" aria-label={titulo}
        className={cn('my-auto w-full overflow-hidden rounded-2xl bg-white shadow-xl', ancho)}>
        <div className="h-1 bg-marca-500" />
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
          <BotonIcono icono="cerrar" etiqueta="Cerrar" onClick={onCerrar} className="-mr-2" />
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ---------- Confirmación (reemplaza a window.confirm) ----------

interface OpcionesConfirmacion {
  titulo: string
  mensaje: ReactNode
  textoConfirmar?: string
  peligro?: boolean
}

type Confirmar = (opciones: OpcionesConfirmacion) => Promise<boolean>

const ContextoConfirmacion = createContext<Confirmar | null>(null)

/**
 * Uso: const confirmar = useConfirmar()
 *      if (await confirmar({ titulo: 'Eliminar', mensaje: '¿Seguro?', peligro: true })) { ... }
 */
export function useConfirmar(): Confirmar {
  const confirmar = useContext(ContextoConfirmacion)
  if (!confirmar) throw new Error('useConfirmar debe usarse dentro de <ProveedorConfirmacion>')
  return confirmar
}

export function ProveedorConfirmacion({ children }: { children: ReactNode }) {
  const [opciones, setOpciones] = useState<OpcionesConfirmacion | null>(null)
  const resolver = useRef<(valor: boolean) => void>(undefined)

  const confirmar = useCallback<Confirmar>((o) => {
    setOpciones(o)
    return new Promise<boolean>((resolve) => { resolver.current = resolve })
  }, [])

  const cerrar = useCallback((valor: boolean) => {
    resolver.current?.(valor)
    setOpciones(null)
  }, [])

  return (
    <ContextoConfirmacion.Provider value={confirmar}>
      {children}
      <Modal abierto={opciones !== null} titulo={opciones?.titulo ?? ''} onCerrar={() => cerrar(false)} ancho="max-w-md">
        <div className="flex gap-3">
          {opciones?.peligro && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Icono nombre="alerta" className="h-5 w-5" />
            </span>
          )}
          <div className="text-sm text-slate-600">{opciones?.mensaje}</div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Boton onClick={() => cerrar(false)}>Cancelar</Boton>
          <Boton variante={opciones?.peligro ? 'peligro' : 'primario'} onClick={() => cerrar(true)} autoFocus
            className={opciones?.peligro ? 'border-red-600 bg-red-600 text-white hover:bg-red-700' : undefined}>
            {opciones?.textoConfirmar ?? 'Confirmar'}
          </Boton>
        </div>
      </Modal>
    </ContextoConfirmacion.Provider>
  )
}
