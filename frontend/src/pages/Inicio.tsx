import { Link } from 'react-router'
import { useDashboard } from '../api/hooks'
import type { EtapaProspecto } from '../api/tipos'
import { Cargando, cn, Encabezado, Icono, Insignia, MensajeError, Tarjeta, Vacio, type NombreIcono } from '../components/ui'
import { etiquetaEstatusCita, etiquetaEtapa, tonoEstatusCita } from '../lib/etiquetas'
import { formatoDiaLargo, formatoFechaHora, formatoHora, formatoMoneda } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'

/** Indicador del tablero: tarjeta con degradado de color, ícono y cifra grande. */
function Indicador({ titulo, valor, detalle, icono, fondo }: {
  titulo: string; valor: string | number; detalle?: string; icono: NombreIcono; fondo: string
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg', fondo)}>
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/15" />
      <div className="absolute -right-2 -bottom-10 h-20 w-20 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-white/85">{titulo}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/25">
          <Icono nombre={icono} className="h-5 w-5" />
        </span>
      </div>
      <p className="relative mt-2 text-3xl font-bold tracking-tight tabular-nums">{valor}</p>
      {detalle && <p className="relative mt-1 text-xs text-white/80">{detalle}</p>}
    </div>
  )
}

/** Color de la barra de cada etapa del embudo. */
const barraEtapa: Partial<Record<EtapaProspecto, string>> = {
  Nuevo: 'from-slate-400 to-slate-500',
  Contactado: 'from-sky-400 to-blue-500',
  Calificado: 'from-indigo-400 to-indigo-600',
  Propuesta: 'from-violet-400 to-purple-600',
  Negociacion: 'from-amber-400 to-orange-500',
}

const enlace = 'rounded-full bg-marca-50 px-3 py-1 text-xs font-semibold text-marca-700 transition-colors hover:bg-marca-100'

export default function Inicio() {
  const { usuario, puede } = useSesion()
  const { data, isLoading, error } = useDashboard()

  if (isLoading) return <Cargando />
  if (error || !data) return <MensajeError error={error} />

  // El embudo solo muestra etapas abiertas; ganados/perdidos se resumen aparte.
  const abiertas = data.embudo.filter((e) => e.etapa !== 'Ganado' && e.etapa !== 'Perdido')
  const maximo = Math.max(1, ...abiertas.map((e) => e.cantidad))
  const ganados = data.embudo.find((e) => e.etapa === 'Ganado')
  const perdidos = data.embudo.find((e) => e.etapa === 'Perdido')
  const primerNombre = usuario?.nombre.split(' ')[0]

  return (
    <>
      <Encabezado titulo={`Hola, ${primerNombre}`}
        descripcion={<span className="first-letter:uppercase">{formatoDiaLargo(new Date())}</span>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador titulo="Prospectos en seguimiento" valor={data.prospectosActivos} detalle={`${data.clientesActivos} clientes activos`}
          icono="prospectos" fondo="from-fuchsia-500 to-pink-600 shadow-fuchsia-500/30" />
        <Indicador titulo="Citas de hoy" valor={data.citasHoy} detalle="Agenda del equipo"
          icono="citas" fondo="from-sky-400 to-blue-600 shadow-sky-500/30" />
        <Indicador titulo="Cotizaciones abiertas" valor={data.cotizacionesAbiertas}
          detalle={`${formatoMoneda(data.montoCotizacionesAbiertas)} en juego`}
          icono="cotizaciones" fondo="from-amber-400 to-orange-500 shadow-amber-500/30" />
        <Indicador titulo="Ganado este mes" valor={formatoMoneda(data.montoGanadoMes)} detalle="Cotizaciones aceptadas"
          icono="tendencia" fondo="from-emerald-400 to-teal-600 shadow-emerald-500/30" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Tarjeta className="lg:col-span-3" titulo="Embudo de ventas"
          acciones={puede('prospectos.ver') && <Link to="/prospectos" className={enlace}>Ver prospectos</Link>}>
          <ul className="space-y-3">
            {abiertas.map((e) => (
              <li key={e.etapa}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{etiquetaEtapa[e.etapa]}</span>
                  <span className="text-slate-500 tabular-nums">{e.cantidad} · {formatoMoneda(e.valorEstimado)}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className={cn('h-full rounded-full bg-gradient-to-r transition-all', barraEtapa[e.etapa])}
                    style={{ width: `${e.cantidad === 0 ? 0 : Math.max(4, (e.cantidad / maximo) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4 text-sm">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">Ganados: <b className="tabular-nums">{ganados?.cantidad ?? 0}</b></span>
            <span className="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-700">Perdidos: <b className="tabular-nums">{perdidos?.cantidad ?? 0}</b></span>
          </div>
        </Tarjeta>

        <Tarjeta className="lg:col-span-2" titulo="Próximas citas"
          acciones={puede('citas.ver') && <Link to="/citas" className={enlace}>Ver agenda</Link>}>
          {data.proximasCitas.length === 0 ? (
            <Vacio mensaje="No hay citas pendientes en los próximos 7 días." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.proximasCitas.map((c) => (
                <li key={c.id} className="flex gap-3 py-3">
                  <span className="mt-1 h-10 w-1 shrink-0 rounded-full" style={{ background: c.colorEmpleado }} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/prospectos/${c.prospectoId}`} className="block truncate font-medium text-slate-900 hover:underline">
                      {c.prospecto}
                    </Link>
                    <p className="truncate text-xs text-slate-500">{c.accionActividad ?? 'Cita'} · {c.empleado}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700 tabular-nums">
                      {new Date(c.fechaHoraInicio).toDateString() === new Date().toDateString()
                        ? formatoHora(c.fechaHoraInicio) : formatoFechaHora(c.fechaHoraInicio)}
                    </p>
                    <Insignia tono={tonoEstatusCita[c.estatus]}>{etiquetaEstatusCita[c.estatus]}</Insignia>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </>
  )
}
