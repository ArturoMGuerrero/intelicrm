// Tipos que reflejan los DTOs del backend (InteliCRM.Application).

export type EtapaProspecto =
  | 'Nuevo' | 'Contactado' | 'Calificado' | 'Propuesta' | 'Negociacion' | 'Ganado' | 'Perdido'
export type EstatusCita = 'Programada' | 'Confirmada' | 'Realizada' | 'Cancelada' | 'NoAsistio'
export type EstatusCotizacion = 'Borrador' | 'Enviada' | 'Aceptada' | 'Rechazada' | 'Vencida'
export type TipoProducto = 'Producto' | 'Servicio'
export type TipoPersona = 'Fisica' | 'Moral'

export interface Catalogo {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  duracionMinutos: number | null
  diasCredito: number | null
}

export interface Empleado {
  id: number
  nombre: string
  apellidos: string
  nombreCompleto: string
  telefono: string | null
  correo: string | null
  puestoId: number | null
  puesto: string | null
  unidadNegocioId: number | null
  unidadNegocio: string | null
  colorAgenda: string
  activo: boolean
}

export interface Cliente {
  id: number
  razonSocial: string
  nombreComercial: string | null
  rfc: string | null
  contactoPrincipal: string | null
  telefono: string | null
  correo: string | null
  direccion: string | null
  activo: boolean
}

export interface Producto {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  tipo: TipoProducto
  precio: number
  activo: boolean
}

export interface Prospecto {
  id: number
  nombre: string
  apellidos: string
  nombreCompleto: string
  empresa: string | null
  cargo: string | null
  telefono: string | null
  correo: string | null
  origen: string | null
  etapa: EtapaProspecto
  valorEstimado: number | null
  notas: string | null
  activo: boolean
  empleadoResponsableId: number | null
  empleadoResponsable: string | null
  unidadNegocioId: number | null
  unidadNegocio: string | null
  clienteId: number | null
  fechaCreacion: string
}

export interface BitacoraEntrada {
  id: number
  prospectoId: number
  fecha: string
  descripcion: string
  empleadoId: number | null
  empleado: string | null
  accionActividadId: number | null
  accionActividad: string | null
}

export interface Cita {
  id: number
  prospectoId: number
  prospecto: string
  empresa: string | null
  empleadoId: number
  empleado: string
  colorEmpleado: string
  accionActividadId: number | null
  accionActividad: string | null
  fechaHoraInicio: string
  fechaHoraFin: string
  duracionMinutos: number
  estatus: EstatusCita
  notas: string | null
}

export interface CotizacionResumen {
  id: number
  folio: string
  fecha: string
  fechaVencimiento: string
  prospectoId: number | null
  clienteId: number | null
  destinatario: string
  empleado: string | null
  estatus: EstatusCotizacion
  total: number
}

export interface Partida {
  id: number
  productoId: number | null
  descripcion: string
  cantidad: number
  precioUnitario: number
  descuentoPorcentaje: number
  importe: number
}

export interface Cotizacion {
  id: number
  folio: string
  fecha: string
  vigenciaDias: number
  fechaVencimiento: string
  prospectoId: number | null
  clienteId: number | null
  destinatario: string
  empleadoId: number | null
  empleado: string | null
  estatus: EstatusCotizacion
  notas: string | null
  subtotal: number
  iva: number
  total: number
  partidas: Partida[]
}

export interface Dashboard {
  prospectosActivos: number
  clientesActivos: number
  citasHoy: number
  cotizacionesAbiertas: number
  montoCotizacionesAbiertas: number
  montoGanadoMes: number
  embudo: { etapa: EtapaProspecto; cantidad: number; valorEstimado: number }[]
  proximasCitas: Cita[]
}

// ---------- Seguridad ----------

export interface SesionUsuario {
  usuarioId: number
  nombre: string
  correo: string
  cuentaId: number
  cuenta: string
  rolId: number
  rol: string
  esAdministrador: boolean
  empleadoId: number | null
  permisos: string[]
}

export interface RespuestaLogin {
  token: string
  expira: string
  usuario: SesionUsuario
}

export interface Usuario {
  id: number
  nombre: string
  correo: string
  rolId: number
  rol: string | null
  empleadoId: number | null
  empleado: string | null
  activo: boolean
  bloqueado: boolean
  ultimoAcceso: string | null
}

export interface Rol {
  id: number
  nombre: string
  descripcion: string | null
  esAdministrador: boolean
  permisos: string[]
  usuarios: number
}

export interface ModuloPermiso {
  clave: string
  nombre: string
  grupo: string
  acciones: string[]
}

export interface Proveedor {
  id: number
  razonSocial: string
  nombreComercial: string | null
  rfc: string | null
  tipoPersona: TipoPersona
  telefono: string | null
  correo: string | null
  direccion: string | null
  contactoNombre: string | null
  contactoTelefono: string | null
  contactoCorreo: string | null
  tipoContactoId: number | null
  tipoContacto: string | null
  condicionPagoId: number | null
  condicionPago: string | null
  diasCredito: number | null
  instrumentoPagoId: number | null
  instrumentoPago: string | null
  banco: string | null
  numeroCuenta: string | null
  clabe: string | null
  notas: string | null
  activo: boolean
}

export interface Sucursal {
  id: number
  nombre: string
  telefono: string | null
  direccion: string | null
  codigoPostal: string | null
  activo: boolean
  almacenes: number
}

export interface Almacen {
  id: number
  nombre: string
  ubicacion: string | null
  sucursalId: number
  sucursal: string | null
  activo: boolean
}
