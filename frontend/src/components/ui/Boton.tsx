import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cn } from './cn'
import { Icono, type NombreIcono } from './Icono'

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma'
type Tamano = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const variantes: Record<Variante, string> = {
  primario: 'bg-gradient-to-r from-marca-600 to-indigo-600 text-white shadow-md shadow-marca-500/25 hover:from-marca-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-marca-500/30',
  secundario: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-marca-200 hover:bg-marca-50 hover:text-marca-700',
  peligro: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  fantasma: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
}

const tamanos: Record<Tamano, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
}

export const clasesBoton = (variante: Variante = 'secundario', tamano: Tamano = 'md', className?: string) =>
  cn(base, variantes[variante], tamanos[tamano], className)

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamano?: Tamano
  icono?: NombreIcono
  /** Muestra "Guardando…" (o el texto indicado) y deshabilita el botón. */
  cargando?: boolean
  textoCargando?: string
}

/** Botón estándar. Por defecto es type="button" para no enviar formularios por accidente. */
export function Boton({
  variante = 'secundario', tamano = 'md', icono, cargando = false, textoCargando = 'Guardando…',
  className, children, disabled, type = 'button', ...props
}: PropsBoton) {
  return (
    <button type={type} className={clasesBoton(variante, tamano, className)} disabled={disabled || cargando} {...props}>
      {icono && !cargando && <Icono nombre={icono} className="h-4 w-4" />}
      {cargando ? textoCargando : children}
    </button>
  )
}

/** Enlace con apariencia de botón (navegación interna). */
export function BotonEnlace({ variante = 'secundario', tamano = 'md', icono, className, children, ...props }:
  LinkProps & { variante?: Variante; tamano?: Tamano; icono?: NombreIcono; children: ReactNode }) {
  return (
    <Link className={clasesBoton(variante, tamano, className)} {...props}>
      {icono && <Icono nombre={icono} className="h-4 w-4" />}
      {children}
    </Link>
  )
}

/** Botón solo con ícono (editar, eliminar, cerrar...). `etiqueta` es obligatoria por accesibilidad. */
export function BotonIcono({ icono, etiqueta, peligro = false, className, ...props }:
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { icono: NombreIcono; etiqueta: string; peligro?: boolean }) {
  return (
    <button type="button" aria-label={etiqueta} title={etiqueta}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        'focus-visible:outline-2 focus-visible:outline-marca-500',
        peligro ? 'text-rose-500 hover:bg-rose-50 hover:text-rose-600' : 'text-slate-400 hover:bg-marca-50 hover:text-marca-600',
        className,
      )}
      {...props}>
      <Icono nombre={icono} className="h-4 w-4" />
    </button>
  )
}
