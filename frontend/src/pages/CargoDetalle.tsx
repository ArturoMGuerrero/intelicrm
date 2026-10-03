import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useCancelarCargo, useCancelarPagoCargo, useCargo, useRegistrarPagoCargo } from '../api/hooks'
import type { Pago } from '../api/tipos'
import { Totales } from '../components/EditorPartidas'
import { FormCancelarDocumento, FormPago, HistorialPagos, InsigniaSaldo } from '../components/Saldos'
import {
  Aviso, Boton, Cargando, Celda, Encabezado, Icono, ListaDatos, MensajeError, Tabla, Tarjeta, useConfirmar,
} from '../components/ui'
import { formatoFecha, formatoMoneda } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'

export default function CargoDetalle() {
  const id = Number(useParams().id)
  const { puede } = useSesion()
  const confirmar = useConfirmar()
  const { data: cargo, isLoading, error } = useCargo(id)
  const pagar = useRegistrarPagoCargo()
  const cancelar = useCancelarCargo()
  const cancelarPago = useCancelarPagoCargo()
  const [pagando, setPagando] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  if (isLoading) return <Cargando />
  if (error || !cargo) return <MensajeError error={error ?? new Error('Cargo no encontrado.')} />

  const vigente = cargo.estatus === 'Vigente'

  const quitarPago = async (p: Pago) => {
    if (await confirmar({
      titulo: 'Cancelar pago', peligro: true, textoConfirmar: 'Cancelar pago',
      mensaje: <>¿Cancelar el pago de <b>{formatoMoneda(p.monto)}</b> del {formatoFecha(p.fecha)}? El saldo del cargo volverá a subir.</>,
    })) cancelarPago.mutate({ id: cargo.id, pagoId: p.id })
  }

  return (
    <>
      <Link to="/cargos" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <Icono nombre="izquierda" className="h-4 w-4" /> Cargos
      </Link>
      <Encabezado
        titulo={<span className="flex items-center gap-3"><span className="font-mono">{cargo.folio}</span><InsigniaSaldo estado={cargo.estado} diasVencido={cargo.diasVencido} /></span>}
        descripcion={cargo.destinatario}
        acciones={vigente && (
          <>
            {cargo.saldo > 0 && puede('cobranza.editar') && (
              <Boton variante="primario" icono="cobranza" onClick={() => setPagando(true)}>Registrar pago</Boton>
            )}
            {puede('cargos.eliminar') && <Boton variante="peligro" onClick={() => setCancelando(true)}>Cancelar cargo</Boton>}
          </>
        )} />

      {!vigente && <div className="mb-4"><Aviso>Cargo cancelado: {cargo.motivoCancelacion}</Aviso></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tabla columnas={[
            { titulo: 'Descripción' }, { titulo: 'Cantidad', derecha: true }, { titulo: 'Precio unit.', derecha: true },
            { titulo: 'Desc. %', derecha: true }, { titulo: 'Importe', derecha: true },
          ]}>
            {cargo.partidas.map((p) => (
              <tr key={p.id}>
                <Celda>{p.descripcion}</Celda>
                <Celda derecha className="tabular-nums">{p.cantidad}</Celda>
                <Celda derecha className="tabular-nums">{formatoMoneda(p.precioUnitario)}</Celda>
                <Celda derecha className="tabular-nums">{p.descuentoPorcentaje || '—'}</Celda>
                <Celda derecha className="font-medium tabular-nums">{formatoMoneda(p.importe)}</Celda>
              </tr>
            ))}
          </Tabla>

          <HistorialPagos pagos={cargo.pagos} onCancelar={vigente && puede('cobranza.eliminar') ? quitarPago : undefined} />
        </div>

        <div className="space-y-6">
          <Tarjeta titulo="Importes">
            <Totales subtotal={cargo.subtotal} iva={cargo.iva} total={cargo.total} extra={[
              ['Pagado', cargo.pagado, 'text-emerald-700'],
              ['Saldo', cargo.saldo, 'border-t border-slate-200 pt-1.5 text-base font-semibold'],
            ]} />
          </Tarjeta>
          <Tarjeta titulo="Datos">
            <ListaDatos datos={[
              ['Cliente / prospecto', cargo.prospectoId
                ? <Link to={`/prospectos/${cargo.prospectoId}`} className="text-marca-600 hover:underline">{cargo.destinatario}</Link>
                : cargo.destinatario],
              ['Fecha', formatoFecha(cargo.fecha)],
              ['Vence', `${formatoFecha(cargo.fechaVencimiento)} (${cargo.diasCredito ? `${cargo.diasCredito} días` : 'contado'})`],
              ['Condición de pago', cargo.condicionPago ?? '—'],
              ['Vendedor', cargo.empleado ?? '—'],
              ['Almacén', cargo.almacen ?? 'No mueve inventario'],
              ['Cotización', cargo.cotizacionId
                ? <Link to={`/cotizaciones/${cargo.cotizacionId}`} className="text-marca-600 hover:underline">{cargo.cotizacion}</Link>
                : '—'],
              ['Notas', cargo.notas ?? '—'],
            ]} />
          </Tarjeta>
        </div>
      </div>

      {pagando && (
        <FormPago titulo="Registrar pago" folio={cargo.folio} saldo={cargo.saldo} fechaMinima={cargo.fecha}
          guardando={pagar.isPending} error={pagar.error} onCerrar={() => setPagando(false)}
          onGuardar={(datos) => pagar.mutate({ id: cargo.id, datos }, { onSuccess: () => setPagando(false) })} />
      )}
      {cancelando && (
        <FormCancelarDocumento folio={cargo.folio} guardando={cancelar.isPending} error={cancelar.error}
          onCerrar={() => setCancelando(false)}
          onConfirmar={(motivo) => cancelar.mutate({ id: cargo.id, motivo }, { onSuccess: () => setCancelando(false) })} />
      )}
    </>
  )
}
