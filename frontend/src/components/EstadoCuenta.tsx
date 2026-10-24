import { Link } from 'react-router'
import { useCargos } from '../api/hooks'
import { formatoFecha, formatoMoneda } from '../lib/formato'
import { InsigniaSaldo } from './Saldos'
import { Cargando, Celda, cn, Fila, Tabla, Vacio } from './ui'

/**
 * Estado de cuenta de un prospecto o cliente: sus cargos (sin cancelados) con lo pagado y el saldo
 * (antes "Estado de cuenta" en la ficha del prospecto, con "Ir a cobranza").
 */
export default function EstadoCuenta({ prospectoId, clienteId, nombre, compacto = false }: {
  prospectoId?: number
  clienteId?: number
  /** Para filtrar Cuentas por cobrar al dar clic en "Ir a cobranza". */
  nombre: string
  compacto?: boolean
}) {
  const { data, isLoading } = useCargos({ prospectoId, clienteId, estado: 'Todos' })
  if (isLoading) return <Cargando />

  const cargos = (data ?? []).filter((c) => c.estado !== 'Cancelado')
  if (cargos.length === 0) return <Vacio mensaje="Sin cargos registrados." className="py-6" />

  const total = cargos.reduce((s, c) => s + c.total, 0)
  const pagado = cargos.reduce((s, c) => s + c.pagado, 0)
  const saldo = cargos.reduce((s, c) => s + c.saldo, 0)
  const vencido = cargos.filter((c) => c.estado === 'Vencido').reduce((s, c) => s + c.saldo, 0)

  const cifra = (etiqueta: string, valor: number, clase?: string) => (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{etiqueta}</p>
      <p className={cn('font-semibold text-slate-900 tabular-nums', clase)}>{formatoMoneda(valor)}</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className={cn('grid gap-2', compacto ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4')}>
        {cifra('Cargado', total)}
        {cifra('Pagado', pagado, 'text-emerald-700')}
        {cifra('Saldo', saldo)}
        {cifra('Vencido', vencido, vencido > 0 ? 'text-rose-600' : undefined)}
      </div>

      {compacto ? (
        <ul className="divide-y divide-slate-100 text-sm">
          {cargos.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2">
              <Link to={`/cargos/${c.id}`} className="font-medium text-marca-700 hover:underline">{c.folio}</Link>
              <span className="text-slate-700 tabular-nums">{formatoMoneda(c.saldo)}</span>
              <InsigniaSaldo estado={c.estado} diasVencido={c.diasVencido} />
            </li>
          ))}
        </ul>
      ) : (
        <Tabla columnas={[{ titulo: 'Folio' }, { titulo: 'Fecha' }, { titulo: 'Vence' }, { titulo: 'Total', derecha: true },
          { titulo: 'Pagado', derecha: true }, { titulo: 'Saldo', derecha: true }, { titulo: 'Estado' }]}>
          {cargos.map((c) => (
            <Fila key={c.id}>
              <Celda><Link to={`/cargos/${c.id}`} className="font-medium text-marca-700 hover:underline">{c.folio}</Link></Celda>
              <Celda className="text-slate-600 tabular-nums">{formatoFecha(c.fecha)}</Celda>
              <Celda className="text-slate-600 tabular-nums">{formatoFecha(c.fechaVencimiento)}</Celda>
              <Celda derecha className="tabular-nums">{formatoMoneda(c.total)}</Celda>
              <Celda derecha className="text-emerald-700 tabular-nums">{formatoMoneda(c.pagado)}</Celda>
              <Celda derecha className="font-semibold tabular-nums">{formatoMoneda(c.saldo)}</Celda>
              <Celda><InsigniaSaldo estado={c.estado} diasVencido={c.diasVencido} /></Celda>
            </Fila>
          ))}
        </Tabla>
      )}

      {saldo > 0 && (
        <Link to={`/cobranza?buscar=${encodeURIComponent(nombre)}`} className="inline-block text-sm font-medium text-marca-700 hover:underline">
          Ir a cobranza →
        </Link>
      )}
    </div>
  )
}
