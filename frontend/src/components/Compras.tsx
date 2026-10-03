import type { EstatusOrdenCompra } from '../api/tipos'
import { Insignia, type Tono } from './ui'

export const etiquetaEstatusCompra: Record<EstatusOrdenCompra, [string, Tono]> = {
  Pedida: ['Pedida', 'cielo'],
  RecibidaParcial: ['Recibida parcial', 'ambar'],
  Recibida: ['Recibida', 'verde'],
  Cancelada: ['Cancelada', 'gris'],
}

export function InsigniaCompra({ estatus }: { estatus: EstatusOrdenCompra }) {
  const [texto, tono] = etiquetaEstatusCompra[estatus]
  return <Insignia tono={tono}>{texto}</Insignia>
}
