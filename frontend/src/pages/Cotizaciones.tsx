import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCotizaciones } from '../api/hooks'
import type { EstatusCotizacion } from '../api/tipos'
import {
  BotonEnlace, Cargando, Celda, Doble, Encabezado, FiltroChips, Fila, Insignia, MensajeError, Tabla, Tarjeta, Vacio,
} from '../components/ui'
import { ESTATUS_COTIZACION, tonoEstatusCotizacion } from '../lib/etiquetas'
import { formatoFecha, formatoMoneda } from '../lib/formato'
import { SiPuede } from '../sesion/Sesion'

export default function Cotizaciones() {
  const [estatus, setEstatus] = useState<EstatusCotizacion | ''>('')
  const { data, isLoading, error } = useCotizaciones({ estatus })
  const navegar = useNavigate()
  const total = data?.reduce((s, c) => s + c.total, 0) ?? 0

  return (
    <>
      <Encabezado
        titulo="Cotizaciones"
        descripcion="Propuestas económicas enviadas a prospectos y clientes."
        acciones={
          <SiPuede permiso="cotizaciones.editar">
            <BotonEnlace variante="primario" icono="mas" to="/cotizaciones/nueva">Nueva cotización</BotonEnlace>
          </SiPuede>
        }
      />

      <FiltroChips valor={estatus} onCambiar={setEstatus}
        opciones={[{ valor: '' as const, texto: 'Todas' }, ...ESTATUS_COTIZACION.map((s) => ({ valor: s, texto: s }))]} />

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay cotizaciones." /></Tarjeta> : (
        <Tabla
          columnas={[
            { titulo: 'Folio' }, { titulo: 'Para' }, { titulo: 'Fecha' }, { titulo: 'Vence' },
            { titulo: 'Estatus' }, { titulo: 'Total', derecha: true },
          ]}
          pie={
            <tr>
              <td colSpan={5} className="px-4 py-3 text-right text-sm text-slate-500">Total de la lista</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatoMoneda(total)}</td>
            </tr>
          }>
          {data.map((c) => (
            <Fila key={c.id} onClick={() => navegar(`/cotizaciones/${c.id}`)}>
              <Celda className="font-medium text-marca-600">{c.folio}</Celda>
              <Celda><Doble principal={<span className="font-normal">{c.destinatario}</span>} secundario={c.empleado} /></Celda>
              <Celda className="whitespace-nowrap text-slate-600">{formatoFecha(c.fecha)}</Celda>
              <Celda className="whitespace-nowrap text-slate-600">{formatoFecha(c.fechaVencimiento)}</Celda>
              <Celda><Insignia tono={tonoEstatusCotizacion[c.estatus]}>{c.estatus}</Insignia></Celda>
              <Celda derecha className="font-medium tabular-nums">{formatoMoneda(c.total)}</Celda>
            </Fila>
          ))}
        </Tabla>
      )}
    </>
  )
}
