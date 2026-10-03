import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificar } from '../components/ui'
import { api, qs } from './cliente'
import type {
  BitacoraEntrada, Catalogo, Cita, Cliente, Cotizacion, CotizacionResumen, Dashboard,
  Almacen, Empleado, EstatusCita, EstatusCotizacion, EtapaProspecto, ModuloPermiso, Producto, Prospecto, Proveedor,
  Rol, Sucursal, Usuario, Cargo, CargoResumen, CuentaPorPagar, CuentaPorPagarResumen, FiltroEstadoSaldo, ResumenSaldos,
} from './tipos'

interface OpcionesMutacion<TVariables, TResultado> {
  /** Mensaje del toast de éxito (texto fijo o calculado con el resultado). */
  exito?: string | ((resultado: TResultado, variables: TVariables) => string)
  /**
   * Mostrar el error como toast. Desactívalo en formularios: ahí el error se muestra
   * dentro del formulario, junto a los campos.
   */
  errorEnToast?: boolean
}

/**
 * Tras cualquier cambio se invalidan todas las consultas: los módulos están
 * relacionados (una cita afecta el tablero, una conversión crea un cliente...)
 * y con este volumen de datos es más simple que invalidar selectivamente.
 */
function useMutacion<TVariables, TResultado>(
  fn: (v: TVariables) => Promise<TResultado>,
  { exito, errorEnToast = true }: OpcionesMutacion<TVariables, TResultado> = {},
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (resultado, variables) => {
      qc.invalidateQueries()
      if (exito) notificar.exito(typeof exito === 'function' ? exito(resultado, variables) : exito)
    },
    onError: (error) => {
      if (errorEnToast) notificar.error(error)
    },
  })
}

/** Guardar desde un formulario: crea si no hay id, actualiza si lo hay. */
function useGuardar<T>(ruta: string, entidad: string) {
  return useMutacion(
    ({ id, datos }: { id?: number; datos: unknown }) =>
      id ? api.put<T>(`${ruta}/${id}`, datos) : api.post<T>(ruta, datos),
    { exito: (_r, v) => `${entidad} ${v.id ? 'actualizado' : 'creado'}.`, errorEnToast: false },
  )
}

// ---------- Dashboard ----------
export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: () => api.get<Dashboard>('/dashboard') })

// ---------- Catálogos simples ----------
export type RutaCatalogo =
  | 'puestos' | 'unidades-negocio' | 'acciones-actividades' | 'tipos-contacto' | 'descripciones-servicio'
  | 'instrumentos-pago' | 'condiciones-pago'

export const useCatalogo = (ruta: RutaCatalogo, incluirInactivos = false) =>
  useQuery({
    queryKey: [ruta, { incluirInactivos }],
    queryFn: () => api.get<Catalogo[]>(`/${ruta}${qs({ incluirInactivos })}`),
  })

export const useGuardarCatalogo = (ruta: RutaCatalogo) => useGuardar<Catalogo>(`/${ruta}`, 'Registro')

export const useDesactivarCatalogo = (ruta: RutaCatalogo) =>
  useMutacion((id: number) => api.delete(`/${ruta}/${id}`), { exito: 'Registro dado de baja.' })

// ---------- Empleados ----------
export const useEmpleados = (incluirInactivos = false) =>
  useQuery({
    queryKey: ['empleados', { incluirInactivos }],
    queryFn: () => api.get<Empleado[]>(`/empleados${qs({ incluirInactivos })}`),
  })

export const useGuardarEmpleado = () => useGuardar<Empleado>('/empleados', 'Empleado')

export const useDesactivarEmpleado = () =>
  useMutacion((id: number) => api.delete(`/empleados/${id}`), { exito: 'Empleado dado de baja.' })

// ---------- Clientes ----------
export const useClientes = (buscar = '', incluirInactivos = false) =>
  useQuery({
    queryKey: ['clientes', { buscar, incluirInactivos }],
    queryFn: () => api.get<Cliente[]>(`/clientes${qs({ buscar, incluirInactivos })}`),
  })

export const useGuardarCliente = () => useGuardar<Cliente>('/clientes', 'Cliente')

export const useDesactivarCliente = () =>
  useMutacion((id: number) => api.delete(`/clientes/${id}`), { exito: 'Cliente dado de baja.' })

// ---------- Productos ----------
export const useProductos = (buscar = '', incluirInactivos = false) =>
  useQuery({
    queryKey: ['productos', { buscar, incluirInactivos }],
    queryFn: () => api.get<Producto[]>(`/productos${qs({ buscar, incluirInactivos })}`),
  })

export const useGuardarProducto = () => useGuardar<Producto>('/productos', 'Producto')

export const useDesactivarProducto = () =>
  useMutacion((id: number) => api.delete(`/productos/${id}`), { exito: 'Producto dado de baja.' })

// ---------- Proveedores ----------
export const useProveedores = (buscar = '', incluirInactivos = false) =>
  useQuery({
    queryKey: ['proveedores', { buscar, incluirInactivos }],
    queryFn: () => api.get<Proveedor[]>(`/proveedores${qs({ buscar, incluirInactivos })}`),
  })

export const useGuardarProveedor = () => useGuardar<Proveedor>('/proveedores', 'Proveedor')

export const useDesactivarProveedor = () =>
  useMutacion((id: number) => api.delete(`/proveedores/${id}`), { exito: 'Proveedor dado de baja.' })

// ---------- Sucursales y almacenes ----------
export const useSucursales = (incluirInactivos = false) =>
  useQuery({
    queryKey: ['sucursales', { incluirInactivos }],
    queryFn: () => api.get<Sucursal[]>(`/sucursales${qs({ incluirInactivos })}`),
  })

export const useGuardarSucursal = () => useGuardar<Sucursal>('/sucursales', 'Sucursal')

export const useDesactivarSucursal = () =>
  useMutacion((id: number) => api.delete(`/sucursales/${id}`), { exito: 'Sucursal dada de baja.' })

export const useAlmacenes = (incluirInactivos = false) =>
  useQuery({
    queryKey: ['almacenes', { incluirInactivos }],
    queryFn: () => api.get<Almacen[]>(`/almacenes${qs({ incluirInactivos })}`),
  })

export const useGuardarAlmacen = () => useGuardar<Almacen>('/almacenes', 'Almacén')

export const useDesactivarAlmacen = () =>
  useMutacion((id: number) => api.delete(`/almacenes/${id}`), { exito: 'Almacén dado de baja.' })

// ---------- Prospectos ----------
export interface FiltroProspectos {
  buscar?: string
  etapa?: EtapaProspecto | ''
  empleadoId?: number | ''
}

export const useProspectos = (filtro: FiltroProspectos = {}, habilitado = true) =>
  useQuery({
    queryKey: ['prospectos', filtro],
    queryFn: () => api.get<Prospecto[]>(`/prospectos${qs({ ...filtro })}`),
    enabled: habilitado,
  })

export const useProspecto = (id: number) =>
  useQuery({ queryKey: ['prospectos', id], queryFn: () => api.get<Prospecto>(`/prospectos/${id}`) })

export const useGuardarProspecto = () => useGuardar<Prospecto>('/prospectos', 'Prospecto')

export const useCambiarEtapa = () =>
  useMutacion(
    ({ id, etapa }: { id: number; etapa: EtapaProspecto }) => api.patch<Prospecto>(`/prospectos/${id}/etapa`, { etapa }),
    { exito: (p) => `${p.nombreCompleto} pasó a ${p.etapa}.` },
  )

export const useConvertirEnCliente = () =>
  useMutacion((id: number) => api.post<Cliente>(`/prospectos/${id}/convertir-cliente`), {
    exito: (c) => `Cliente creado: ${c.razonSocial}.`,
  })

export const useDesactivarProspecto = () =>
  useMutacion((id: number) => api.delete(`/prospectos/${id}`), { exito: 'Prospecto dado de baja.' })

export const useBitacora = (prospectoId: number) =>
  useQuery({
    queryKey: ['bitacora', prospectoId],
    queryFn: () => api.get<BitacoraEntrada[]>(`/prospectos/${prospectoId}/bitacora`),
  })

export const useAgregarBitacora = (prospectoId: number) =>
  useMutacion(
    (datos: { descripcion: string; empleadoId?: number | null; accionActividadId?: number | null }) =>
      api.post<BitacoraEntrada>(`/prospectos/${prospectoId}/bitacora`, datos),
    { exito: 'Nota agregada a la bitácora.', errorEnToast: false },
  )

// ---------- Citas ----------
export interface FiltroCitas {
  desde?: string
  hasta?: string
  empleadoId?: number | ''
  prospectoId?: number
}

export const useCitas = (filtro: FiltroCitas, habilitado = true) =>
  useQuery({
    queryKey: ['citas', filtro],
    queryFn: () => api.get<Cita[]>(`/citas${qs({ ...filtro })}`),
    enabled: habilitado,
  })

export const useGuardarCita = () => useGuardar<Cita>('/citas', 'Cita')

export const useCambiarEstatusCita = () =>
  useMutacion(
    ({ id, estatus }: { id: number; estatus: EstatusCita }) => api.patch<Cita>(`/citas/${id}/estatus`, { estatus }),
    { exito: 'Estatus de la cita actualizado.' },
  )

export const useEliminarCita = () => useMutacion((id: number) => api.delete(`/citas/${id}`), { exito: 'Cita eliminada.' })

// ---------- Cotizaciones ----------
export interface FiltroCotizaciones {
  estatus?: EstatusCotizacion | ''
  prospectoId?: number
  clienteId?: number
}

export const useCotizaciones = (filtro: FiltroCotizaciones = {}, habilitado = true) =>
  useQuery({
    queryKey: ['cotizaciones', filtro],
    queryFn: () => api.get<CotizacionResumen[]>(`/cotizaciones${qs({ ...filtro })}`),
    enabled: habilitado,
  })

export const useCotizacion = (id: number | undefined) =>
  useQuery({
    queryKey: ['cotizaciones', id],
    queryFn: () => api.get<Cotizacion>(`/cotizaciones/${id}`),
    enabled: id !== undefined,
  })

export const useGuardarCotizacion = () =>
  useMutacion(
    ({ id, datos }: { id?: number; datos: unknown }) =>
      id ? api.put<Cotizacion>(`/cotizaciones/${id}`, datos) : api.post<Cotizacion>('/cotizaciones', datos),
    { exito: (c, v) => `Cotización ${c.folio} ${v.id ? 'guardada' : 'creada'}.`, errorEnToast: false },
  )

export const useCambiarEstatusCotizacion = () =>
  useMutacion(
    ({ id, estatus }: { id: number; estatus: EstatusCotizacion }) =>
      api.patch<Cotizacion>(`/cotizaciones/${id}/estatus`, { estatus }),
    { exito: (c) => `Cotización ${c.folio}: ${c.estatus}.` },
  )

export const useEliminarCotizacion = () =>
  useMutacion((id: number) => api.delete(`/cotizaciones/${id}`), { exito: 'Cotización eliminada.' })

// ---------- Usuarios ----------
export const useUsuarios = () => useQuery({ queryKey: ['usuarios'], queryFn: () => api.get<Usuario[]>('/usuarios') })

export const useGuardarUsuario = () => useGuardar<Usuario>('/usuarios', 'Usuario')

export const useRestablecerPassword = () =>
  useMutacion(
    ({ id, passwordNueva }: { id: number; passwordNueva: string }) =>
      api.post(`/usuarios/${id}/restablecer-password`, { passwordNueva }),
    { exito: 'Contraseña restablecida.', errorEnToast: false },
  )

export const useDesbloquearUsuario = () =>
  useMutacion((id: number) => api.post(`/usuarios/${id}/desbloquear`), { exito: 'Usuario desbloqueado.' })

export const useCambiarMiPassword = () =>
  useMutacion(
    (datos: { passwordActual: string; passwordNueva: string }) => api.post('/auth/cambiar-password', datos),
    { exito: 'Tu contraseña se cambió correctamente.', errorEnToast: false },
  )

// ---------- Roles ----------
export const useRoles = (habilitado = true) =>
  useQuery({ queryKey: ['roles'], queryFn: () => api.get<Rol[]>('/roles'), enabled: habilitado })

export const useCatalogoPermisos = () =>
  useQuery({ queryKey: ['roles', 'permisos'], queryFn: () => api.get<ModuloPermiso[]>('/roles/permisos'), staleTime: Infinity })

export const useGuardarRol = () => useGuardar<Rol>('/roles', 'Rol')

export const useEliminarRol = () => useMutacion((id: number) => api.delete(`/roles/${id}`), { exito: 'Rol eliminado.' })

// ---------- Cargos y cobranza ----------
export interface FiltroCargos {
  buscar?: string
  estado?: FiltroEstadoSaldo
  clienteId?: number
  prospectoId?: number
}

/** `ruta` es "cargos" (ventas) o "cobranza" (cuentas por cobrar): misma lista, distinto permiso. */
export const useCargos = (filtro: FiltroCargos = {}, ruta: 'cargos' | 'cobranza' = 'cargos', habilitado = true) =>
  useQuery({
    queryKey: [ruta, filtro],
    queryFn: () => api.get<CargoResumen[]>(`/${ruta}${qs({ ...filtro })}`),
    enabled: habilitado,
  })

export const useCargo = (id: number | undefined) =>
  useQuery({ queryKey: ['cargos', id], queryFn: () => api.get<Cargo>(`/cargos/${id}`), enabled: !!id })

export const useResumenCobranza = () =>
  useQuery({ queryKey: ['cobranza', 'resumen'], queryFn: () => api.get<ResumenSaldos>('/cobranza/resumen') })

export const useCrearCargo = () =>
  useMutacion((datos: unknown) => api.post<Cargo>('/cargos', datos),
    { exito: (c) => `Cargo ${c.folio} creado.`, errorEnToast: false })

export const useCargoDesdeCotizacion = () =>
  useMutacion(({ cotizacionId, datos }: { cotizacionId: number; datos: unknown }) =>
    api.post<Cargo>(`/cargos/desde-cotizacion/${cotizacionId}`, datos),
  { exito: (c) => `Cargo ${c.folio} generado.`, errorEnToast: false })

export const useCancelarCargo = () =>
  useMutacion(({ id, motivo }: { id: number; motivo: string }) => api.post<Cargo>(`/cargos/${id}/cancelar`, { motivo }),
    { exito: (c) => `Cargo ${c.folio} cancelado.`, errorEnToast: false })

export const useRegistrarPagoCargo = () =>
  useMutacion(({ id, datos }: { id: number; datos: unknown }) => api.post<Cargo>(`/cargos/${id}/pagos`, datos),
    { exito: (c) => (c.saldo === 0 ? `Pago aplicado. ${c.folio} quedó liquidado.` : 'Pago aplicado.'), errorEnToast: false })

export const useCancelarPagoCargo = () =>
  useMutacion(({ id, pagoId }: { id: number; pagoId: number }) => api.post<Cargo>(`/cargos/${id}/pagos/${pagoId}/cancelar`, {}),
    { exito: 'Pago cancelado.' })

// ---------- Cuentas por pagar ----------
export interface FiltroCuentasPorPagar {
  buscar?: string
  estado?: FiltroEstadoSaldo
  proveedorId?: number
}

export const useCuentasPorPagar = (filtro: FiltroCuentasPorPagar = {}) =>
  useQuery({
    queryKey: ['cuentas-pagar', filtro],
    queryFn: () => api.get<CuentaPorPagarResumen[]>(`/cuentas-pagar${qs({ ...filtro })}`),
  })

export const useCuentaPorPagar = (id: number | undefined) =>
  useQuery({ queryKey: ['cuentas-pagar', id], queryFn: () => api.get<CuentaPorPagar>(`/cuentas-pagar/${id}`), enabled: !!id })

export const useResumenCuentasPorPagar = () =>
  useQuery({ queryKey: ['cuentas-pagar', 'resumen'], queryFn: () => api.get<ResumenSaldos>('/cuentas-pagar/resumen') })

export const useGuardarCuentaPorPagar = () =>
  useMutacion(({ id, datos }: { id?: number; datos: unknown }) =>
    id ? api.put<CuentaPorPagar>(`/cuentas-pagar/${id}`, datos) : api.post<CuentaPorPagar>('/cuentas-pagar', datos),
  { exito: (c, v) => `Cuenta ${c.folio} ${v.id ? 'actualizada' : 'registrada'}.`, errorEnToast: false })

export const useCancelarCuentaPorPagar = () =>
  useMutacion(({ id, motivo }: { id: number; motivo: string }) => api.post<CuentaPorPagar>(`/cuentas-pagar/${id}/cancelar`, { motivo }),
    { exito: (c) => `Cuenta ${c.folio} cancelada.`, errorEnToast: false })

export const useRegistrarPagoProveedor = () =>
  useMutacion(({ id, datos }: { id: number; datos: unknown }) => api.post<CuentaPorPagar>(`/cuentas-pagar/${id}/pagos`, datos),
    { exito: (c) => (c.saldo === 0 ? `Pago registrado. ${c.folio} quedó liquidada.` : 'Pago registrado.'), errorEnToast: false })

export const useCancelarPagoProveedor = () =>
  useMutacion(({ id, pagoId }: { id: number; pagoId: number }) => api.post<CuentaPorPagar>(`/cuentas-pagar/${id}/pagos/${pagoId}/cancelar`, {}),
    { exito: 'Pago cancelado.' })
