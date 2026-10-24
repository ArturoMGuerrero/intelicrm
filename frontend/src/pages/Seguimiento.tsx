import { useState } from 'react'
import { Link } from 'react-router'
import { useAtenderAviso, useAvisosSeguimiento, useBitacoraDelDia, useEmpleados, useSinSeguimiento } from '../api/hooks'
import type { BitacoraEntrada } from '../api/tipos'
import {
  BarraFiltros, Cargando, Celda, cn, Encabezado, Fila, Input, Insignia, MensajeError, Segmentos, Select, Tabla, Tarjeta, Vacio,
} from '../components/ui'
import { etiquetaEtapa, tonoEtapa } from '../lib/etiquetas'
import { aIsoFecha, formatoFecha, formatoFechaHora, formatoHora } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'

type Vista = 'avisos' | 'dia' | 'sin'

/**
 * Seguimiento de prospectos: avisos de la bitácora, bitácora del día y prospectos sin seguimiento
 * (antes "Bitácora del día", "Prospectos sin bitácora" y "Registro de aviso").
 */
export default function Seguimiento() {
  const { usuario } = useSesion()
  const empleados = useEmpleados()
  const [vista, setVista] = useState<Vista>('avisos')
  // Por omisión, lo del empleado vinculado al usuario.
  const [empleadoId, setEmpleadoId] = useState<number | ''>(usuario?.empleadoId ?? '')

  return (
    <>
      <Encabezado titulo="Seguimiento" descripcion="A quién hay que llamar hoy, qué se hizo y quién se está quedando sin atención." />
      <BarraFiltros>
        <Segmentos etiqueta="Vista" valor={vista} onCambiar={setVista} opciones={[
          { valor: 'avisos', texto: 'Avisos pendientes' },
          { valor: 'dia', texto: 'Bitácora del día' },
          { valor: 'sin', texto: 'Sin seguimiento' },
        ]} />
        <Select className="sm:ml-auto sm:w-64" value={empleadoId} aria-label="Empleado"
          onChange={(e) => setEmpleadoId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Todo el equipo</option>
          {empleados.data?.map((e) => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
        </Select>
      </BarraFiltros>

      {vista === 'avisos' && <Avisos empleadoId={empleadoId} />}
      {vista === 'dia' && <DelDia empleadoId={empleadoId} />}
      {vista === 'sin' && <SinSeguimiento empleadoId={empleadoId} />}
    </>
  )
}

function Avisos({ empleadoId }: { empleadoId: number | '' }) {
  const { puede } = useSesion()
  const { data, isLoading, error } = useAvisosSeguimiento(empleadoId)
  const atender = useAtenderAviso()
  if (isLoading) return <Cargando />

  const finDeHoy = new Date()
  finDeHoy.setHours(23, 59, 59, 999)
  const avisos = data ?? []
  const grupos: [string, BitacoraEntrada[], string][] = [
    ['Atrasados', avisos.filter((a) => new Date(a.fechaAviso!) < new Date(new Date().setHours(0, 0, 0, 0))), 'rojo'],
    ['Hoy', avisos.filter((a) => { const f = new Date(a.fechaAviso!); return f >= new Date(new Date().setHours(0, 0, 0, 0)) && f <= finDeHoy }), 'ambar'],
    ['Próximos', avisos.filter((a) => new Date(a.fechaAviso!) > finDeHoy), 'azul'],
  ]

  return (
    <>
      <MensajeError error={error} />
      {avisos.length === 0 ? <Tarjeta><Vacio mensaje="No hay avisos pendientes. Agrégalos desde la bitácora de cada prospecto." /></Tarjeta> : (
        <div className="space-y-6">
          {grupos.filter(([, lista]) => lista.length > 0).map(([titulo, lista, tono]) => (
            <Tarjeta key={titulo} titulo={<span className="flex items-center gap-2">{titulo} <Insignia tono={tono as 'rojo'}>{lista.length}</Insignia></span>}>
              <ul className="divide-y divide-slate-100">
                {lista.map((a) => (
                  <li key={a.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
                    <div className="w-36 shrink-0 text-sm font-medium text-slate-700 tabular-nums">{formatoFechaHora(a.fechaAviso!)}</div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/prospectos/${a.prospectoId}`} className="font-medium text-slate-900 hover:underline">{a.prospecto}</Link>
                      <p className="text-sm whitespace-pre-line text-slate-600">{a.descripcion}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Anotado el {formatoFecha(a.fecha)}{a.empleado && <> por {a.empleado}</>}{a.accionActividad && <> · {a.accionActividad}</>}
                      </p>
                    </div>
                    {puede('prospectos.editar') && (
                      <button type="button" disabled={atender.isPending} onClick={() => atender.mutate(a.id)}
                        className="shrink-0 text-sm font-medium text-marca-700 hover:underline">Marcar como atendido</button>
                    )}
                  </li>
                ))}
              </ul>
            </Tarjeta>
          ))}
        </div>
      )}
    </>
  )
}

function DelDia({ empleadoId }: { empleadoId: number | '' }) {
  const [fecha, setFecha] = useState(aIsoFecha(new Date()))
  const { data, isLoading, error } = useBitacoraDelDia(fecha, empleadoId)
  return (
    <>
      <div className="mb-4 w-48"><Input type="date" value={fecha} max={aIsoFecha(new Date())} onChange={(e) => setFecha(e.target.value)} aria-label="Fecha" /></div>
      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay registros de bitácora en este día." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Hora' }, { titulo: 'Prospecto' }, { titulo: 'Acción' }, { titulo: 'Nota' }, { titulo: 'Empleado' }]}>
          {data.map((b) => (
            <Fila key={b.id}>
              <Celda className="text-slate-600 tabular-nums">{formatoHora(b.fecha)}</Celda>
              <Celda><Link to={`/prospectos/${b.prospectoId}`} className="font-medium text-slate-900 hover:underline">{b.prospecto}</Link></Celda>
              <Celda className="text-slate-600">{b.accionActividad ?? '—'}</Celda>
              <Celda className="max-w-md text-slate-700"><p className="line-clamp-2">{b.descripcion}</p></Celda>
              <Celda className="text-slate-600">{b.empleado ?? '—'}</Celda>
            </Fila>
          ))}
        </Tabla>
      )}
    </>
  )
}

function SinSeguimiento({ empleadoId }: { empleadoId: number | '' }) {
  const [dias, setDias] = useState(7)
  const { data, isLoading, error } = useSinSeguimiento(dias, empleadoId)
  return (
    <>
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
        Sin bitácora en los últimos
        <Select className="w-24" value={dias} onChange={(e) => setDias(Number(e.target.value))} aria-label="Días">
          {[3, 7, 15, 30, 60].map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
        días
      </div>
      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="Todos los prospectos en seguimiento tienen actividad reciente." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Prospecto' }, { titulo: 'Etapa' }, { titulo: 'Responsable' }, { titulo: 'Último registro' }, { titulo: 'Días', derecha: true }]}>
          {data.map((p) => (
            <Fila key={p.id}>
              <Celda>
                <Link to={`/prospectos/${p.id}`} className="font-medium text-slate-900 hover:underline">{p.nombre}</Link>
                {p.empresa && <p className="text-xs text-slate-500">{p.empresa}</p>}
              </Celda>
              <Celda><Insignia tono={tonoEtapa[p.etapa]}>{etiquetaEtapa[p.etapa]}</Insignia></Celda>
              <Celda className="text-slate-600">{p.empleadoResponsable ?? 'Sin asignar'}</Celda>
              <Celda className="text-slate-600">{p.ultimaBitacora ? formatoFecha(p.ultimaBitacora) : 'Nunca'}</Celda>
              <Celda derecha className={cn('font-semibold tabular-nums', p.diasSinSeguimiento > 30 ? 'text-rose-600' : 'text-amber-700')}>
                {p.diasSinSeguimiento}
              </Celda>
            </Fila>
          ))}
        </Tabla>
      )}
    </>
  )
}
