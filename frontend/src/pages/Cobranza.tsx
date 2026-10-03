import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCargos, useRegistrarPagoCargo, useResumenCobranza } from '../api/hooks'
import type { CargoResumen, FiltroEstadoSaldo } from '../api/tipos'
import { filtrosEstadoSaldo, FormPago, InsigniaSaldo, ResumenDeSaldos } from '../components/Saldos'
import {
  BarraFiltros, Boton, Buscador, Cargando, Celda, CeldaAcciones, cn, Encabezado, FiltroChips, Fila, MensajeError, Tabla,
  Tarjeta, Vacio,
} from '../components/ui'
import { formatoFecha, formatoMoneda } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'

/** Cuentas por cobrar: saldos de los cargos, antigüedad y aplicación de pagos. */
export default function Cobranza() {
  const navegar = useNavigate()
  const { puede } = useSesion()
  const [buscar, setBuscar] = useState('')
  const [estado, setEstado] = useState<FiltroEstadoSaldo>('ConSaldo')
  const [pagando, setPagando] = useState<CargoResumen | null>(null)
  const resumen = useResumenCobranza()
  const { data, isLoading, error } = useCargos({ buscar, estado }, 'cobranza')
  const pagar = useRegistrarPagoCargo()
  const verDetalle = puede('cargos.ver')

  return (
    <>
      <Encabezado titulo="Cuentas por cobrar" descripcion="Saldos pendientes de clientes y prospectos, y registro de pagos." />

      {resumen.data && <ResumenDeSaldos resumen={resumen.data} tipo="cobrar" />}

      <BarraFiltros>
        <Buscador placeholder="Buscar por folio, cliente o prospecto…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
      </BarraFiltros>
      <FiltroChips opciones={filtrosEstadoSaldo} valor={estado} onCambiar={setEstado} />

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay documentos con este filtro." /></Tarjeta> : (
        <Tabla columnas={[
          { titulo: 'Folio' }, { titulo: 'Cliente / prospecto' }, { titulo: 'Vence' },
          { titulo: 'Total', derecha: true }, { titulo: 'Saldo', derecha: true }, { titulo: 'Estado' }, { titulo: '' },
        ]}>
          {data.map((c) => (
            <Fila key={c.id} inactiva={c.estado === 'Cancelado'} onClick={verDetalle ? () => navegar(`/cargos/${c.id}`) : undefined}>
              <Celda className="font-mono">{c.folio}</Celda>
              <Celda className="text-slate-700">{c.destinatario}</Celda>
              <Celda className={cn('tabular-nums', c.estado === 'Vencido' ? 'font-medium text-rose-600' : 'text-slate-600')}>
                {formatoFecha(c.fechaVencimiento)}
              </Celda>
              <Celda derecha className="tabular-nums text-slate-600">{formatoMoneda(c.total)}</Celda>
              <Celda derecha className="font-semibold tabular-nums">{formatoMoneda(c.saldo)}</Celda>
              <Celda><InsigniaSaldo estado={c.estado} diasVencido={c.diasVencido} /></Celda>
              <CeldaAcciones>
                {c.saldo > 0 && c.estado !== 'Cancelado' && puede('cobranza.editar') && (
                  <Boton tamano="sm" icono="cobranza" onClick={() => setPagando(c)}>Cobrar</Boton>
                )}
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}

      {pagando && (
        <FormPago titulo={`Registrar pago · ${pagando.destinatario}`} folio={pagando.folio} saldo={pagando.saldo}
          fechaMinima={pagando.fecha} guardando={pagar.isPending} error={pagar.error} onCerrar={() => setPagando(null)}
          onGuardar={(datos) => pagar.mutate({ id: pagando.id, datos }, { onSuccess: () => setPagando(null) })} />
      )}
    </>
  )
}
