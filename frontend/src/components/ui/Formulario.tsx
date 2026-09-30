import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { ApiError } from '../../api/cliente'
import { Boton } from './Boton'
import { cn } from './cn'
import { Icono } from './Icono'
import { MensajeError } from './Estructura'

const claseControl =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-xs ' +
  'placeholder:text-slate-400 focus:border-marca-500 focus:ring-2 focus:ring-marca-100 focus:outline-none ' +
  'disabled:bg-slate-100 disabled:text-slate-500 aria-invalid:border-red-400 aria-invalid:ring-red-100'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(claseControl, className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(claseControl, 'pr-8', className)} {...props}>{children}</select>
}

export function Textarea({ className, rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(claseControl, className)} {...props} />
}

/** Casilla con su texto a la derecha. */
export function Checkbox({ etiqueta, className, ...props }:
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { etiqueta: ReactNode }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700', className)}>
      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-marca-600" {...props} />
      {etiqueta}
    </label>
  )
}

/** Caja de búsqueda con ícono de lupa. */
export function Buscador({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <div className={cn('relative flex-1', className)}>
      <Icono nombre="buscar" className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
      <Input type="search" className="pl-9" {...props} />
    </div>
  )
}

/** Etiqueta + control + mensaje de error del campo. */
export function Campo({ etiqueta, children, error, ayuda, className }: {
  etiqueta: string; children: ReactNode; error?: string; ayuda?: string; className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{etiqueta}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span>
        : ayuda && <span className="mt-1 block text-xs text-slate-500">{ayuda}</span>}
    </label>
  )
}

/** Pie estándar de formulario: error general + Cancelar / Guardar. */
export function PieFormulario({ error, guardando, onCancelar, textoGuardar = 'Guardar' }: {
  error?: unknown; guardando: boolean; onCancelar: () => void; textoGuardar?: string
}) {
  return (
    <div className="mt-6 space-y-4">
      <MensajeError error={error} />
      <div className="flex justify-end gap-2">
        <Boton onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" variante="primario" cargando={guardando}>{textoGuardar}</Boton>
      </div>
    </div>
  )
}

/** Busca el mensaje de validación de un campo en un ApiError (las claves vienen en PascalCase). */
export function errorDeCampo(error: unknown, campo: string): string | undefined {
  if (!(error instanceof ApiError)) return undefined
  const clave = Object.keys(error.errores).find((k) => k.toLowerCase() === campo.toLowerCase())
  return clave ? error.errores[clave][0] : undefined
}

/** Convierte "" en null para campos opcionales antes de enviarlos a la API. */
export const nulo = (valor: string) => (valor.trim() === '' ? null : valor)
export const numeroONulo = (valor: string) => (valor === '' ? null : Number(valor))
