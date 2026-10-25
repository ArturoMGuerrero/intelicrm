import { useState, type KeyboardEvent } from 'react'
import { useRegistrarTipoCambio, useTipoCambio } from '../api/hooks'
import { aIsoFecha, formatoFecha } from '../lib/formato'
import { Boton, Campo, cn, errorDeCampo, Input, MensajeError, Tarjeta } from './ui'

const valor = (v: number) => `$${v.toFixed(4)}`

/** Tipo de cambio vigente para la barra superior (antes, en el pie de todas las pantallas). */
export function IndicadorTipoCambio() {
  const { data } = useTipoCambio()
  const actual = data?.actual
  if (!actual) return null
  const esDeHoy = actual.fecha === aIsoFecha(new Date())
  return (
    <span title={`Tipo de cambio del ${formatoFecha(actual.fecha)} · ${actual.fuente}`}
      className="hidden items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600 tabular-nums lg:inline-flex">
      <span className="font-medium text-slate-500">TC</span>
      <span className="font-semibold text-slate-800">{valor(actual.valor)}</span>
      {!esDeHoy && <span className="text-slate-500">· {formatoFecha(actual.fecha)}</span>}
    </span>
  )
}

/** Tarjeta de Mi empresa: tipo de cambio vigente, origen, últimos registrados y captura manual. */
export function TarjetaTipoCambio({ editable }: { editable: boolean }) {
  const { data, error } = useTipoCambio()
  const registrar = useRegistrarTipoCambio()
  const [f, setF] = useState({ fecha: aIsoFecha(new Date()), valor: '' })

  // Va dentro del formulario de Mi empresa: no puede ser un <form> propio (no se anidan formularios).
  const enviar = () => {
    if (!f.fecha || !(Number(f.valor) > 0)) return
    registrar.mutate({ fecha: f.fecha, valor: Number(f.valor) }, { onSuccess: () => setF({ ...f, valor: '' }) })
  }
  const conEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <Tarjeta titulo="Tipo de cambio del dólar">
      <MensajeError error={error} />
      {data?.actual ? (
        <p className="text-sm text-slate-600">
          Vigente: <b className="text-lg text-slate-900 tabular-nums">{valor(data.actual.valor)}</b> pesos por dólar, del{' '}
          {formatoFecha(data.actual.fecha)} ({data.actual.fuente}).
        </p>
      ) : (
        <p className="text-sm text-slate-600">Aún no hay tipo de cambio registrado.</p>
      )}
      <p className={cn('mt-2 rounded-lg px-3 py-2 text-xs', data?.fuenteAutomatica ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800')}>
        {data?.fuenteAutomatica
          ? 'Se actualiza solo con el tipo de cambio FIX de Banxico. Puedes capturar uno a mano si necesitas otro valor para un día.'
          : 'La consulta automática a Banxico no está configurada (falta el token). Captúralo a mano cada día que cotices en dólares.'}
      </p>

      {editable && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Campo etiqueta="Fecha">
            <Input type="date" max={aIsoFecha(new Date())} value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} onKeyDown={conEnter} />
          </Campo>
          <Campo etiqueta="Pesos por dólar" error={errorDeCampo(registrar.error, 'valor')}>
            <Input className="w-32 text-right" type="number" min="1" step="0.0001" value={f.valor}
              onChange={(e) => setF({ ...f, valor: e.target.value })} onKeyDown={conEnter} placeholder="18.6670" />
          </Campo>
          <Boton cargando={registrar.isPending} disabled={!(Number(f.valor) > 0)} onClick={enviar}>Registrar</Boton>
          <div className="basis-full"><MensajeError error={registrar.error} /></div>
        </div>
      )}

      {!!data?.recientes.length && (
        <ul className="mt-4 divide-y divide-slate-100 text-sm">
          {data.recientes.map((t) => (
            <li key={t.fecha} className="flex justify-between py-1.5">
              <span className="text-slate-600">{formatoFecha(t.fecha)}</span>
              <span className="text-xs text-slate-500">{t.fuente}</span>
              <span className="font-medium text-slate-800 tabular-nums">{valor(t.valor)}</span>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  )
}
