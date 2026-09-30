import type { HTMLAttributes, ReactNode, TdHTMLAttributes } from 'react'
import { cn } from './cn'

export interface Columna {
  titulo: ReactNode
  className?: string
  /** Alinea a la derecha (importes, acciones). */
  derecha?: boolean
}

/**
 * Tabla estándar dentro de una tarjeta, con scroll horizontal en pantallas pequeñas.
 * Las filas se arman con <Fila> y <Celda>.
 */
export function Tabla({ columnas, children, pie, className }: {
  columnas: Columna[]; children: ReactNode; pie?: ReactNode; className?: string
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className={cn('w-full text-left text-sm', className)}>
          <thead>
            <tr>
              {columnas.map((c, i) => (
                <th key={i} scope="col" className={cn(
                  'border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase',
                  c.derecha && 'text-right', c.className)}>
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
          {pie && <tfoot>{pie}</tfoot>}
        </table>
      </div>
    </div>
  )
}

/** Fila de tabla. `inactiva` la atenúa; si tiene onClick se vuelve clicable. */
export function Fila({ inactiva, className, onClick, ...props }: HTMLAttributes<HTMLTableRowElement> & { inactiva?: boolean }) {
  return (
    <tr className={cn('transition-colors hover:bg-slate-50', onClick && 'cursor-pointer', inactiva && 'opacity-60', className)}
      onClick={onClick} {...props} />
  )
}

export function Celda({ derecha, className, ...props }: TdHTMLAttributes<HTMLTableCellElement> & { derecha?: boolean }) {
  return <td className={cn('border-b border-slate-100 px-4 py-3 align-middle', derecha && 'text-right', className)} {...props} />
}

/** Celda de acciones (editar / eliminar) alineada a la derecha. Evita que el clic abra la fila. */
export function CeldaAcciones({ children }: { children: ReactNode }) {
  return (
    <Celda derecha className="w-px whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
      <div className="inline-flex gap-0.5">{children}</div>
    </Celda>
  )
}

/** Texto principal + secundario apilados (nombre y detalle). */
export function Doble({ principal, secundario }: { principal: ReactNode; secundario?: ReactNode }) {
  return (
    <>
      <p className="font-medium text-slate-900">{principal}</p>
      {secundario && <p className="text-xs text-slate-500">{secundario}</p>}
    </>
  )
}
