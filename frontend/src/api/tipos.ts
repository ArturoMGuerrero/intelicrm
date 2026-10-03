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
  listaPreciosId: number | null
  listaPrecios: string | null
  activo: boolean
}

export interface Producto {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  tipo: TipoProducto
  precio: number
  costo: number
  stockMinimo: number | null
  proveedorId: number | null
  proveedor: string | null
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

// ---------- Cobranza y cuentas por pagar ----------
export type EstatusDocumento = 'Vigente' | 'Cancelado'
export type EstadoSaldo = 'Pendiente' | 'Vencido' | 'Liquidado' | 'Cancelado'
export type FiltroEstadoSaldo = 'ConSaldo' | 'Pendiente' | 'Vencido' | 'Liquidado' | 'Cancelado' | 'Todos'

export interface Pago {
  id: number
  fecha: string
  monto: number
  instrumentoPagoId: number | null
  instrumentoPago: string | null
  referencia: string | null
  notas: string | null
  cancelado: boolean
  fechaCancelacion: string | null
}

/** Campos comunes de un documento con saldo (cargo o cuenta por pagar). */
export interface DocumentoSaldo {
  id: number
  folio: string
  fecha: string
  fechaVencimiento: string
  diasCredito: number
  total: number
  pagado: number
  saldo: number
  estado: EstadoSaldo
  diasVencido: number
}

export interface CargoResumen extends DocumentoSaldo {
  prospectoId: number | null
  clienteId: number | null
  destinatario: string
  cotizacion: string | null
}

export interface Cargo extends CargoResumen {
  almacenId: number | null
  almacen: string | null
  condicionPagoId: number | null
  condicionPago: string | null
  empleadoId: number | null
  empleado: string | null
  cotizacionId: number | null
  notas: string | null
  estatus: EstatusDocumento
  motivoCancelacion: string | null
  subtotal: number
  iva: number
  partidas: Partida[]
  pagos: Pago[]
}

export interface CuentaPorPagarResumen extends DocumentoSaldo {
  folioProveedor: string | null
  proveedorId: number
  proveedor: string
  concepto: string
}

export interface CuentaPorPagar extends CuentaPorPagarResumen {
  ordenCompraId: number | null
  ordenCompra: string | null
  condicionPagoId: number | null
  condicionPago: string | null
  notas: string | null
  estatus: EstatusDocumento
  motivoCancelacion: string | null
  subtotal: number
  iva: number
  pagos: Pago[]
}

export interface ResumenSaldos {
  totalPorSaldar: number
  totalVencido: number
  documentosConSaldo: number
  documentosVencidos: number
  saldadoEsteMes: number
  alCorriente: number
  vencido1a30: number
  vencido31a60: number
  vencido61a90: number
  vencidoMas90: number
}

// ---------- Mi empresa, horarios y listas de precios ----------
export interface CuentaBancaria {
  id?: number
  banco: string
  numeroCuenta: string | null
  clabe: string | null
  descripcion: string | null
}

export interface ConfiguracionEmpresa {
  razonSocial: string
  nombreComercial: string | null
  rfc: string | null
  regimenFiscal: string | null
  codigoPostal: string | null
  direccion: string | null
  telefono: string | null
  correo: string | null
  sitioWeb: string | null
  logo: string | null
  serieFactura: string | null
  pieDocumentos: string | null
  cuentasBancarias: CuentaBancaria[]
}

export type DiaSemana = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export interface BloqueHorario {
  dia: DiaSemana
  horaInicio: string
  horaFin: string
}

export interface ListaPreciosResumen {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  productos: number
  clientes: number
}

export interface PrecioLista {
  productoId: number
  codigo: string
  producto: string
  precioGeneral: number
  precio: number
}

export interface ListaPrecios {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  precios: PrecioLista[]
}

// ---------- Inventario y compras ----------
export type TipoMovimientoInventario =
  | 'EntradaCompra' | 'SalidaVenta' | 'AjusteEntrada' | 'AjusteSalida' | 'TraspasoEntrada' | 'TraspasoSalida' | 'CancelacionVenta'
export type EstatusOrdenCompra = 'Pedida' | 'RecibidaParcial' | 'Recibida' | 'Cancelada'

export interface Existencia {
  productoId: number
  codigo: string
  producto: string
  almacenId: number | null
  almacen: string | null
  cantidad: number
  stockMinimo: number | null
  costoPromedio: number
  valor: number
  bajoMinimo: boolean
}

export interface MovimientoInventario {
  id: number
  fecha: string
  productoId: number
  producto: string
  almacenId: number
  almacen: string
  tipo: TipoMovimientoInventario
  cantidad: number
  existenciaAnterior: number
  existenciaNueva: number
  costoUnitario: number
  referencia: string | null
  notas: string | null
}

export interface OrdenCompraResumen {
  id: number
  folio: string
  fecha: string
  fechaEntregaEstimada: string | null
  proveedorId: number
  proveedor: string
  almacen: string
  estatus: EstatusOrdenCompra
  total: number
  porcentajeRecibido: number
}

export interface PartidaCompra {
  id: number
  productoId: number
  codigo: string
  descripcion: string
  cantidad: number
  cantidadRecibida: number
  pendiente: number
  costoUnitario: number
  importe: number
}

export interface OrdenCompra {
  id: number
  folio: string
  fecha: string
  fechaEntregaEstimada: string | null
  proveedorId: number
  proveedor: string
  almacenId: number
  almacen: string
  condicionPagoId: number | null
  condicionPago: string | null
  diasCredito: number
  notas: string | null
  estatus: EstatusOrdenCompra
  motivoCancelacion: string | null
  subtotal: number
  iva: number
  total: number
  partidas: PartidaCompra[]
  cuentasPorPagar: { id: number; folio: string; folioProveedor: string | null; fecha: string; total: number; saldo: number }[]
}

export interface Faltante {
  productoId: number
  codigo: string
  producto: string
  existencia: number
  porRecibir: number
  stockMinimo: number
  sugerido: number
  costo: number
  proveedorId: number | null
  proveedor: string | null
}

// ---------- Mensajes, promociones, formatos y soporte ----------
export type CanalMensaje = 'Correo' | 'Sms'
export type TipoPlantilla = 'ConfirmacionCita' | 'RecordatorioCita'
export type EstatusMensaje = 'Enviado' | 'Simulado' | 'Error'

export interface EstadoMensajeria {
  correoConfigurado: boolean
  smsConfigurado: boolean
  variables: string[]
}

export interface Plantilla {
  tipo: TipoPlantilla
  canal: CanalMensaje
  asunto: string | null
  cuerpo: string
  personalizada: boolean
}

export interface MensajeEnviado {
  id: number
  fecha: string
  canal: CanalMensaje
  destinatario: string
  nombreDestinatario: string | null
  asunto: string | null
  cuerpo: string
  estatus: EstatusMensaje
  error: string | null
  origen: string
}

export interface Promocion {
  id: number
  nombre: string
  canal: CanalMensaje
  asunto: string | null
  mensaje: string
  fechaEnvio: string
  destinatarios: number
  enviados: number
  fallidos: number
}

export interface Destinatario {
  tipo: 'Prospecto' | 'Cliente'
  id: number
  nombre: string
  empresa: string | null
  celular: string | null
  correo: string | null
}

export interface Formato {
  id: number
  nombre: string
  categoria: string | null
  nombreArchivo: string
  tipoContenido: string
  tamano: number
  fechaCreacion: string
}

export interface TicketSoporte {
  id: number
  fecha: string
  asunto: string
  mensaje: string
  nombreContacto: string
  correoContacto: string
  estatusEnvio: EstatusMensaje
}
