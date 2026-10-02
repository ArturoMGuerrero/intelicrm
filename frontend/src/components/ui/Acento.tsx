import { createContext, useContext } from 'react'
import type { NombreIcono } from './Icono'

/**
 * Cada módulo tiene un color de acento: se usa en su ícono del menú y en el
 * encabezado de la página. Las clases van completas (Tailwind no detecta clases armadas).
 */
export type ColorAcento =
  | 'violeta' | 'fucsia' | 'cielo' | 'ambar' | 'esmeralda' | 'naranja'
  | 'turquesa' | 'indigo' | 'rosa' | 'lima' | 'cian' | 'morado'

export const acentos: Record<ColorAcento, { chip: string; menu: string; suave: string }> = {
  violeta: { chip: 'from-violet-500 to-purple-600 shadow-violet-500/30', menu: 'bg-violet-400/15 text-violet-300', suave: 'bg-violet-50 text-violet-700' },
  fucsia: { chip: 'from-fuchsia-500 to-pink-600 shadow-fuchsia-500/30', menu: 'bg-fuchsia-400/15 text-fuchsia-300', suave: 'bg-fuchsia-50 text-fuchsia-700' },
  cielo: { chip: 'from-sky-400 to-blue-600 shadow-sky-500/30', menu: 'bg-sky-400/15 text-sky-300', suave: 'bg-sky-50 text-sky-700' },
  ambar: { chip: 'from-amber-400 to-orange-500 shadow-amber-500/30', menu: 'bg-amber-400/15 text-amber-300', suave: 'bg-amber-50 text-amber-700' },
  esmeralda: { chip: 'from-emerald-400 to-teal-600 shadow-emerald-500/30', menu: 'bg-emerald-400/15 text-emerald-300', suave: 'bg-emerald-50 text-emerald-700' },
  naranja: { chip: 'from-orange-400 to-red-500 shadow-orange-500/30', menu: 'bg-orange-400/15 text-orange-300', suave: 'bg-orange-50 text-orange-700' },
  turquesa: { chip: 'from-teal-400 to-cyan-600 shadow-teal-500/30', menu: 'bg-teal-400/15 text-teal-300', suave: 'bg-teal-50 text-teal-700' },
  indigo: { chip: 'from-indigo-500 to-blue-600 shadow-indigo-500/30', menu: 'bg-indigo-400/15 text-indigo-300', suave: 'bg-indigo-50 text-indigo-700' },
  rosa: { chip: 'from-rose-400 to-pink-600 shadow-rose-500/30', menu: 'bg-rose-400/15 text-rose-300', suave: 'bg-rose-50 text-rose-700' },
  lima: { chip: 'from-lime-400 to-green-600 shadow-lime-500/30', menu: 'bg-lime-400/15 text-lime-300', suave: 'bg-lime-50 text-lime-700' },
  cian: { chip: 'from-cyan-400 to-sky-600 shadow-cyan-500/30', menu: 'bg-cyan-400/15 text-cyan-300', suave: 'bg-cyan-50 text-cyan-700' },
  morado: { chip: 'from-purple-500 to-fuchsia-600 shadow-purple-500/30', menu: 'bg-purple-400/15 text-purple-300', suave: 'bg-purple-50 text-purple-700' },
}

export interface Acento { color: ColorAcento; icono: NombreIcono }

/** Acento del módulo actual; lo provee el Layout según la ruta. */
export const ContextoAcento = createContext<Acento | null>(null)

export const useAcento = () => useContext(ContextoAcento)
