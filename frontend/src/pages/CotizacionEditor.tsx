import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  useAlmacenes, useCambiarEstatusCotizacion, useCargoDesdeCotizacion, useCatalogo, useClientes, useCotizacion, useEliminarCotizacion, useEmpleados,
  useEmpresa, useGuardarCotizacion, useTipoCambio, usePreciosCliente, useProductos, useProspectos,
} from '../api/hooks'
import type { Cotizacion, EstatusCotizacion, Moneda } from '../api/tipos'
import {
  Aviso, Boton, BotonEnlace, Campo, Cargando, Icono, Input, Insignia, MensajeError, Modal, nulo, PieFormulario, Select,
  Tarjeta, Textarea, useConfirmar,
} from '../components/ui'
import { EditorPartidas, partidasDesde, partidasParaApi, type PartidaForm } from '../components/EditorPartidas'
import { tonoEstatusCotizacion } from '../lib/etiquetas'
import { aIsoFecha, formatoFecha, formatoMoneda } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'

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
  const [generandoCargo, setGenerandoCargo] = useState(false)
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
    moneda: cotizacion?.moneda ?? ('MXN' as Moneda),
    tipoCambio: cotizacion?.tipoCambio?.toString() ?? '',
    atencion: cotizacion?.atencion ?? '',
  })
  const [partidas, setPartidas] = useState<PartidaForm[]>(() => partidasDesde(cotizacion?.partidas))

  // Al crear desde un prospecto sin vendedor elegido, sugerir a su responsable.
  useEffect(() => {
    if (cotizacion || f.empleadoId || !prospectoInicial) return
    const p = prospectos.data?.find((x) => x.id === prospectoInicial)
    if (p?.empleadoResponsableId) setF((actual) => ({ ...actual, empleadoId: String(p.empleadoResponsableId) }))
  }, [prospectos.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const tipoCambioVigente = useTipoCambio().data?.actual
  // Al pasar a dólares se propone el tipo de cambio vigente (si no se escribió uno).
  const elegirMoneda = (moneda: Moneda) =>
    setF((actual) => ({
      ...actual, moneda,
      tipoCambio: moneda === 'USD' && !actual.tipoCambio && tipoCambioVigente ? tipoCambioVigente.valor.toString() : actual.tipoCambio,
    }))
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })

  // Si el destinatario es (o está ligado a) un cliente con lista de precios, se usan sus precios.
  const clienteEfectivo = para === 'cliente' ? Number(f.clienteId) || undefined
    : prospectos.data?.find((p) => p.id === Number(f.prospectoId))?.clienteId ?? undefined
  const precios = usePreciosCliente(clienteEfectivo)
  // IVA: el propio del cliente (si tiene) reemplaza al de cada producto; la empresa da el de conceptos libres.
  const tasaCliente = clientes.data?.find((c) => c.id === clienteEfectivo)?.tasaIva ?? null
  const tasaEmpresa = useEmpresa().data?.tasaIvaPredeterminada

  // "A la atención de": contactos del cliente, o el propio prospecto.
  const contactosCliente = clientes.data?.find((c) => c.id === clienteEfectivo)?.contactos ?? []
  const prospectoElegido = para === 'prospecto' ? prospectos.data?.find((p) => p.id === Number(f.prospectoId)) : undefined
  const sugerenciasAtencion = [
    ...(prospectoElegido ? [prospectoElegido.nombreCompleto] : []),
    ...contactosCliente.map((c) => c.nombre),
  ]

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
          moneda: f.moneda,
          tipoCambio: f.moneda === 'USD' ? Number(f.tipoCambio) : null,
          atencion: nulo(f.atencion),
          partidas: partidasParaApi(partidas),
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
    <>
      <form onSubmit={enviar}>
        <Link to="/cotizaciones" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <Icono nombre="izquierda" className="h-4 w-4" /> Cotizaciones
        </Link>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{cotizacion?.folio ?? 'Nueva cotización'}</h1>
            {cotizacion && <Insignia tono={tonoEstatusCotizacion[cotizacion.estatus]}>{cotizacion.estatus}</Insignia>}
          </div>
          {cotizacion && (
            <div className="flex flex-wrap gap-2">
              {cotizacion.estatus === 'Aceptada' && puede('cargos.editar') && (
                <Boton variante="primario" icono="recibo" onClick={() => setGenerandoCargo(true)}>Generar cargo</Boton>
              )}
              {puedeEditar && (
                <>
                  {cotizacion.estatus === 'Borrador' && accionEstatus('Enviada', 'Marcar como enviada')}
                  {cotizacion.estatus === 'Enviada' && accionEstatus('Aceptada', 'Aceptada', 'primario')}
                  {cotizacion.estatus === 'Enviada' && accionEstatus('Rechazada', 'Rechazada', 'peligro')}
                  {!estatusEditable && accionEstatus('Borrador', 'Reabrir como borrador')}
                  {cotizacion.estatus === 'Borrador' && puede('cotizaciones.eliminar') && (
                    <Boton variante="peligro" icono="basura" disabled={eliminar.isPending} onClick={eliminarCotizacion}>Eliminar</Boton>
                  )}
                </>
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
            <Campo etiqueta="A la atención de" className="lg:col-span-2" ayuda="Persona que recibe la cotización.">
              <Input list="sugerencias-atencion" value={f.atencion} onChange={cambiar('atencion')} placeholder="Nombre del contacto" />
              <datalist id="sugerencias-atencion">{sugerenciasAtencion.map((n) => <option key={n} value={n} />)}</datalist>
            </Campo>
            <Campo etiqueta="Moneda">
              <Select value={f.moneda} onChange={(e) => elegirMoneda(e.target.value as Moneda)}>
                <option value="MXN">Pesos (MXN)</option>
                <option value="USD">Dólares (USD)</option>
              </Select>
            </Campo>
            {f.moneda === 'USD' && (
              <Campo etiqueta="Tipo de cambio *" ayuda="Pesos por dólar. Se usa al generar el cargo.">
                <Input type="number" min="0.0001" step="0.0001" value={f.tipoCambio} onChange={cambiar('tipoCambio')} required />
              </Campo>
            )}
          </Tarjeta>

          <EditorPartidas partidas={partidas} setPartidas={setPartidas} productos={productos.data} preciosEspeciales={precios.data}
            moneda={f.moneda} tipoCambio={Number(f.tipoCambio) || undefined} tasaCliente={tasaCliente} tasaEmpresa={tasaEmpresa} />

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
      {generandoCargo && cotizacion && <GenerarCargo cotizacion={cotizacion} onCerrar={() => setGenerandoCargo(false)} />}
    </>
  )
}

/** Convierte una cotización aceptada en cargo (cuenta por cobrar) eligiendo las condiciones de pago. */
function GenerarCargo({ cotizacion, onCerrar }: { cotizacion: Cotizacion; onCerrar: () => void }) {
  const navegar = useNavigate()
  const generar = useCargoDesdeCotizacion()
  const condiciones = useCatalogo('condiciones-pago').data ?? []
  const almacenes = useAlmacenes().data ?? []
  const [f, setF] = useState({ fecha: aIsoFecha(new Date()), condicionPagoId: '', diasCredito: '0', almacenId: '' })

  const elegirCondicion = (id: string) => {
    const condicion = condiciones.find((c) => c.id === Number(id))
    setF({ ...f, condicionPagoId: id, diasCredito: condicion?.diasCredito?.toString() ?? f.diasCredito })
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    generar.mutate({
      cotizacionId: cotizacion.id,
      datos: {
        fecha: f.fecha, condicionPagoId: f.condicionPagoId ? Number(f.condicionPagoId) : null, diasCredito: Number(f.diasCredito),
        almacenId: f.almacenId ? Number(f.almacenId) : null,
      },
    }, { onSuccess: (c) => navegar(`/cargos/${c.id}`) })
  }

  return (
    <Modal abierto titulo={`Generar cargo de ${cotizacion.folio}`} onCerrar={onCerrar} ancho="max-w-md">
      <form onSubmit={enviar} className="space-y-4">
        <p className="text-sm text-slate-600">
          {cotizacion.moneda === 'USD' && cotizacion.tipoCambio
            ? <>Se creará un cargo en pesos por <b>{formatoMoneda(Math.round(cotizacion.total * cotizacion.tipoCambio * 100) / 100)}</b> ({formatoMoneda(cotizacion.total, 'USD')} a {cotizacion.tipoCambio}) a {cotizacion.destinatario} con las mismas partidas.</>
            : <>Se creará un cargo por <b>{formatoMoneda(cotizacion.total)}</b> a {cotizacion.destinatario} con las mismas partidas.</>}
          El saldo aparecerá en Cuentas por cobrar.
        </p>
        <Campo etiqueta="Fecha del cargo"><Input type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} required /></Campo>
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Condición de pago">
            <Select value={f.condicionPagoId} onChange={(e) => elegirCondicion(e.target.value)}>
              <option value="">—</option>
              {condiciones.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="Días de crédito" ayuda="0 = contado.">
            <Input type="number" min="0" max="365" value={f.diasCredito} onChange={(e) => setF({ ...f, diasCredito: e.target.value })} required />
          </Campo>
        </div>
        <Campo etiqueta="Surtir del almacén" ayuda="Los productos saldrán de este almacén. Déjalo vacío si no se entrega mercancía.">
          <Select value={f.almacenId} onChange={(e) => setF({ ...f, almacenId: e.target.value })}>
            <option value="">— No mover inventario</option>
            {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.sucursal})</option>)}
          </Select>
        </Campo>
        <PieFormulario error={generar.error} guardando={generar.isPending} onCancelar={onCerrar} textoGuardar="Generar cargo" />
      </form>
    </Modal>
  )
}
