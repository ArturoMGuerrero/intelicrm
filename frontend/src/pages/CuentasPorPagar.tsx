import { useState, type FormEvent } from 'react'
import {
  useCancelarCuentaPorPagar, useCancelarPagoProveedor, useCatalogo, useCuentaPorPagar, useCuentasPorPagar,
  useGuardarCuentaPorPagar, useProveedores, useRegistrarPagoProveedor, useResumenCuentasPorPagar,
} from '../api/hooks'
import type { CuentaPorPagar, CuentaPorPagarResumen, FiltroEstadoSaldo, Pago } from '../api/tipos'
import { TASA_IVA, Totales } from '../components/EditorPartidas'
import { filtrosEstadoSaldo, FormCancelarDocumento, FormPago, HistorialPagos, InsigniaSaldo, ResumenDeSaldos } from '../components/Saldos'
import {
  Aviso, BarraFiltros, Boton, Buscador, Campo, Cargando, Celda, CeldaAcciones, Checkbox, cn, Doble, Encabezado,
  errorDeCampo, FiltroChips, Fila, Input, ListaDatos, MensajeError, Modal, nulo, PieFormulario, Select, Tabla, Tarjeta,
  Textarea, useConfirmar, Vacio,
} from '../components/ui'
import { aIsoFecha, formatoFecha, formatoMoneda } from '../lib/formato'
import { SiPuede, useSesion } from '../sesion/Sesion'

/** Cuentas por pagar a proveedores. Por ahora se capturan a mano (más adelante vendrán de Compras). */
export default function CuentasPorPagar() {
  const { puede } = useSesion()
  const [buscar, setBuscar] = useState('')
  const [estado, setEstado] = useState<FiltroEstadoSaldo>('ConSaldo')
  const [nueva, setNueva] = useState(false)
  const [detalle, setDetalle] = useState<number | null>(null)
  const [pagando, setPagando] = useState<CuentaPorPagarResumen | null>(null)
  const resumen = useResumenCuentasPorPagar()
  const { data, isLoading, error } = useCuentasPorPagar({ buscar, estado })
  const pagar = useRegistrarPagoProveedor()

  return (
    <>
      <Encabezado titulo="Cuentas por pagar" descripcion="Facturas de proveedores pendientes de pago."
        acciones={<SiPuede permiso="cuentas-pagar.editar"><Boton variante="primario" icono="mas" onClick={() => setNueva(true)}>Registrar factura</Boton></SiPuede>} />

      {resumen.data && <ResumenDeSaldos resumen={resumen.data} tipo="pagar" />}

      <BarraFiltros>
        <Buscador placeholder="Buscar por folio, proveedor o concepto…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
      </BarraFiltros>
      <FiltroChips opciones={filtrosEstadoSaldo} valor={estado} onCambiar={setEstado} />

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay cuentas con este filtro." /></Tarjeta> : (
        <Tabla columnas={[
          { titulo: 'Folio' }, { titulo: 'Proveedor / concepto' }, { titulo: 'Vence' },
          { titulo: 'Total', derecha: true }, { titulo: 'Saldo', derecha: true }, { titulo: 'Estado' }, { titulo: '' },
        ]}>
          {data.map((c) => (
            <Fila key={c.id} inactiva={c.estado === 'Cancelado'} onClick={() => setDetalle(c.id)}>
              <Celda><Doble principal={<span className="font-mono">{c.folio}</span>} secundario={c.folioProveedor && `Factura ${c.folioProveedor}`} /></Celda>
              <Celda><Doble principal={c.proveedor} secundario={c.concepto} /></Celda>
              <Celda className={cn('tabular-nums', c.estado === 'Vencido' ? 'font-medium text-rose-600' : 'text-slate-600')}>
                {formatoFecha(c.fechaVencimiento)}
              </Celda>
              <Celda derecha className="tabular-nums text-slate-600">{formatoMoneda(c.total)}</Celda>
              <Celda derecha className="font-semibold tabular-nums">{formatoMoneda(c.saldo)}</Celda>
              <Celda><InsigniaSaldo estado={c.estado} diasVencido={c.diasVencido} /></Celda>
              <CeldaAcciones>
                {c.saldo > 0 && c.estado !== 'Cancelado' && puede('cuentas-pagar.editar') && (
                  <Boton tamano="sm" icono="salida" onClick={() => setPagando(c)}>Pagar</Boton>
                )}
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}

      {nueva && <FormCuenta onCerrar={() => setNueva(false)} />}
      {detalle && <DetalleCuenta id={detalle} onCerrar={() => setDetalle(null)} />}
      {pagando && (
        <FormPago titulo={`Pago a ${pagando.proveedor}`} folio={pagando.folio} saldo={pagando.saldo} fechaMinima={pagando.fecha}
          guardando={pagar.isPending} error={pagar.error} onCerrar={() => setPagando(null)}
          onGuardar={(datos) => pagar.mutate({ id: pagando.id, datos }, { onSuccess: () => setPagando(null) })} />
      )}
    </>
  )
}

/** Alta o edición de una factura de proveedor. */
function FormCuenta({ cuenta, onCerrar }: { cuenta?: CuentaPorPagar; onCerrar: () => void }) {
  const guardar = useGuardarCuentaPorPagar()
  const proveedores = useProveedores().data ?? []
  const condiciones = useCatalogo('condiciones-pago').data ?? []
  const [f, setF] = useState({
    proveedorId: cuenta?.proveedorId.toString() ?? '', folioProveedor: cuenta?.folioProveedor ?? '',
    concepto: cuenta?.concepto ?? '', fecha: cuenta?.fecha ?? aIsoFecha(new Date()),
    condicionPagoId: cuenta?.condicionPagoId?.toString() ?? '', diasCredito: cuenta?.diasCredito.toString() ?? '',
    subtotal: cuenta?.subtotal.toString() ?? '', conIva: cuenta ? cuenta.iva > 0 : true, notas: cuenta?.notas ?? '',
  })
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (c: string) => errorDeCampo(guardar.error, c)

  // Al elegir proveedor se propone su condición de pago.
  const elegirProveedor = (id: string) => {
    const proveedor = proveedores.find((p) => p.id === Number(id))
    setF({
      ...f, proveedorId: id,
      condicionPagoId: proveedor?.condicionPagoId?.toString() ?? f.condicionPagoId,
      diasCredito: proveedor?.diasCredito?.toString() ?? f.diasCredito,
    })
  }
  const elegirCondicion = (id: string) => {
    const condicion = condiciones.find((c) => c.id === Number(id))
    setF({ ...f, condicionPagoId: id, diasCredito: condicion?.diasCredito?.toString() ?? f.diasCredito })
  }

  const subtotal = Number(f.subtotal) || 0
  const iva = f.conIva ? Math.round(subtotal * TASA_IVA * 100) / 100 : 0

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({
      id: cuenta?.id,
      datos: {
        proveedorId: Number(f.proveedorId), folioProveedor: nulo(f.folioProveedor), concepto: f.concepto, fecha: f.fecha,
        condicionPagoId: f.condicionPagoId ? Number(f.condicionPagoId) : null,
        diasCredito: f.diasCredito === '' ? null : Number(f.diasCredito),
        subtotal, conIva: f.conIva, notas: nulo(f.notas),
      },
    }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo={cuenta ? `Editar ${cuenta.folio}` : 'Registrar factura de proveedor'} onCerrar={onCerrar} ancho="max-w-2xl">
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Proveedor *" className="sm:col-span-2" error={err('proveedorId')}>
          <Select value={f.proveedorId} onChange={(e) => elegirProveedor(e.target.value)} required autoFocus>
            <option value="">Selecciona…</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Folio de la factura" error={err('folioProveedor')}>
          <Input className="font-mono uppercase" value={f.folioProveedor} onChange={cambiar('folioProveedor')} />
        </Campo>
        <Campo etiqueta="Fecha de la factura"><Input type="date" value={f.fecha} onChange={cambiar('fecha')} required /></Campo>
        <Campo etiqueta="Concepto *" className="sm:col-span-2" error={err('concepto')}>
          <Input value={f.concepto} onChange={cambiar('concepto')} required />
        </Campo>
        <Campo etiqueta="Condición de pago">
          <Select value={f.condicionPagoId} onChange={(e) => elegirCondicion(e.target.value)}>
            <option value="">— (indicar días)</option>
            {condiciones.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Días de crédito" ayuda="Vacío = los de la condición de pago." error={err('diasCredito')}>
          <Input type="number" min="0" max="365" value={f.diasCredito} onChange={cambiar('diasCredito')} />
        </Campo>
        <Campo etiqueta="Subtotal *" error={err('subtotal')}>
          <Input className="text-right" type="number" min="0.01" step="0.01" value={f.subtotal} onChange={cambiar('subtotal')} required />
        </Campo>
        <div className="flex items-end pb-2"><Checkbox etiqueta="Lleva IVA 16%" checked={f.conIva} onChange={(e) => setF({ ...f, conIva: e.target.checked })} /></div>
        <div className="flex justify-end sm:col-span-2"><Totales subtotal={subtotal} iva={iva} total={subtotal + iva} /></div>
        <Campo etiqueta="Notas" className="sm:col-span-2"><Textarea rows={2} value={f.notas} onChange={cambiar('notas')} /></Campo>
        <div className="sm:col-span-2"><PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} /></div>
      </form>
    </Modal>
  )
}

/** Detalle de una cuenta por pagar con sus pagos y acciones. */
function DetalleCuenta({ id, onCerrar }: { id: number; onCerrar: () => void }) {
  const { puede } = useSesion()
  const confirmar = useConfirmar()
  const { data: cuenta, isLoading, error } = useCuentaPorPagar(id)
  const pagar = useRegistrarPagoProveedor()
  const cancelar = useCancelarCuentaPorPagar()
  const cancelarPago = useCancelarPagoProveedor()
  const [accion, setAccion] = useState<'pagar' | 'cancelar' | 'editar' | null>(null)

  if (accion === 'editar' && cuenta) return <FormCuenta cuenta={cuenta} onCerrar={() => setAccion(null)} />

  const vigente = cuenta?.estatus === 'Vigente'
  const sinPagos = !cuenta?.pagos.some((p) => !p.cancelado)

  const quitarPago = async (p: Pago) => {
    if (cuenta && await confirmar({
      titulo: 'Cancelar pago', peligro: true, textoConfirmar: 'Cancelar pago',
      mensaje: <>¿Cancelar el pago de <b>{formatoMoneda(p.monto)}</b> del {formatoFecha(p.fecha)}?</>,
    })) cancelarPago.mutate({ id: cuenta.id, pagoId: p.id })
  }

  return (
    <>
      <Modal abierto titulo={cuenta ? `${cuenta.folio} · ${cuenta.proveedor}` : 'Cuenta por pagar'} onCerrar={onCerrar} ancho="max-w-3xl">
        {isLoading ? <Cargando /> : error || !cuenta ? <MensajeError error={error} /> : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <InsigniaSaldo estado={cuenta.estado} diasVencido={cuenta.diasVencido} />
              {vigente && (
                <div className="flex flex-wrap gap-2">
                  {sinPagos && puede('cuentas-pagar.editar') && <Boton icono="editar" onClick={() => setAccion('editar')}>Editar</Boton>}
                  {sinPagos && puede('cuentas-pagar.eliminar') && <Boton variante="peligro" onClick={() => setAccion('cancelar')}>Cancelar</Boton>}
                  {cuenta.saldo > 0 && puede('cuentas-pagar.editar') && (
                    <Boton variante="primario" icono="salida" onClick={() => setAccion('pagar')}>Registrar pago</Boton>
                  )}
                </div>
              )}
            </div>
            {!vigente && <Aviso>Cancelada: {cuenta.motivoCancelacion}</Aviso>}

            <div className="grid gap-5 sm:grid-cols-2">
              <ListaDatos datos={[
                ['Concepto', cuenta.concepto],
                ['Factura del proveedor', cuenta.folioProveedor ?? '—'],
                ['Fecha', formatoFecha(cuenta.fecha)],
                ['Vence', `${formatoFecha(cuenta.fechaVencimiento)} (${cuenta.diasCredito ? `${cuenta.diasCredito} días` : 'contado'})`],
                ['Notas', cuenta.notas ?? '—'],
              ]} />
              <div className="flex justify-end">
                <Totales subtotal={cuenta.subtotal} iva={cuenta.iva} total={cuenta.total} extra={[
                  ['Pagado', cuenta.pagado, 'text-emerald-700'],
                  ['Saldo', cuenta.saldo, 'border-t border-slate-200 pt-1.5 text-base font-semibold'],
                ]} />
              </div>
            </div>

            <HistorialPagos pagos={cuenta.pagos} onCancelar={vigente && puede('cuentas-pagar.eliminar') ? quitarPago : undefined} />
          </div>
        )}
      </Modal>

      {cuenta && accion === 'pagar' && (
        <FormPago titulo={`Pago a ${cuenta.proveedor}`} folio={cuenta.folio} saldo={cuenta.saldo} fechaMinima={cuenta.fecha}
          guardando={pagar.isPending} error={pagar.error} onCerrar={() => setAccion(null)}
          onGuardar={(datos) => pagar.mutate({ id: cuenta.id, datos }, { onSuccess: () => setAccion(null) })} />
      )}
      {cuenta && accion === 'cancelar' && (
        <FormCancelarDocumento folio={cuenta.folio} guardando={cancelar.isPending} error={cancelar.error}
          onCerrar={() => setAccion(null)}
          onConfirmar={(motivo) => cancelar.mutate({ id: cuenta.id, motivo }, { onSuccess: () => setAccion(null) })} />
      )}
    </>
  )
}
