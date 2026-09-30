import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  useCambiarEstatusCotizacion, useClientes, useCotizacion, useEliminarCotizacion, useEmpleados,
  useGuardarCotizacion, useProductos, useProspectos,
} from '../api/hooks'
import type { Cotizacion, EstatusCotizacion } from '../api/tipos'
import {
  Aviso, Boton, BotonEnlace, BotonIcono, Campo, Cargando, Celda, Icono, Input, Insignia, MensajeError, nulo, Select,
  Tabla, Tarjeta, Textarea, useConfirmar,
} from '../components/ui'
import { tonoEstatusCotizacion } from '../lib/etiquetas'
import { aIsoFecha, formatoFecha, formatoMoneda } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'

const TASA_IVA = 0.16

interface PartidaForm {
  clave: number
  productoId: string
  descripcion: string
  cantidad: string
  precioUnitario: string
  descuentoPorcentaje: string
}

let siguienteClave = 1
const partidaVacia = (): PartidaForm => ({
  clave: siguienteClave++, productoId: '', descripcion: '', cantidad: '1', precioUnitario: '', descuentoPorcentaje: '0',
})

const importe = (p: PartidaForm) =>
  Math.round((Number(p.cantidad) || 0) * (Number(p.precioUnitario) || 0) * (1 - (Number(p.descuentoPorcentaje) || 0) / 100) * 100) / 100

export default function CotizacionEditor() {
  const { id } = useParams()
  const cotizacionId = id ? Number(id) : undefined
  const { data, isLoading, error } = useCotizacion(cotizacionId)

  if (cotizacionId && isLoading) return <Cargando />
  if (cotizacionId && (error || !data)) return <MensajeError error={error ?? new Error('Cotización no encontrada.')} />
  return <Editor key={data?.id ?? 'nueva'} cotizacion={data} />
}

function Editor({ cotizacion }: { cotizacion?: Cotizacion }) {
  const navegar = useNavigate()
  const confirmar = useConfirmar()
  const { usuario, puede } = useSesion()
  const [params] = useSearchParams()
  const guardar = useGuardarCotizacion()
  const cambiarEstatus = useCambiarEstatusCotizacion()
  const eliminar = useEliminarCotizacion()
  const prospectos = useProspectos()
  const clientes = useClientes()
  const empleados = useEmpleados()
  const productos = useProductos()

  const puedeEditar = puede('cotizaciones.editar')
  const estatusEditable = !cotizacion || cotizacion.estatus === 'Borrador' || cotizacion.estatus === 'Enviada'
  const editable = puedeEditar && estatusEditable
  const prospectoInicial = cotizacion?.prospectoId ?? (params.get('prospectoId') ? Number(params.get('prospectoId')) : null)

  const [para, setPara] = useState<'prospecto' | 'cliente'>(cotizacion?.clienteId && !cotizacion.prospectoId ? 'cliente' : 'prospecto')
  const [f, setF] = useState({
    prospectoId: prospectoInicial?.toString() ?? '',
    clienteId: cotizacion?.clienteId?.toString() ?? '',
    empleadoId: cotizacion?.empleadoId?.toString() ?? usuario?.empleadoId?.toString() ?? '',
    fecha: cotizacion?.fecha ?? aIsoFecha(new Date()),
    vigenciaDias: cotizacion?.vigenciaDias.toString() ?? '15',
    notas: cotizacion?.notas ?? '',
  })
  const [partidas, setPartidas] = useState<PartidaForm[]>(() =>
    cotizacion?.partidas.length
      ? cotizacion.partidas.map((p) => ({
          clave: siguienteClave++,
          productoId: p.productoId?.toString() ?? '',
          descripcion: p.descripcion,
          cantidad: p.cantidad.toString(),
          precioUnitario: p.precioUnitario.toString(),
          descuentoPorcentaje: p.descuentoPorcentaje.toString(),
        }))
      : [partidaVacia()])

  // Al crear desde un prospecto sin vendedor elegido, sugerir a su responsable.
  useEffect(() => {
    if (cotizacion || f.empleadoId || !prospectoInicial) return
    const p = prospectos.data?.find((x) => x.id === prospectoInicial)
    if (p?.empleadoResponsableId) setF((actual) => ({ ...actual, empleadoId: String(p.empleadoResponsableId) }))
  }, [prospectos.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })

  const cambiarPartida = (clave: number, cambios: Partial<PartidaForm>) =>
    setPartidas((ps) => ps.map((p) => (p.clave === clave ? { ...p, ...cambios } : p)))

  const elegirProducto = (clave: number, productoId: string) => {
    const producto = productos.data?.find((x) => x.id === Number(productoId))
    cambiarPartida(clave, producto
      ? { productoId, descripcion: producto.nombre, precioUnitario: producto.precio.toString() }
      : { productoId })
  }

  const subtotal = partidas.reduce((s, p) => s + importe(p), 0)
  const iva = Math.round(subtotal * TASA_IVA * 100) / 100

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate(
      {
        id: cotizacion?.id,
        datos: {
          prospectoId: para === 'prospecto' && f.prospectoId ? Number(f.prospectoId) : null,
          clienteId: para === 'cliente' && f.clienteId ? Number(f.clienteId) : null,
          empleadoId: f.empleadoId ? Number(f.empleadoId) : null,
          fecha: f.fecha,
          vigenciaDias: Number(f.vigenciaDias),
          notas: nulo(f.notas),
          partidas: partidas
            .filter((p) => p.productoId || p.descripcion.trim())
            .map((p) => ({
              productoId: p.productoId ? Number(p.productoId) : null,
              descripcion: nulo(p.descripcion),
              cantidad: Number(p.cantidad),
              precioUnitario: p.precioUnitario === '' ? null : Number(p.precioUnitario),
              descuentoPorcentaje: Number(p.descuentoPorcentaje) || 0,
            })),
        },
      },
      { onSuccess: (c) => navegar(`/cotizaciones/${c.id}`, { replace: true }) },
    )
  }

  const eliminarCotizacion = async () => {
    if (cotizacion && await confirmar({ titulo: 'Eliminar cotización', mensaje: <>¿Eliminar la cotización <b>{cotizacion.folio}</b>? No se puede deshacer.</>, textoConfirmar: 'Eliminar', peligro: true }))
      eliminar.mutate(cotizacion.id, { onSuccess: () => navegar('/cotizaciones') })
  }

  const accionEstatus = (estatus: EstatusCotizacion, texto: string, variante: 'primario' | 'secundario' | 'peligro' = 'secundario') => (
    <Boton variante={variante} disabled={cambiarEstatus.isPending}
      onClick={() => cotizacion && cambiarEstatus.mutate({ id: cotizacion.id, estatus })}>
      {texto}
    </Boton>
  )

  return (
    <form onSubmit={enviar}>
      <Link to="/cotizaciones" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <Icono nombre="izquierda" className="h-4 w-4" /> Cotizaciones
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{cotizacion?.folio ?? 'Nueva cotización'}</h1>
          {cotizacion && <Insignia tono={tonoEstatusCotizacion[cotizacion.estatus]}>{cotizacion.estatus}</Insignia>}
        </div>
        {cotizacion && puedeEditar && (
          <div className="flex flex-wrap gap-2">
            {cotizacion.estatus === 'Borrador' && accionEstatus('Enviada', 'Marcar como enviada')}
            {cotizacion.estatus === 'Enviada' && accionEstatus('Aceptada', 'Aceptada', 'primario')}
            {cotizacion.estatus === 'Enviada' && accionEstatus('Rechazada', 'Rechazada', 'peligro')}
            {!estatusEditable && accionEstatus('Borrador', 'Reabrir como borrador')}
            {cotizacion.estatus === 'Borrador' && puede('cotizaciones.eliminar') && (
              <Boton variante="peligro" icono="basura" disabled={eliminar.isPending} onClick={eliminarCotizacion}>Eliminar</Boton>
            )}
          </div>
        )}
      </div>
      {cotizacion && !estatusEditable && (
        <div className="mb-4">
          <Aviso>Esta cotización está {cotizacion.estatus.toLowerCase()} y no se puede modificar.{puedeEditar && ' Reábrela como borrador para editarla.'}</Aviso>
        </div>
      )}

      <fieldset disabled={!editable} className="space-y-6">
        <Tarjeta className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Para" className="lg:col-span-2">
            <div className="flex gap-2">
              <Select className="w-32" value={para} onChange={(e) => setPara(e.target.value as 'prospecto' | 'cliente')} aria-label="Tipo de destinatario">
                <option value="prospecto">Prospecto</option>
                <option value="cliente">Cliente</option>
              </Select>
              {para === 'prospecto' ? (
                <Select value={f.prospectoId} onChange={cambiar('prospectoId')} required aria-label="Prospecto">
                  <option value="">Selecciona…</option>
                  {prospectos.data?.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombreCompleto}{p.empresa ? ` — ${p.empresa}` : ''}</option>
                  ))}
                </Select>
              ) : (
                <Select value={f.clienteId} onChange={cambiar('clienteId')} required aria-label="Cliente">
                  <option value="">Selecciona…</option>
                  {clientes.data?.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
                </Select>
              )}
            </div>
          </Campo>
          <Campo etiqueta="Vendedor">
            <Select value={f.empleadoId} onChange={cambiar('empleadoId')}>
              <option value="">—</option>
              {empleados.data?.map((e) => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
            </Select>
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Fecha"><Input type="date" value={f.fecha} onChange={cambiar('fecha')} required /></Campo>
            <Campo etiqueta="Vigencia (días)">
              <Input type="number" min="1" max="365" value={f.vigenciaDias} onChange={cambiar('vigenciaDias')} required />
            </Campo>
          </div>
        </Tarjeta>

        <div>
          <Tabla className="min-w-[760px]" columnas={[
            { titulo: 'Producto / servicio', className: 'w-56' }, { titulo: 'Descripción' },
            { titulo: 'Cantidad', derecha: true, className: 'w-24' }, { titulo: 'Precio unit.', derecha: true, className: 'w-32' },
            { titulo: 'Desc. %', derecha: true, className: 'w-24' }, { titulo: 'Importe', derecha: true, className: 'w-32' },
            { titulo: <span className="sr-only">Quitar</span>, className: 'w-10' },
          ]}>
            {partidas.map((p) => (
              <tr key={p.clave}>
                <Celda>
                  <Select value={p.productoId} onChange={(e) => elegirProducto(p.clave, e.target.value)} aria-label="Producto">
                    <option value="">Libre…</option>
                    {productos.data?.map((x) => <option key={x.id} value={x.id}>{x.codigo} · {x.nombre}</option>)}
                  </Select>
                </Celda>
                <Celda>
                  <Input value={p.descripcion} aria-label="Descripción" onChange={(e) => cambiarPartida(p.clave, { descripcion: e.target.value })} />
                </Celda>
                <Celda>
                  <Input className="text-right" type="number" min="0.01" step="0.01" value={p.cantidad} aria-label="Cantidad"
                    onChange={(e) => cambiarPartida(p.clave, { cantidad: e.target.value })} />
                </Celda>
                <Celda>
                  <Input className="text-right" type="number" min="0" step="0.01" value={p.precioUnitario} aria-label="Precio unitario"
                    onChange={(e) => cambiarPartida(p.clave, { precioUnitario: e.target.value })} />
                </Celda>
                <Celda>
                  <Input className="text-right" type="number" min="0" max="100" step="0.5" value={p.descuentoPorcentaje} aria-label="Descuento"
                    onChange={(e) => cambiarPartida(p.clave, { descuentoPorcentaje: e.target.value })} />
                </Celda>
                <Celda derecha className="font-medium tabular-nums">{formatoMoneda(importe(p))}</Celda>
                <Celda>
                  <BotonIcono icono="basura" etiqueta="Quitar partida" peligro disabled={partidas.length === 1}
                    onClick={() => setPartidas((ps) => ps.filter((x) => x.clave !== p.clave))} />
                </Celda>
              </tr>
            ))}
          </Tabla>
          <Tarjeta className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <Boton icono="mas" className="self-start" onClick={() => setPartidas((ps) => [...ps, partidaVacia()])}>Agregar partida</Boton>
            <dl className="w-full space-y-1.5 text-sm sm:w-64">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="tabular-nums">{formatoMoneda(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">IVA 16%</dt><dd className="tabular-nums">{formatoMoneda(iva)}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-semibold">
                <dt>Total</dt><dd className="tabular-nums">{formatoMoneda(subtotal + iva)}</dd>
              </div>
            </dl>
          </Tarjeta>
        </div>

        <Tarjeta>
          <Campo etiqueta="Notas y condiciones">
            <Textarea value={f.notas} onChange={cambiar('notas')} placeholder="Condiciones de pago, tiempos de entrega…" />
          </Campo>
          {cotizacion && <p className="mt-3 text-xs text-slate-500">Vence el {formatoFecha(cotizacion.fechaVencimiento)}.</p>}
        </Tarjeta>
      </fieldset>

      {editable && (
        <div className="mt-6 space-y-3">
          <MensajeError error={guardar.error} />
          <div className="flex justify-end gap-2">
            <BotonEnlace to="/cotizaciones">Cancelar</BotonEnlace>
            <Boton type="submit" variante="primario" cargando={guardar.isPending}>
              {cotizacion ? 'Guardar cambios' : 'Crear cotización'}
            </Boton>
          </div>
        </div>
      )}
    </form>
  )
}
