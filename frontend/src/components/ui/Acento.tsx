import { createContext, useContext } from 'react'
import type { NombreIcono } from './Icono'

/**
 * Cada módulo tiene un color de acento sobrio: se usa en su ícono del menú y en el
 * encabezado de la página. Las clases van completas (Tailwind no detecta clases armadas).
 */
export type ColorAcento = 'azul' | 'indigo' | 'cielo' | 'turquesa' | 'esmeralda' | 'ambar' | 'pizarra'

export const acentos: Record<ColorAcento, { chip: string; menu: string; menuActivo: string }> = {
  azul: { chip: 'bg-blue-50 text-blue-700 ring-blue-100', menu: 'text-blue-300/80', menuActivo: 'bg-blue-500/20 text-blue-200' },
  indigo: { chip: 'bg-indigo-50 text-indigo-700 ring-indigo-100', menu: 'text-indigo-300/80', menuActivo: 'bg-indigo-500/20 text-indigo-200' },
  cielo: { chip: 'bg-sky-50 text-sky-700 ring-sky-100', menu: 'text-sky-300/80', menuActivo: 'bg-sky-500/20 text-sky-200' },
  turquesa: { chip: 'bg-teal-50 text-teal-700 ring-teal-100', menu: 'text-teal-300/80', menuActivo: 'bg-teal-500/20 text-teal-200' },
  esmeralda: { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-100', menu: 'text-emerald-300/80', menuActivo: 'bg-emerald-500/20 text-emerald-200' },
  ambar: { chip: 'bg-amber-50 text-amber-700 ring-amber-100', menu: 'text-amber-300/80', menuActivo: 'bg-amber-500/20 text-amber-200' },
  pizarra: { chip: 'bg-slate-100 text-slate-700 ring-slate-200', menu: 'text-slate-400', menuActivo: 'bg-slate-500/25 text-slate-100' },
}

export interface Acento { color: ColorAcento; icono: NombreIcono }

/** Acento del módulo actual; lo provee el Layout según la ruta. */
export const ContextoAcento = createContext<Acento | null>(null)

export const useAcento = () => useContext(ContextoAcento)
