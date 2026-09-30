import { useState } from 'react'
import { Link } from 'react-router'
import { useCambiarEstatusCita, useCitas, useEliminarCita, useEmpleados } from '../api/hooks'
import type { Cita, EstatusCita } from '../api/tipos'
import FormCita from '../components/FormCita'
import {
  BarraFiltros, Boton, BotonIcono, Cargando, cn, Encabezado, Icono, Input, MensajeError, Select, Tarjeta, tonos,
  useConfirmar, Vacio,
} from '../components/ui'
import { ESTATUS_CITA, etiquetaEstatusCita, tonoEstatusCita } from '../lib/etiquetas'
import { aIsoFecha, formatoDiaLargo, formatoHora, sumarDias } from '../lib/formato'
import { SiPuede, useSesion } from '../sesion/Sesion'

export default function Citas() {
  const { puede } = useSesion()
  const confirmar = useConfirmar()
  const [dia, setDia] = useState(() => new Date())
  const [empleadoId, setEmpleadoId] = useState<number | ''>('')
  const [editando, setEditando] = useState<Cita | 'nueva' | null>(null)

  const empleados = useEmpleados()
  const fecha = aIsoFecha(dia)
  const { data, isLoading, error } = useCitas({ desde: fecha, hasta: fecha, empleadoId })
  const cambiarEstatus = useCambiarEstatusCita()
  const eliminar = useEliminarCita()
  const esHoy = fecha === aIsoFecha(new Date())

  const eliminarCita = async (c: Cita) => {
    if (await confirmar({ titulo: 'Eliminar cita', mensaje: <>¿Eliminar la cita de <b>{c.prospecto}</b> a las {formatoHora(c.fechaHoraInicio)}?</>, textoConfirmar: 'Eliminar', peligro: true }))
      eliminar.mutate(c.id)
  }

  return (
    <>
      <Encabezado
        titulo="Citas"
        descripcion="Agenda diaria de reuniones, llamadas y visitas."
        acciones={
          <SiPuede permiso="citas.editar">
            <Boton variante="primario" icono="mas" onClick={() => setEditando('nueva')}>Nueva cita</Boton>
          </SiPuede>
        }
      />

      <BarraFiltros>
        <div className="flex items-center gap-1">
          <BotonIcono icono="izquierda" etiqueta="Día anterior" onClick={() => setDia(sumarDias(dia, -1))} className="border border-slate-300 bg-white p-2" />
          <Input type="date" className="w-auto" value={fecha} aria-label="Fecha"
            onChange={(e) => e.target.value && setDia(new Date(`${e.target.value}T00:00:00`))} />
          <BotonIcono icono="derecha" etiqueta="Día siguiente" onClick={() => setDia(sumarDias(dia, 1))} className="border border-slate-300 bg-white p-2" />
          {!esHoy && <Boton variante="fantasma" onClick={() => setDia(new Date())}>Hoy</Boton>}
        </div>
        <Select className="md:ml-auto md:w-56" value={empleadoId} aria-label="Empleado"
          onChange={(e) => setEmpleadoId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Todos los empleados</option>
          {empleados.data?.map((e) => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
        </Select>
      </BarraFiltros>

      <h2 className="mb-3 text-sm font-medium text-slate-500 first-letter:uppercase">{formatoDiaLargo(dia)}</h2>
      <MensajeError error={error} />

      {isLoading ? <Cargando /> : !data?.length ? (
        <Tarjeta><Vacio mensaje="No hay citas este día." /></Tarjeta>
      ) : (
        <ul className="space-y-3">
          {data.map((c) => {
            const inactiva = c.estatus === 'Cancelada' || c.estatus === 'NoAsistio'
            return (
              <li key={c.id} className={cn('flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center', inactiva && 'opacity-60')}>
                <div className="flex items-center gap-3 sm:w-36">
                  <span className="h-10 w-1 rounded-full" style={{ background: c.colorEmpleado }} />
                  <div className="tabular-nums">
                    <p className="font-semibold text-slate-900">{formatoHora(c.fechaHoraInicio)}</p>
                    <p className="text-xs text-slate-500">{formatoHora(c.fechaHoraFin)} · {c.duracionMinutos} min</p>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/prospectos/${c.prospectoId}`} className={cn('font-medium text-slate-900 hover:underline', inactiva && 'line-through')}>
                    {c.prospecto}
                  </Link>
                  {c.empresa && <span className="text-sm text-slate-500"> · {c.empresa}</span>}
                  <p className="text-sm text-slate-600">{c.accionActividad ?? 'Cita'} con {c.empleado}</p>
                  {c.notas && <p className="mt-1 text-xs text-slate-500">{c.notas}</p>}
                </div>
                <div className="flex items-center gap-1">
                  {puede('citas.editar') ? (
                    <div className="relative">
                      <select aria-label="Estatus" value={c.estatus} disabled={cambiarEstatus.isPending}
                        onChange={(e) => cambiarEstatus.mutate({ id: c.id, estatus: e.target.value as EstatusCita })}
                        className={cn('cursor-pointer appearance-none rounded-full border-0 py-1 pr-7 pl-3 text-xs font-medium', tonos[tonoEstatusCita[c.estatus]])}>
                        {ESTATUS_CITA.map((s) => <option key={s} value={s}>{etiquetaEstatusCita[s]}</option>)}
                      </select>
                      <Icono nombre="abajo" className="pointer-events-none absolute top-1.5 right-2 h-3 w-3" />
                    </div>
                  ) : (
                    <span className={cn('rounded-full px-3 py-1 text-xs font-medium', tonos[tonoEstatusCita[c.estatus]])}>{etiquetaEstatusCita[c.estatus]}</span>
                  )}
                  <SiPuede permiso="citas.editar">
                    <BotonIcono icono="editar" etiqueta="Editar cita" onClick={() => setEditando(c)} />
                  </SiPuede>
                  <SiPuede permiso="citas.eliminar">
                    <BotonIcono icono="basura" etiqueta="Eliminar cita" peligro onClick={() => eliminarCita(c)} />
                  </SiPuede>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editando && <FormCita cita={editando === 'nueva' ? undefined : editando} fecha={dia} onCerrar={() => setEditando(null)} />}
    </>
  )
}
