import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useOrdenesCompra } from '../api/hooks'
import type { EstatusOrdenCompra } from '../api/tipos'
import {
  BarraFiltros, BotonEnlace, Buscador, Cargando, Celda, Encabezado, FiltroChips, Fila, MensajeError, Tabla, Tarjeta, Vacio,
} from '../components/ui'
import { etiquetaEstatusCompra, InsigniaCompra } from '../components/Compras'
import { formatoFecha, formatoMoneda } from '../lib/formato'
import { SiPuede } from '../sesion/Sesion'

/** Órdenes de compra a proveedores. */
export default function Compras() {
  const navegar = useNavigate()
  const [buscar, setBuscar] = useState('')
  const [estatus, setEstatus] = useState<EstatusOrdenCompra | ''>('')
  const { data, isLoading, error } = useOrdenesCompra({ buscar, estatus })

  return (
    <>
      <Encabezado titulo="Órdenes de compra" descripcion="Pedidos a proveedores. Al recibir la mercancía entra al almacén y se genera la cuenta por pagar."
        acciones={
          <SiPuede permiso="compras.editar">
            <BotonEnlace to="/compras/faltantes" icono="alerta">Pedido de faltantes</BotonEnlace>
            <BotonEnlace to="/compras/nueva" variante="primario" icono="mas">Nueva orden</BotonEnlace>
          </SiPuede>
        } />

      <BarraFiltros>
        <Buscador placeholder="Buscar por folio o proveedor…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
      </BarraFiltros>
      <FiltroChips valor={estatus} onCambiar={setEstatus} opciones={[
        { valor: '', texto: 'Todas' },
        ...(Object.keys(etiquetaEstatusCompra) as EstatusOrdenCompra[]).map((e) => ({ valor: e, texto: etiquetaEstatusCompra[e][0] })),
      ]} />

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay órdenes de compra." /></Tarjeta> : (
        <Tabla columnas={[
          { titulo: 'Folio' }, { titulo: 'Fecha' }, { titulo: 'Proveedor' }, { titulo: 'Almacén' },
          { titulo: 'Total', derecha: true }, { titulo: 'Recibido', derecha: true }, { titulo: 'Estatus' },
        ]}>
          {data.map((o) => (
            <Fila key={o.id} onClick={() => navegar(`/compras/${o.id}`)} inactiva={o.estatus === 'Cancelada'}>
              <Celda className="font-mono">{o.folio}</Celda>
              <Celda className="text-slate-600 tabular-nums">{formatoFecha(o.fecha)}</Celda>
              <Celda>{o.proveedor}</Celda>
              <Celda className="text-slate-600">{o.almacen}</Celda>
              <Celda derecha className="tabular-nums">{formatoMoneda(o.total)}</Celda>
              <Celda derecha className="text-slate-600 tabular-nums">{o.porcentajeRecibido}%</Celda>
              <Celda><InsigniaCompra estatus={o.estatus} /></Celda>
            </Fila>
          ))}
        </Tabla>
      )}
    </>
  )
}
