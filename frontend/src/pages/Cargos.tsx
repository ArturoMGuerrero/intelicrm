import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCargos } from '../api/hooks'
import type { FiltroEstadoSaldo } from '../api/tipos'
import { filtrosEstadoSaldo, InsigniaSaldo } from '../components/Saldos'
import {
  BarraFiltros, BotonEnlace, Buscador, Cargando, Celda, Doble, Encabezado, FiltroChips, Fila, MensajeError, Tabla,
  Tarjeta, Vacio,
} from '../components/ui'
import { formatoFecha, formatoMoneda } from '../lib/formato'
import { SiPuede } from '../sesion/Sesion'

/** Cargos a clientes y prospectos (antes "Cargos a prospectos" / "Remisión"). */
export default function Cargos() {
  const navegar = useNavigate()
  const [buscar, setBuscar] = useState('')
  const [estado, setEstado] = useState<FiltroEstadoSaldo>('Todos')
  const { data, isLoading, error } = useCargos({ buscar, estado })

  return (
    <>
      <Encabezado titulo="Cargos" descripcion="Ventas cargadas a clientes y prospectos. Cada cargo genera su cuenta por cobrar."
        acciones={<SiPuede permiso="cargos.editar"><BotonEnlace to="/cargos/nuevo" variante="primario" icono="mas">Nuevo cargo</BotonEnlace></SiPuede>} />

      <BarraFiltros>
        <Buscador placeholder="Buscar por folio, cliente o prospecto…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
      </BarraFiltros>
      <FiltroChips opciones={filtrosEstadoSaldo} valor={estado} onCambiar={setEstado} />

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay cargos." /></Tarjeta> : (
        <Tabla columnas={[
          { titulo: 'Folio' }, { titulo: 'Fecha' }, { titulo: 'Cliente / prospecto' },
          { titulo: 'Total', derecha: true }, { titulo: 'Saldo', derecha: true }, { titulo: 'Estado' },
        ]}>
          {data.map((c) => (
            <Fila key={c.id} onClick={() => navegar(`/cargos/${c.id}`)} inactiva={c.estado === 'Cancelado'}>
              <Celda><Doble principal={<span className="font-mono">{c.folio}</span>} secundario={c.cotizacion && `De ${c.cotizacion}`} /></Celda>
              <Celda className="text-slate-600 tabular-nums">{formatoFecha(c.fecha)}</Celda>
              <Celda className="text-slate-700">{c.destinatario}</Celda>
              <Celda derecha className="tabular-nums">{formatoMoneda(c.total)}</Celda>
              <Celda derecha className="font-medium tabular-nums">{formatoMoneda(c.saldo)}</Celda>
              <Celda><InsigniaSaldo estado={c.estado} diasVencido={c.diasVencido} /></Celda>
            </Fila>
          ))}
        </Tabla>
      )}
    </>
  )
}
