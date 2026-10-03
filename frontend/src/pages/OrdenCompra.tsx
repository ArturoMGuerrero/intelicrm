import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  useAlmacenes, useCancelarOrdenCompra, useCatalogo, useGuardarOrdenCompra, useOrdenCompra, useProductos, useProveedores,
  useRecibirCompra,
} from '../api/hooks'
import type { OrdenCompra as Orden } from '../api/tipos'
import { InsigniaCompra } from '../components/Compras'
import { TASA_IVA, Totales } from '../components/EditorPartidas'
import { FormCancelarDocumento } from '../components/Saldos'
import {
  Aviso, Boton, BotonEnlace, BotonIcono, Campo, Cargando, Celda, Encabezado, Icono, Input, ListaDatos, MensajeError,
  Modal, nulo, PieFormulario, Select, Tabla, Tarjeta, Textarea,
} from '../components/ui'
import { aIsoFecha, formatoFecha, formatoMoneda } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'

const cantidad = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 2 })

/** Orden de compra: captura (nueva o sin recepciones) o detalle con recepción de mercancía. */
export default function OrdenCompra() {
  const { id } = useParams()
  const ordenId = id ? Number(id) : undefined
  const { data, isLoading, error } = useOrdenCompra(ordenId)
  const { puede } = useSesion()

  if (ordenId && isLoading) return <Cargando />
  if (ordenId && (error || !data)) return <MensajeError error={error ?? new Error('Orden no encontrada.')} />

  const editable = puede('compras.editar') && (!data || (data.estatus === 'Pedida' && data.partidas.every((p) => p.cantidadRecibida === 0)))
  return editable ? <Editor key={data?.id ?? 'nueva'} orden={data} /> : <Detalle orden={data!} />
}

interface PartidaForm { clave: number; productoId: string; cantidad: string; costoUnitario: string }
let siguiente = 1

function Editor({ orden }: { orden?: Orden }) {
  const navegar = useNavigate()
  const guardar = useGuardarOrdenCompra()
  const proveedores = useProveedores().data ?? []
  const almacenes = useAlmacenes().data ?? []
  const condiciones = useCatalogo('condiciones-pago').data ?? []
  const productos = (useProductos().data ?? []).filter((p) => p.tipo === 'Producto')
  const [f, setF] = useState({
    proveedorId: orden?.proveedorId.toString() ?? '', almacenId: orden?.almacenId.toString() ?? '',
    fecha: orden?.fecha ?? aIsoFecha(new Date()), fechaEntregaEstimada: orden?.fechaEntregaEstimada ?? '',
    condicionPagoId: orden?.condicionPagoId?.toString() ?? '', diasCredito: orden?.diasCredito.toString() ?? '', notas: orden?.notas ?? '',
  })
  const [partidas, setPartidas] = useState<PartidaForm[]>(() => orden?.partidas.length
    ? orden.partidas.map((p) => ({ clave: siguiente++, productoId: p.productoId.toString(), cantidad: p.cantidad.toString(), costoUnitario: p.costoUnitario.toString() }))
    : [{ clave: siguiente++, productoId: '', cantidad: '1', costoUnitario: '' }])
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const cambiarPartida = (clave: number, cambios: Partial<PartidaForm>) => setPartidas(partidas.map((p) => (p.clave === clave ? { ...p, ...cambios } : p)))

  const elegirProveedor = (id: string) => {
    const proveedor = proveedores.find((p) => p.id === Number(id))
    setF({ ...f, proveedorId: id, condicionPagoId: proveedor?.condicionPagoId?.toString() ?? '', diasCredito: proveedor?.diasCredito?.toString() ?? '' })
  }
  const elegirCondicion = (id: string) => {
    const condicion = condiciones.find((c) => c.id === Number(id))
    setF({ ...f, condicionPagoId: id, diasCredito: condicion?.diasCredito?.toString() ?? f.diasCredito })
  }
  const elegirProducto = (clave: number, productoId: string) => {
    const producto = productos.find((p) => p.id === Number(productoId))
    cambiarPartida(clave, { productoId, costoUnitario: producto ? producto.costo.toString() : '' })
  }

  const importe = (p: PartidaForm) => Math.round((Number(p.cantidad) || 0) * (Number(p.costoUnitario) || 0) * 100) / 100
  const subtotal = partidas.reduce((s, p) => s + importe(p), 0)
  const iva = Math.round(subtotal * TASA_IVA * 100) / 100

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({
      id: orden?.id,
      datos: {
        proveedorId: Number(f.proveedorId), almacenId: Number(f.almacenId), fecha: f.fecha,
        fechaEntregaEstimada: f.fechaEntregaEstimada || null,
        condicionPagoId: f.condicionPagoId ? Number(f.condicionPagoId) : null,
        diasCredito: f.diasCredito === '' ? null : Number(f.diasCredito), notas: nulo(f.notas),
        partidas: partidas.filter((p) => p.productoId).map((p) => ({
          productoId: Number(p.productoId), cantidad: Number(p.cantidad), costoUnitario: p.costoUnitario === '' ? null : Number(p.costoUnitario),
        })),
      },
    }, { onSuccess: (o) => navegar(`/compras/${o.id}`, { replace: true }) })
  }

  return (
    <form onSubmit={enviar}>
      <Link to="/compras" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <Icono nombre="izquierda" className="h-4 w-4" /> Órdenes de compra
      </Link>
      <Encabezado titulo={orden ? `Editar ${orden.folio}` : 'Nueva orden de compra'} descripcion="Solo productos; los servicios no se compran por aquí." />

      <div className="space-y-6">
        <Tarjeta className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Proveedor *" className="lg:col-span-2">
            <Select value={f.proveedorId} onChange={(e) => elegirProveedor(e.target.value)} required>
              <option value="">Selecciona…</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="Recibir en el almacén *" className="lg:col-span-2">
            <Select value={f.almacenId} onChange={cambiar('almacenId')} required>
              <option value="">Selecciona…</option>
              {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.sucursal})</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="Fecha"><Input type="date" value={f.fecha} onChange={cambiar('fecha')} required /></Campo>
          <Campo etiqueta="Entrega estimada"><Input type="date" value={f.fechaEntregaEstimada} onChange={cambiar('fechaEntregaEstimada')} /></Campo>
          <Campo etiqueta="Condición de pago">
            <Select value={f.condicionPagoId} onChange={(e) => elegirCondicion(e.target.value)}>
              <option value="">—</option>
              {condiciones.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="Días de crédito"><Input type="number" min="0" max="365" value={f.diasCredito} onChange={cambiar('diasCredito')} /></Campo>
        </Tarjeta>

        <div>
          <Tabla className="min-w-[640px]" columnas={[
            { titulo: 'Producto' }, { titulo: 'Cantidad', derecha: true, className: 'w-28' },
            { titulo: 'Costo unit.', derecha: true, className: 'w-36' }, { titulo: 'Importe', derecha: true, className: 'w-32' }, { titulo: '', className: 'w-10' },
          ]}>
            {partidas.map((p) => (
              <tr key={p.clave}>
                <Celda>
                  <Select value={p.productoId} onChange={(e) => elegirProducto(p.clave, e.target.value)} aria-label="Producto" required>
                    <option value="">Selecciona…</option>
                    {productos.map((x) => <option key={x.id} value={x.id}>{x.codigo} · {x.nombre}</option>)}
                  </Select>
                </Celda>
                <Celda><Input className="text-right" type="number" min="0.0001" step="any" value={p.cantidad} aria-label="Cantidad"
                  onChange={(e) => cambiarPartida(p.clave, { cantidad: e.target.value })} required /></Celda>
                <Celda><Input className="text-right" type="number" min="0" step="0.01" value={p.costoUnitario} aria-label="Costo unitario"
                  onChange={(e) => cambiarPartida(p.clave, { costoUnitario: e.target.value })} /></Celda>
                <Celda derecha className="font-medium tabular-nums">{formatoMoneda(importe(p))}</Celda>
                <Celda><BotonIcono icono="basura" etiqueta="Quitar" peligro disabled={partidas.length === 1}
                  onClick={() => setPartidas(partidas.filter((x) => x.clave !== p.clave))} /></Celda>
              </tr>
            ))}
          </Tabla>
          <Tarjeta className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <Boton icono="mas" className="self-start" onClick={() => setPartidas([...partidas, { clave: siguiente++, productoId: '', cantidad: '1', costoUnitario: '' }])}>
              Agregar producto
            </Boton>
            <Totales subtotal={subtotal} iva={iva} total={subtotal + iva} />
          </Tarjeta>
        </div>

        <Tarjeta><Campo etiqueta="Notas"><Textarea value={f.notas} onChange={cambiar('notas')} /></Campo></Tarjeta>
      </div>

      <div className="mt-6 space-y-3">
        <MensajeError error={guardar.error} />
        <div className="flex justify-end gap-2">
          <BotonEnlace to={orden ? `/compras/${orden.id}` : '/compras'}>Cancelar</BotonEnlace>
          <Boton type="submit" variante="primario" cargando={guardar.isPending}>{orden ? 'Guardar cambios' : 'Crear orden'}</Boton>
        </div>
      </div>
    </form>
  )
}

function Detalle({ orden }: { orden: Orden }) {
  const { puede } = useSesion()
  const cancelar = useCancelarOrdenCompra()
  const [accion, setAccion] = useState<'recibir' | 'cancelar' | null>(null)
  const abierta = orden.estatus === 'Pedida' || orden.estatus === 'RecibidaParcial'
  const sinRecepciones = orden.partidas.every((p) => p.cantidadRecibida === 0)

  return (
    <>
      <Link to="/compras" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <Icono nombre="izquierda" className="h-4 w-4" /> Órdenes de compra
      </Link>
      <Encabezado
        titulo={<span className="flex items-center gap-3"><span className="font-mono">{orden.folio}</span><InsigniaCompra estatus={orden.estatus} /></span>}
        descripcion={orden.proveedor}
        acciones={abierta && puede('compras.editar') && (
          <>
            <Boton variante="primario" icono="productos" onClick={() => setAccion('recibir')}>Recibir mercancía</Boton>
            {sinRecepciones && puede('compras.eliminar') && <Boton variante="peligro" onClick={() => setAccion('cancelar')}>Cancelar orden</Boton>}
          </>
        )} />
      {orden.estatus === 'Cancelada' && <div className="mb-4"><Aviso>Orden cancelada: {orden.motivoCancelacion}</Aviso></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tabla columnas={[
            { titulo: 'Producto' }, { titulo: 'Pedido', derecha: true }, { titulo: 'Recibido', derecha: true },
            { titulo: 'Pendiente', derecha: true }, { titulo: 'Costo', derecha: true }, { titulo: 'Importe', derecha: true },
          ]}>
            {orden.partidas.map((p) => (
              <tr key={p.id}>
                <Celda><p>{p.descripcion}</p><p className="font-mono text-xs text-slate-500">{p.codigo}</p></Celda>
                <Celda derecha className="tabular-nums">{cantidad(p.cantidad)}</Celda>
                <Celda derecha className="text-emerald-700 tabular-nums">{cantidad(p.cantidadRecibida)}</Celda>
                <Celda derecha className="font-medium tabular-nums">{p.pendiente ? cantidad(p.pendiente) : '—'}</Celda>
                <Celda derecha className="tabular-nums">{formatoMoneda(p.costoUnitario)}</Celda>
                <Celda derecha className="tabular-nums">{formatoMoneda(p.importe)}</Celda>
              </tr>
            ))}
          </Tabla>

          <Tarjeta titulo="Cuentas por pagar generadas">
            {orden.cuentasPorPagar.length === 0 ? <p className="text-sm text-slate-500">Se generan al recibir la mercancía.</p> : (
              <ul className="divide-y divide-slate-100 text-sm">
                {orden.cuentasPorPagar.map((c) => (
                  <li key={c.id} className="flex justify-between py-2">
                    <span><span className="font-mono">{c.folio}</span> · {formatoFecha(c.fecha)}{c.folioProveedor && ` · Factura ${c.folioProveedor}`}</span>
                    <span className="tabular-nums">{formatoMoneda(c.total)} <span className="text-slate-500">(saldo {formatoMoneda(c.saldo)})</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>

        <div className="space-y-6">
          <Tarjeta titulo="Importes"><Totales subtotal={orden.subtotal} iva={orden.iva} total={orden.total} /></Tarjeta>
          <Tarjeta titulo="Datos">
            <ListaDatos datos={[
              ['Fecha', formatoFecha(orden.fecha)],
              ['Entrega estimada', orden.fechaEntregaEstimada ? formatoFecha(orden.fechaEntregaEstimada) : '—'],
              ['Almacén', orden.almacen],
              ['Pago', `${orden.condicionPago ?? '—'} (${orden.diasCredito ? `${orden.diasCredito} días` : 'contado'})`],
              ['Notas', orden.notas ?? '—'],
            ]} />
          </Tarjeta>
        </div>
      </div>

      {accion === 'recibir' && <FormRecepcion orden={orden} onCerrar={() => setAccion(null)} />}
      {accion === 'cancelar' && (
        <FormCancelarDocumento folio={orden.folio} guardando={cancelar.isPending} error={cancelar.error} onCerrar={() => setAccion(null)}
          onConfirmar={(motivo) => cancelar.mutate({ id: orden.id, motivo }, { onSuccess: () => setAccion(null) })} />
      )}
    </>
  )
}

/** Recepción total o parcial ("Aplicar compra"). Propone recibir todo lo pendiente. */
function FormRecepcion({ orden, onCerrar }: { orden: Orden; onCerrar: () => void }) {
  const recibir = useRecibirCompra()
  const pendientes = orden.partidas.filter((p) => p.pendiente > 0)
  const [f, setF] = useState({ fecha: aIsoFecha(new Date()), folioProveedor: '' })
  const [cantidades, setCantidades] = useState<Record<number, string>>(() =>
    Object.fromEntries(pendientes.map((p) => [p.id, p.pendiente.toString()])))
  const subtotal = pendientes.reduce((s, p) => s + (Number(cantidades[p.id]) || 0) * p.costoUnitario, 0)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    recibir.mutate({
      id: orden.id,
      datos: {
        fecha: f.fecha, folioProveedor: nulo(f.folioProveedor),
        partidas: pendientes.map((p) => ({ partidaId: p.id, cantidad: Number(cantidades[p.id]) || 0 })),
      },
    }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo={`Recibir mercancía · ${orden.folio}`} onCerrar={onCerrar} ancho="max-w-2xl">
      <form onSubmit={enviar} className="space-y-4">
        <p className="text-sm text-slate-600">
          Lo recibido entra a <b>{orden.almacen}</b> y se genera una cuenta por pagar a {orden.proveedor}.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Fecha de recepción">
            <Input type="date" min={orden.fecha} max={aIsoFecha(new Date())} value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} required />
          </Campo>
          <Campo etiqueta="Folio de la factura del proveedor">
            <Input className="font-mono uppercase" value={f.folioProveedor} onChange={(e) => setF({ ...f, folioProveedor: e.target.value })} />
          </Campo>
        </div>
        <Tabla columnas={[{ titulo: 'Producto' }, { titulo: 'Pendiente', derecha: true }, { titulo: 'Recibir', derecha: true }]}>
          {pendientes.map((p) => (
            <tr key={p.id}>
              <Celda>{p.descripcion}</Celda>
              <Celda derecha className="tabular-nums">{cantidad(p.pendiente)}</Celda>
              <Celda derecha>
                <Input className="ml-auto w-28 text-right" type="number" min="0" max={p.pendiente} step="any" aria-label={`Recibir ${p.descripcion}`}
                  value={cantidades[p.id]} onChange={(e) => setCantidades({ ...cantidades, [p.id]: e.target.value })} />
              </Celda>
            </tr>
          ))}
        </Tabla>
        <div className="flex justify-end">
          <Totales subtotal={subtotal} iva={Math.round(subtotal * TASA_IVA * 100) / 100} total={subtotal + Math.round(subtotal * TASA_IVA * 100) / 100} />
        </div>
        <PieFormulario error={recibir.error} guardando={recibir.isPending} onCancelar={onCerrar} textoGuardar="Registrar recepción" />
      </form>
    </Modal>
  )
}
