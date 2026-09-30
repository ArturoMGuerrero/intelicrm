import type { ReactNode } from 'react'
import { cn } from './cn'
import { Icono } from './Icono'

/** Título de página con descripción opcional y botones de acción a la derecha. */
export function Encabezado({ titulo, descripcion, acciones }: { titulo: ReactNode; descripcion?: ReactNode; acciones?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  )
}

/** Contenedor blanco con borde. `titulo` y `acciones` arman su encabezado. */
export function Tarjeta({ titulo, acciones, children, className, sinRelleno = false }: {
  titulo?: ReactNode; acciones?: ReactNode; children: ReactNode; className?: string; sinRelleno?: boolean
}) {
  return (
    <section className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', !sinRelleno && 'p-5', className)}>
      {(titulo || acciones) && (
        <div className={cn('mb-4 flex items-center justify-between gap-3', sinRelleno && 'mb-0 px-5 pt-5 pb-4')}>
          {titulo && <h2 className="font-semibold text-slate-900">{titulo}</h2>}
          {acciones}
        </div>
      )}
      {children}
    </section>
  )
}

/** Barra de filtros sobre una lista: buscador, selects, casillas. */
export function BarraFiltros({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">{children}</div>
}

// ---------- Estados ----------

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-marca-600" />
      {texto}
    </div>
  )
}

export function Vacio({ mensaje, className }: { mensaje: string; className?: string }) {
  return <div className={cn('p-10 text-center text-sm text-slate-500', className)}>{mensaje}</div>
}

export function MensajeError({ error }: { error: unknown }) {
  if (!error) return null
  const mensaje = error instanceof Error ? error.message : 'Ocurrió un error.'
  return (
    <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <Icono nombre="alerta" className="h-4 w-4 translate-y-0.5" />
      {mensaje}
    </div>
  )
}

export function Aviso({ children, tono = 'ambar' }: { children: ReactNode; tono?: 'ambar' | 'azul' }) {
  return (
    <p className={cn('rounded-lg px-4 py-3 text-sm',
      tono === 'ambar' ? 'bg-amber-50 text-amber-800' : 'bg-marca-50 text-marca-700')}>
      {children}
    </p>
  )
}

// ---------- Etiquetas y selectores ----------

export type Tono = 'gris' | 'azul' | 'indigo' | 'violeta' | 'ambar' | 'verde' | 'rojo' | 'cielo'

export const tonos: Record<Tono, string> = {
  gris: 'bg-slate-100 text-slate-700',
  azul: 'bg-marca-50 text-marca-700',
  cielo: 'bg-sky-100 text-sky-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  violeta: 'bg-violet-100 text-violet-700',
  ambar: 'bg-amber-100 text-amber-800',
  verde: 'bg-emerald-100 text-emerald-700',
  rojo: 'bg-rose-100 text-rose-700',
}

export function Insignia({ children, tono = 'gris', className }: { children: ReactNode; tono?: Tono; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', tonos[tono], className)}>
      {children}
    </span>
  )
}

/** Selector de opciones excluyentes con aspecto de pestañas (p. ej. Tabla / Embudo). */
export function Segmentos<T extends string>({ opciones, valor, onCambiar, etiqueta }: {
  opciones: { valor: T; texto: string }[]; valor: T; onCambiar: (v: T) => void; etiqueta: string
}) {
  return (
    <div role="tablist" aria-label={etiqueta} className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
      {opciones.map((o) => (
        <button key={o.valor} type="button" role="tab" aria-selected={valor === o.valor} onClick={() => onCambiar(o.valor)}
          className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            valor === o.valor ? 'bg-marca-600 text-white' : 'text-slate-600 hover:bg-slate-100')}>
          {o.texto}
        </button>
      ))}
    </div>
  )
}

/** Filtros rápidos en forma de "píldoras" (p. ej. estatus de cotización). */
export function FiltroChips<T extends string>({ opciones, valor, onCambiar }: {
  opciones: { valor: T; texto: string }[]; valor: T; onCambiar: (v: T) => void
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {opciones.map((o) => (
        <button key={o.valor || 'todos'} type="button" aria-pressed={valor === o.valor} onClick={() => onCambiar(o.valor)}
          className={cn('rounded-full px-3 py-1 text-sm font-medium transition-colors',
            valor === o.valor ? 'bg-marca-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50')}>
          {o.texto}
        </button>
      ))}
    </div>
  )
}

/** Lista de pares etiqueta → valor (fichas de detalle). */
export function ListaDatos({ datos }: { datos: [string, ReactNode][] }) {
  return (
    <dl className="space-y-3 text-sm">
      {datos.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="flex justify-between gap-4">
          <dt className="text-slate-500">{etiqueta}</dt>
          <dd className="min-w-0 text-right font-medium break-words text-slate-800">{valor || "—"}</dd>
        </div>
      ))}
    </dl>
  )
}
