import type { Dispatch, SetStateAction } from 'react'
import type { Partida, Producto } from '../api/tipos'
import { formatoMoneda } from '../lib/formato'
import { Boton, BotonIcono, Celda, Input, nulo, Select, Tabla, Tarjeta } from './ui'

// Captura de partidas (productos o conceptos libres) con subtotal, IVA y total.
// La usan cotizaciones y cargos.

export const TASA_IVA = 0.16

export interface PartidaForm {
  clave: number
  productoId: string
  descripcion: string
  cantidad: string
  precioUnitario: string
  descuentoPorcentaje: string
}

let siguienteClave = 1

export const partidaVacia = (): PartidaForm => ({
  clave: siguienteClave++, productoId: '', descripcion: '', cantidad: '1', precioUnitario: '', descuentoPorcentaje: '0',
})

export const partidasDesde = (partidas: Partida[] | undefined): PartidaForm[] =>
  partidas?.length
    ? partidas.map((p) => ({
        clave: siguienteClave++,
        productoId: p.productoId?.toString() ?? '',
        descripcion: p.descripcion,
        cantidad: p.cantidad.toString(),
        precioUnitario: p.precioUnitario.toString(),
        descuentoPorcentaje: p.descuentoPorcentaje.toString(),
      }))
    : [partidaVacia()]

export const importePartida = (p: PartidaForm) =>
  Math.round((Number(p.cantidad) || 0) * (Number(p.precioUnitario) || 0) * (1 - (Number(p.descuentoPorcentaje) || 0) / 100) * 100) / 100

/** Partidas en el formato que espera la API (se omiten las filas vacías). */
export const partidasParaApi = (partidas: PartidaForm[]) =>
  partidas
    .filter((p) => p.productoId || p.descripcion.trim())
    .map((p) => ({
      productoId: p.productoId ? Number(p.productoId) : null,
      descripcion: nulo(p.descripcion),
      cantidad: Number(p.cantidad),
      precioUnitario: p.precioUnitario === '' ? null : Number(p.precioUnitario),
      descuentoPorcentaje: Number(p.descuentoPorcentaje) || 0,
    }))

export function EditorPartidas({ partidas, setPartidas, productos }: {
  partidas: PartidaForm[]
  setPartidas: Dispatch<SetStateAction<PartidaForm[]>>
  productos: Producto[] | undefined
}) {
  const cambiarPartida = (clave: number, cambios: Partial<PartidaForm>) =>
    setPartidas((ps) => ps.map((p) => (p.clave === clave ? { ...p, ...cambios } : p)))

  const elegirProducto = (clave: number, productoId: string) => {
    const producto = productos?.find((x) => x.id === Number(productoId))
    cambiarPartida(clave, producto
      ? { productoId, descripcion: producto.nombre, precioUnitario: producto.precio.toString() }
      : { productoId })
  }

  const subtotal = partidas.reduce((s, p) => s + importePartida(p), 0)
  const iva = Math.round(subtotal * TASA_IVA * 100) / 100

  return (
    <div>
      <Tabla className="min-w-[760px]" columnas={[
        { titulo: 'Producto / servicio', className: 'w-56' }, { titulo: 'Descripción' },
        { titulo: 'Cantidad', derecha: true, className: 'w-24' }, { titulo: 'Precio unit.', derecha: true, className: 'w-32' },
        { titulo: 'Desc. %', derecha: true, className: 'w-24' }, { titulo: 'Importe', derecha: true, className: 'w-32' },
        { titulo: <span className="sr-only">Quitar</span>, className: 'w-10' },
      ]}>
        {partidas.map((p) => (
          <tr key={p.clave}>
            <Celda>
              <Select value={p.productoId} onChange={(e) => elegirProducto(p.clave, e.target.value)} aria-label="Producto">
                <option value="">Libre…</option>
                {productos?.map((x) => <option key={x.id} value={x.id}>{x.codigo} · {x.nombre}</option>)}
              </Select>
            </Celda>
            <Celda>
              <Input value={p.descripcion} aria-label="Descripción" onChange={(e) => cambiarPartida(p.clave, { descripcion: e.target.value })} />
            </Celda>
            <Celda>
              <Input className="text-right" type="number" min="0.01" step="0.01" value={p.cantidad} aria-label="Cantidad"
                onChange={(e) => cambiarPartida(p.clave, { cantidad: e.target.value })} />
            </Celda>
            <Celda>
              <Input className="text-right" type="number" min="0" step="0.01" value={p.precioUnitario} aria-label="Precio unitario"
                onChange={(e) => cambiarPartida(p.clave, { precioUnitario: e.target.value })} />
            </Celda>
            <Celda>
              <Input className="text-right" type="number" min="0" max="100" step="0.5" value={p.descuentoPorcentaje} aria-label="Descuento"
                onChange={(e) => cambiarPartida(p.clave, { descuentoPorcentaje: e.target.value })} />
            </Celda>
            <Celda derecha className="font-medium tabular-nums">{formatoMoneda(importePartida(p))}</Celda>
            <Celda>
              <BotonIcono icono="basura" etiqueta="Quitar partida" peligro disabled={partidas.length === 1}
                onClick={() => setPartidas((ps) => ps.filter((x) => x.clave !== p.clave))} />
            </Celda>
          </tr>
        ))}
      </Tabla>
      <Tarjeta className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Boton icono="mas" className="self-start" onClick={() => setPartidas((ps) => [...ps, partidaVacia()])}>Agregar partida</Boton>
        <Totales subtotal={subtotal} iva={iva} total={subtotal + iva} />
      </Tarjeta>
    </div>
  )
}

/** Bloque de subtotal / IVA / total alineado a la derecha. */
export function Totales({ subtotal, iva, total, extra }: {
  subtotal: number; iva: number; total: number; extra?: [string, number, string?][]
}) {
  return (
    <dl className="w-full space-y-1.5 text-sm sm:w-64">
      <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="tabular-nums">{formatoMoneda(subtotal)}</dd></div>
      <div className="flex justify-between"><dt className="text-slate-500">IVA 16%</dt><dd className="tabular-nums">{formatoMoneda(iva)}</dd></div>
      <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-semibold">
        <dt>Total</dt><dd className="tabular-nums">{formatoMoneda(total)}</dd>
      </div>
      {extra?.map(([etiqueta, valor, clase]) => (
        <div key={etiqueta} className={`flex justify-between ${clase ?? ''}`}>
          <dt>{etiqueta}</dt><dd className="tabular-nums">{formatoMoneda(valor)}</dd>
        </div>
      ))}
    </dl>
  )
}
