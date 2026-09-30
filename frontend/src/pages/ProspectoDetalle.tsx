import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  useAgregarBitacora, useBitacora, useCambiarEtapa, useCatalogo, useCitas, useConvertirEnCliente,
  useCotizaciones, useDesactivarProspecto, useEmpleados, useProspecto,
} from '../api/hooks'
import FormCita from '../components/FormCita'
import FormProspecto from '../components/FormProspecto'
import {
  Boton, BotonEnlace, Cargando, cn, Icono, Insignia, ListaDatos, MensajeError, Select, Tarjeta, Textarea, useConfirmar, Vacio,
} from '../components/ui'
import {
  ETAPAS, etiquetaEstatusCita, etiquetaEtapa, tonoEstatusCita, tonoEstatusCotizacion, tonoEtapa,
} from '../lib/etiquetas'
import { formatoFecha, formatoFechaHora, formatoMoneda } from '../lib/formato'
import { SiPuede, useSesion } from '../sesion/Sesion'

export default function ProspectoDetalle() {
  const id = Number(useParams().id)
  const navegar = useNavigate()
  const confirmar = useConfirmar()
  const { puede } = useSesion()
  const { data: p, isLoading, error } = useProspecto(id)
  const cambiarEtapa = useCambiarEtapa()
  const convertir = useConvertirEnCliente()
  const desactivar = useDesactivarProspecto()
  const [editando, setEditando] = useState(false)
  const [nuevaCita, setNuevaCita] = useState(false)

  if (isLoading) return <Cargando />
  if (error || !p) return <MensajeError error={error ?? new Error('Prospecto no encontrado.')} />

  const puedeEditar = puede('prospectos.editar')

  const darDeBaja = async () => {
    if (await confirmar({ titulo: 'Dar de baja prospecto', mensaje: <>¿Dar de baja a <b>{p.nombreCompleto}</b>? Su historial se conserva.</>, textoConfirmar: 'Dar de baja', peligro: true }))
      desactivar.mutate(p.id, { onSuccess: () => navegar('/prospectos') })
  }

  const convertirEnCliente = async () => {
    if (await confirmar({ titulo: 'Convertir en cliente', mensaje: 'Se creará un cliente con los datos del prospecto y se marcará como Ganado.', textoConfirmar: 'Convertir' }))
      convertir.mutate(p.id)
  }

  return (
    <>
      <Link to="/prospectos" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <Icono nombre="izquierda" className="h-4 w-4" /> Prospectos
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{p.nombreCompleto}</h1>
            <Insignia tono={tonoEtapa[p.etapa]}>{etiquetaEtapa[p.etapa]}</Insignia>
            {!p.activo && <Insignia>Inactivo</Insignia>}
          </div>
          <p className="mt-1 text-sm text-slate-500">{[p.cargo, p.empresa].filter(Boolean).join(' · ') || 'Sin empresa'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SiPuede permiso="prospectos.editar">
            <Boton icono="editar" onClick={() => setEditando(true)}>Editar</Boton>
          </SiPuede>
          <SiPuede permiso="citas.editar">
            <Boton icono="citas" onClick={() => setNuevaCita(true)}>Agendar cita</Boton>
          </SiPuede>
          <SiPuede permiso="cotizaciones.editar">
            <BotonEnlace icono="cotizaciones" to={`/cotizaciones/nueva?prospectoId=${p.id}`}>Cotizar</BotonEnlace>
          </SiPuede>
          {p.clienteId ? (
            <Insignia tono="verde" className="px-3 py-2 text-sm"><Icono nombre="check" className="mr-1 h-4 w-4" />Ya es cliente</Insignia>
          ) : puedeEditar && puede('clientes.editar') && (
            <Boton variante="primario" cargando={convertir.isPending} textoCargando="Convirtiendo…" onClick={convertirEnCliente}>
              Convertir en cliente
            </Boton>
          )}
        </div>
      </div>

      {/* Etapas: clic para mover al prospecto */}
      <Tarjeta className="mb-6 overflow-x-auto p-2">
        <ol className="flex min-w-max gap-1">
          {ETAPAS.map((e) => (
            <li key={e}>
              <button type="button" disabled={!puedeEditar || cambiarEtapa.isPending || e === p.etapa}
                onClick={() => cambiarEtapa.mutate({ id: p.id, etapa: e })}
                className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  e === p.etapa ? 'bg-marca-600 text-white' : 'text-slate-600 enabled:hover:bg-slate-100 disabled:cursor-default')}>
                {etiquetaEtapa[e]}
              </button>
            </li>
          ))}
        </ol>
      </Tarjeta>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <Tarjeta titulo="Datos">
            <ListaDatos datos={[
              ['Correo', p.correo],
              ['Teléfono', p.telefono],
              ['Origen', p.origen],
              ['Valor estimado', formatoMoneda(p.valorEstimado)],
              ['Responsable', p.empleadoResponsable],
              ['Unidad de negocio', p.unidadNegocio],
              ['Alta', formatoFecha(p.fechaCreacion)],
            ]} />
            {p.notas && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm whitespace-pre-line text-slate-600">{p.notas}</p>}
            {p.activo && (
              <SiPuede permiso="prospectos.eliminar">
                <Boton variante="peligro" icono="basura" className="mt-5 w-full" onClick={darDeBaja}>Dar de baja</Boton>
              </SiPuede>
            )}
          </Tarjeta>
          <CitasProspecto prospectoId={p.id} />
          <CotizacionesProspecto prospectoId={p.id} />
        </div>
        <div className="xl:col-span-2">
          <Bitacora prospectoId={p.id} puedeAgregar={puedeEditar} />
        </div>
      </div>

      {editando && <FormProspecto prospecto={p} onCerrar={() => setEditando(false)} />}
      {nuevaCita && <FormCita prospectoId={p.id} onCerrar={() => setNuevaCita(false)} />}
    </>
  )
}

function Bitacora({ prospectoId, puedeAgregar }: { prospectoId: number; puedeAgregar: boolean }) {
  const { usuario } = useSesion()
  const { data, isLoading } = useBitacora(prospectoId)
  const agregar = useAgregarBitacora(prospectoId)
  const empleados = useEmpleados()
  const acciones = useCatalogo('acciones-actividades')
  const [descripcion, setDescripcion] = useState('')
  const [empleadoId, setEmpleadoId] = useState(usuario?.empleadoId?.toString() ?? '')
  const [accionId, setAccionId] = useState('')

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!descripcion.trim()) return
    agregar.mutate(
      { descripcion, empleadoId: empleadoId ? Number(empleadoId) : null, accionActividadId: accionId ? Number(accionId) : null },
      { onSuccess: () => setDescripcion('') },
    )
  }

  return (
    <Tarjeta titulo="Bitácora de seguimiento">
      {puedeAgregar && (
        <form onSubmit={enviar} className="mb-6 space-y-3 rounded-lg bg-slate-50 p-4">
          <Textarea placeholder="¿Qué pasó? Ej.: Llamé para confirmar la demo, pidió precios por volumen…"
            value={descripcion} onChange={(e) => setDescripcion(e.target.value)} aria-label="Nota" />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Select className="sm:w-auto sm:min-w-44 sm:flex-1" value={accionId} onChange={(e) => setAccionId(e.target.value)} aria-label="Acción">
              <option value="">Tipo de acción…</option>
              {acciones.data?.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </Select>
            <Select className="sm:w-auto sm:min-w-44 sm:flex-1" value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)} aria-label="Empleado">
              <option value="">Empleado…</option>
              {empleados.data?.map((e) => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
            </Select>
            <Boton type="submit" variante="primario" className="sm:ml-auto" cargando={agregar.isPending} disabled={!descripcion.trim()}>
              Agregar
            </Boton>
          </div>
          <MensajeError error={agregar.error} />
        </form>
      )}

      {isLoading ? <Cargando /> : !data?.length ? <Vacio mensaje="Aún no hay registros." /> : (
        <ol className="relative space-y-5 border-l border-slate-200 pl-5">
          {data.map((b) => (
            <li key={b.id} className="relative">
              <span className="absolute top-1.5 -left-[25px] h-2.5 w-2.5 rounded-full border-2 border-white bg-marca-500" />
              <p className="text-xs text-slate-500">
                {formatoFechaHora(b.fecha)}
                {b.accionActividad && <> · <b className="font-medium text-slate-700">{b.accionActividad}</b></>}
                {b.empleado && <> · {b.empleado}</>}
              </p>
              <p className="mt-1 text-sm whitespace-pre-line text-slate-800">{b.descripcion}</p>
            </li>
          ))}
        </ol>
      )}
    </Tarjeta>
  )
}

function CitasProspecto({ prospectoId }: { prospectoId: number }) {
  const { puede } = useSesion()
  const { data } = useCitas({ prospectoId }, puede('citas.ver'))
  if (!puede('citas.ver')) return null
  return (
    <Tarjeta titulo="Citas">
      {!data?.length ? <p className="text-sm text-slate-500">Sin citas.</p> : (
        <ul className="space-y-2">
          {[...data].reverse().slice(0, 5).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-700">{formatoFechaHora(c.fechaHoraInicio)} · {c.accionActividad ?? 'Cita'}</span>
              <Insignia tono={tonoEstatusCita[c.estatus]}>{etiquetaEstatusCita[c.estatus]}</Insignia>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  )
}

function CotizacionesProspecto({ prospectoId }: { prospectoId: number }) {
  const { puede } = useSesion()
  const { data } = useCotizaciones({ prospectoId }, puede('cotizaciones.ver'))
  if (!puede('cotizaciones.ver')) return null
  return (
    <Tarjeta titulo="Cotizaciones">
      {!data?.length ? <p className="text-sm text-slate-500">Sin cotizaciones.</p> : (
        <ul className="space-y-2">
          {data.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
              <Link to={`/cotizaciones/${c.id}`} className="font-medium text-marca-600 hover:underline">{c.folio}</Link>
              <span className="text-slate-700 tabular-nums">{formatoMoneda(c.total)}</span>
              <Insignia tono={tonoEstatusCotizacion[c.estatus]}>{c.estatus}</Insignia>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  )
}
