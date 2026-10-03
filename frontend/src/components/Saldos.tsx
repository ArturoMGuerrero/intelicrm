import { useState, type FormEvent, type ReactNode } from 'react'
import { useCatalogo } from '../api/hooks'
import type { EstadoSaldo, FiltroEstadoSaldo, Pago, ResumenSaldos } from '../api/tipos'
import { etiquetaEstadoSaldo, tonoEstadoSaldo } from '../lib/etiquetas'
import { aIsoFecha, formatoFecha, formatoMoneda } from '../lib/formato'
import {
  BotonIcono, Campo, Celda, CeldaAcciones, cn, errorDeCampo, Fila, Icono, Input, Insignia, Modal, nulo, PieFormulario,
  Select, Tabla, Tarjeta, Textarea, Vacio, type NombreIcono,
} from './ui'

// Piezas compartidas por Cuentas por cobrar (cargos) y Cuentas por pagar.

export const filtrosEstadoSaldo: { valor: FiltroEstadoSaldo; texto: string }[] = [
  { valor: 'ConSaldo', texto: 'Con saldo' },
  { valor: 'Vencido', texto: 'Vencidos' },
  { valor: 'Pendiente', texto: 'Al corriente' },
  { valor: 'Liquidado', texto: 'Liquidados' },
  { valor: 'Cancelado', texto: 'Cancelados' },
  { valor: 'Todos', texto: 'Todos' },
]

export function InsigniaSaldo({ estado, diasVencido }: { estado: EstadoSaldo; diasVencido: number }) {
  return (
    <Insignia tono={tonoEstadoSaldo[estado]}>
      {etiquetaEstadoSaldo[estado]}{estado === 'Vencido' && ` · ${diasVencido} d`}
    </Insignia>
  )
}

function Indicador({ titulo, valor, detalle, icono, color }: {
  titulo: string; valor: string; detalle?: string; icono: NombreIcono; color: string
}) {
  return (
    <Tarjeta>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{titulo}</p>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', color)}>
          <Icono nombre={icono} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </Tarjeta>
  )
}

/** Indicadores y antigüedad de saldos. `tipo` cambia los textos (cobrar o pagar). */
export function ResumenDeSaldos({ resumen, tipo }: { resumen: ResumenSaldos; tipo: 'cobrar' | 'pagar' }) {
  const cobrar = tipo === 'cobrar'
  const tramos: [string, number, string][] = [
    ['Al corriente', resumen.alCorriente, 'bg-emerald-500'],
    ['1–30 días', resumen.vencido1a30, 'bg-amber-400'],
    ['31–60 días', resumen.vencido31a60, 'bg-amber-600'],
    ['61–90 días', resumen.vencido61a90, 'bg-rose-500'],
    ['Más de 90', resumen.vencidoMas90, 'bg-rose-700'],
  ]
  const total = Math.max(resumen.totalPorSaldar, 0.01)

  return (
    <div className="mb-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador titulo={cobrar ? 'Por cobrar' : 'Por pagar'} valor={formatoMoneda(resumen.totalPorSaldar)}
          detalle={`${resumen.documentosConSaldo} documentos con saldo`} icono="cobranza" color="bg-blue-50 text-blue-600" />
        <Indicador titulo="Vencido" valor={formatoMoneda(resumen.totalVencido)}
          detalle={`${resumen.documentosVencidos} documentos vencidos`} icono="alerta" color="bg-rose-50 text-rose-600" />
        <Indicador titulo="Al corriente" valor={formatoMoneda(resumen.alCorriente)}
          detalle="Aún no vencen" icono="reloj" color="bg-sky-50 text-sky-600" />
        <Indicador titulo={cobrar ? 'Cobrado este mes' : 'Pagado este mes'} valor={formatoMoneda(resumen.saldadoEsteMes)}
          detalle="Pagos aplicados en el mes" icono="tendencia" color="bg-emerald-50 text-emerald-600" />
      </div>

      <Tarjeta titulo="Antigüedad de saldos">
        {resumen.totalPorSaldar <= 0 ? <Vacio mensaje={cobrar ? 'No hay saldos por cobrar.' : 'No hay saldos por pagar.'} className="p-4" /> : (
          <>
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
              {tramos.map(([etiqueta, valor, color]) => valor > 0 && (
                <div key={etiqueta} className={color} style={{ width: `${(valor / total) * 100}%` }} title={`${etiqueta}: ${formatoMoneda(valor)}`} />
              ))}
            </div>
            <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-5">
              {tramos.map(([etiqueta, valor, color]) => (
                <li key={etiqueta} className="flex items-start gap-2">
                  <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', color)} />
                  <div>
                    <p className="text-slate-500">{etiqueta}</p>
                    <p className="font-medium text-slate-900 tabular-nums">{formatoMoneda(valor)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Tarjeta>
    </div>
  )
}

/** Captura de un pago (abono). Propone el saldo completo como monto. */
export function FormPago({ titulo, folio, saldo, fechaMinima, guardando, error, onGuardar, onCerrar }: {
  titulo: string; folio: string; saldo: number; fechaMinima: string; guardando: boolean; error: unknown
  onGuardar: (datos: unknown) => void; onCerrar: () => void
}) {
  const instrumentos = useCatalogo('instrumentos-pago').data ?? []
  const [f, setF] = useState({ fecha: aIsoFecha(new Date()), monto: saldo.toFixed(2), instrumentoPagoId: '', referencia: '', notas: '' })
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (c: string) => errorDeCampo(error, c)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    onGuardar({
      fecha: f.fecha, monto: Number(f.monto), instrumentoPagoId: f.instrumentoPagoId ? Number(f.instrumentoPagoId) : null,
      referencia: nulo(f.referencia), notas: nulo(f.notas),
    })
  }

  return (
    <Modal abierto titulo={titulo} onCerrar={onCerrar} ancho="max-w-md">
      <form onSubmit={enviar} className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-500">{folio} · saldo pendiente</span>
          <span className="font-semibold text-slate-900 tabular-nums">{formatoMoneda(saldo)}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Fecha" error={err('fecha')}>
            <Input type="date" min={fechaMinima} max={aIsoFecha(new Date())} value={f.fecha} onChange={cambiar('fecha')} required />
          </Campo>
          <Campo etiqueta="Monto *" error={err('monto')}>
            <Input className="text-right" type="number" min="0.01" max={saldo} step="0.01" value={f.monto} onChange={cambiar('monto')} required autoFocus />
          </Campo>
        </div>
        <Campo etiqueta="Instrumento de pago">
          <Select value={f.instrumentoPagoId} onChange={cambiar('instrumentoPagoId')}>
            <option value="">—</option>
            {instrumentos.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Referencia" ayuda="Número de transferencia, cheque o autorización." error={err('referencia')}>
          <Input value={f.referencia} onChange={cambiar('referencia')} />
        </Campo>
        <Campo etiqueta="Notas"><Textarea rows={2} value={f.notas} onChange={cambiar('notas')} /></Campo>
        <PieFormulario error={error} guardando={guardando} onCancelar={onCerrar} textoGuardar="Aplicar pago" />
      </form>
    </Modal>
  )
}

/** Cancelación de un documento con motivo obligatorio. */
export function FormCancelarDocumento({ folio, guardando, error, onConfirmar, onCerrar }: {
  folio: string; guardando: boolean; error: unknown; onConfirmar: (motivo: string) => void; onCerrar: () => void
}) {
  const [motivo, setMotivo] = useState('')
  return (
    <Modal abierto titulo={`Cancelar ${folio}`} onCerrar={onCerrar} ancho="max-w-md">
      <form onSubmit={(e) => { e.preventDefault(); onConfirmar(motivo) }} className="space-y-4">
        <p className="text-sm text-slate-600">El documento quedará cancelado y ya no contará en los saldos. Esta acción no se puede deshacer.</p>
        <Campo etiqueta="Motivo *" error={errorDeCampo(error, 'motivo')}>
          <Textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} required autoFocus />
        </Campo>
        <PieFormulario error={error} guardando={guardando} onCancelar={onCerrar} textoGuardar="Cancelar documento" />
      </form>
    </Modal>
  )
}

/** Historial de pagos. Los cancelados se muestran tachados. */
export function HistorialPagos({ pagos, onCancelar, acciones }: {
  pagos: Pago[]; onCancelar?: (p: Pago) => void; acciones?: ReactNode
}) {
  return (
    <Tarjeta titulo="Pagos aplicados" acciones={acciones} sinRelleno>
      {pagos.length === 0 ? <Vacio mensaje="Aún no hay pagos." className="p-6" /> : (
        <div className="px-5 pb-5">
          <Tabla columnas={[{ titulo: 'Fecha' }, { titulo: 'Instrumento' }, { titulo: 'Referencia' }, { titulo: 'Monto', derecha: true }, { titulo: '' }]}>
            {pagos.map((p) => (
              <Fila key={p.id} inactiva={p.cancelado}>
                <Celda className={cn('tabular-nums', p.cancelado && 'line-through')}>{formatoFecha(p.fecha)}</Celda>
                <Celda className="text-slate-600">{p.instrumentoPago ?? '—'}</Celda>
                <Celda className="text-slate-600">
                  {p.referencia ?? '—'}
                  {p.cancelado && <Insignia className="ml-2">Cancelado</Insignia>}
                </Celda>
                <Celda derecha className={cn('font-medium tabular-nums', p.cancelado && 'line-through')}>{formatoMoneda(p.monto)}</Celda>
                <CeldaAcciones>
                  {onCancelar && !p.cancelado && <BotonIcono icono="cerrar" etiqueta="Cancelar pago" peligro onClick={() => onCancelar(p)} />}
                </CeldaAcciones>
              </Fila>
            ))}
          </Tabla>
        </div>
      )}
    </Tarjeta>
  )
}
