import { Link } from 'react-router'
import { useDashboard } from '../api/hooks'
import { Cargando, Encabezado, Insignia, MensajeError, Tarjeta, Vacio } from '../components/ui'
import { etiquetaEstatusCita, etiquetaEtapa, tonoEstatusCita } from '../lib/etiquetas'
import { formatoDiaLargo, formatoFechaHora, formatoHora, formatoMoneda } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'

function Indicador({ titulo, valor, detalle }: { titulo: string; valor: string | number; detalle?: string }) {
  return (
    <Tarjeta>
      <p className="text-sm font-medium text-slate-500">{titulo}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </Tarjeta>
  )
}

const enlace = 'text-sm font-medium text-marca-600 hover:underline'

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
        <Indicador titulo="Prospectos en seguimiento" valor={data.prospectosActivos} detalle={`${data.clientesActivos} clientes activos`} />
        <Indicador titulo="Citas de hoy" valor={data.citasHoy} />
        <Indicador titulo="Cotizaciones abiertas" valor={data.cotizacionesAbiertas}
          detalle={`${formatoMoneda(data.montoCotizacionesAbiertas)} en juego`} />
        <Indicador titulo="Ganado este mes" valor={formatoMoneda(data.montoGanadoMes)} detalle="Cotizaciones aceptadas" />
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
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full bg-marca-500" style={{ width: `${(e.cantidad / maximo) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-6 border-t border-slate-100 pt-4 text-sm">
            <span className="text-emerald-700">Ganados: <b className="tabular-nums">{ganados?.cantidad ?? 0}</b></span>
            <span className="text-rose-700">Perdidos: <b className="tabular-nums">{perdidos?.cantidad ?? 0}</b></span>
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
