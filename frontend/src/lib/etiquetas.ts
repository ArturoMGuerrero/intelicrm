import type { EstadoSaldo, EstatusCita, EstatusCotizacion, EtapaProspecto, TipoProducto } from '../api/tipos'
import type { Tono } from '../components/ui'

export const ETAPAS: EtapaProspecto[] = [
  'Nuevo', 'Contactado', 'Calificado', 'Propuesta', 'Negociacion', 'Ganado', 'Perdido',
]

export const etiquetaEtapa: Record<EtapaProspecto, string> = {
  Nuevo: 'Nuevo',
  Contactado: 'Contactado',
  Calificado: 'Calificado',
  Propuesta: 'Propuesta',
  Negociacion: 'Negociación',
  Ganado: 'Ganado',
  Perdido: 'Perdido',
}

export const tonoEtapa: Record<EtapaProspecto, Tono> = {
  Nuevo: 'gris',
  Contactado: 'cielo',
  Calificado: 'indigo',
  Propuesta: 'violeta',
  Negociacion: 'ambar',
  Ganado: 'verde',
  Perdido: 'rojo',
}

export const ESTATUS_CITA: EstatusCita[] = ['Programada', 'Confirmada', 'Realizada', 'Cancelada', 'NoAsistio']

export const etiquetaEstatusCita: Record<EstatusCita, string> = {
  Programada: 'Programada',
  Confirmada: 'Confirmada',
  Realizada: 'Realizada',
  Cancelada: 'Cancelada',
  NoAsistio: 'No asistió',
}

export const tonoEstatusCita: Record<EstatusCita, Tono> = {
  Programada: 'gris',
  Confirmada: 'cielo',
  Realizada: 'verde',
  Cancelada: 'rojo',
  NoAsistio: 'ambar',
}

export const ESTATUS_COTIZACION: EstatusCotizacion[] = ['Borrador', 'Enviada', 'Aceptada', 'Rechazada', 'Vencida']

export const tonoEstatusCotizacion: Record<EstatusCotizacion, Tono> = {
  Borrador: 'gris',
  Enviada: 'cielo',
  Aceptada: 'verde',
  Rechazada: 'rojo',
  Vencida: 'ambar',
}

export const TIPOS_PRODUCTO: TipoProducto[] = ['Producto', 'Servicio']

export const etiquetaAccion: Record<string, string> = { ver: 'Ver', editar: 'Crear y editar', eliminar: 'Eliminar' }

export const etiquetaEstadoSaldo: Record<EstadoSaldo, string> = {
  Pendiente: 'Pendiente',
  Vencido: 'Vencido',
  Liquidado: 'Liquidado',
  Cancelado: 'Cancelado',
}

export const tonoEstadoSaldo: Record<EstadoSaldo, Tono> = {
  Pendiente: 'cielo',
  Vencido: 'rojo',
  Liquidado: 'verde',
  Cancelado: 'gris',
}
