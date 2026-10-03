import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAlmacenes, useFaltantes, usePedirFaltantes, useProveedores } from '../api/hooks'
import {
  Aviso, Boton, Campo, Cargando, Celda, Encabezado, Icono, Input, MensajeError, Select, Tabla, Tarjeta, Vacio,
} from '../components/ui'
import { formatoMoneda } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'

interface Seleccion { incluir: boolean; cantidad: string; proveedorId: string }

const cantidad = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 2 })

/**
 * Pedido de faltantes: productos cuya existencia (más lo ya pedido) quedó debajo del mínimo.
 * Genera una orden de compra por proveedor.
 */
export default function Faltantes() {
  const navegar = useNavigate()
  const { puede } = useSesion()
  const { data, isLoading, error } = useFaltantes()
  const proveedores = useProveedores().data ?? []
  const almacenes = useAlmacenes().data ?? []
  const pedir = usePedirFaltantes()
  const [almacenId, setAlmacenId] = useState('')
  const [seleccion, setSeleccion] = useState<Record<number, Seleccion>>({})

  if (isLoading) return <Cargando />
  if (error || !data) return <MensajeError error={error} />

  const fila = (productoId: number): Seleccion => {
    const f = data.find((x) => x.productoId === productoId)!
    return seleccion[productoId] ?? { incluir: !!f.proveedorId, cantidad: f.sugerido.toString(), proveedorId: f.proveedorId?.toString() ?? '' }
  }
  const cambiar = (productoId: number, cambios: Partial<Seleccion>) =>
    setSeleccion({ ...seleccion, [productoId]: { ...fila(productoId), ...cambios } })

  const elegidos = data.filter((f) => fila(f.productoId).incluir)
  const sinProveedor = elegidos.some((f) => !fila(f.productoId).proveedorId)
  const proveedoresDistintos = new Set(elegidos.map((f) => fila(f.productoId).proveedorId)).size
  const total = elegidos.reduce((s, f) => s + (Number(fila(f.productoId).cantidad) || 0) * f.costo, 0)

  const generar = () => pedir.mutate({
    almacenId: Number(almacenId),
    productos: elegidos.map((f) => ({ productoId: f.productoId, proveedorId: Number(fila(f.productoId).proveedorId), cantidad: Number(fila(f.productoId).cantidad) })),
  }, { onSuccess: (ordenes) => navegar(ordenes.length === 1 ? `/compras/${ordenes[0].id}` : '/compras') })

  return (
    <>
      <Link to="/compras" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <Icono nombre="izquierda" className="h-4 w-4" /> Órdenes de compra
      </Link>
      <Encabezado titulo="Pedido de faltantes" descripcion="Productos debajo de su stock mínimo, contando lo que ya está pedido y no ha llegado." />

      {data.length === 0 ? (
        <Tarjeta><Vacio mensaje="No hay faltantes. Para que un producto aparezca aquí, indícale un stock mínimo en Productos." /></Tarjeta>
      ) : (
        <>
          <Tabla columnas={[
            { titulo: '' }, { titulo: 'Producto' }, { titulo: 'Existencia', derecha: true }, { titulo: 'Por recibir', derecha: true },
            { titulo: 'Mínimo', derecha: true }, { titulo: 'Pedir', derecha: true }, { titulo: 'Proveedor' }, { titulo: 'Importe', derecha: true },
          ]}>
            {data.map((f) => {
              const s = fila(f.productoId)
              return (
                <tr key={f.productoId} className={s.incluir ? '' : 'opacity-60'}>
                  <Celda><input type="checkbox" className="h-4 w-4 accent-marca-600" checked={s.incluir} aria-label={`Pedir ${f.producto}`}
                    onChange={(e) => cambiar(f.productoId, { incluir: e.target.checked })} /></Celda>
                  <Celda><p>{f.producto}</p><p className="font-mono text-xs text-slate-500">{f.codigo}</p></Celda>
                  <Celda derecha className="tabular-nums text-rose-600">{cantidad(f.existencia)}</Celda>
                  <Celda derecha className="tabular-nums text-slate-500">{cantidad(f.porRecibir)}</Celda>
                  <Celda derecha className="tabular-nums">{cantidad(f.stockMinimo)}</Celda>
                  <Celda derecha><Input className="ml-auto w-24 text-right" type="number" min="1" step="1" value={s.cantidad} aria-label="Cantidad a pedir"
                    onChange={(e) => cambiar(f.productoId, { cantidad: e.target.value })} /></Celda>
                  <Celda>
                    <Select value={s.proveedorId} onChange={(e) => cambiar(f.productoId, { proveedorId: e.target.value })} aria-label="Proveedor">
                      <option value="">Elige proveedor…</option>
                      {proveedores.map((p) => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
                    </Select>
                  </Celda>
                  <Celda derecha className="tabular-nums">{formatoMoneda((Number(s.cantidad) || 0) * f.costo)}</Celda>
                </tr>
              )
            })}
          </Tabla>

          {puede('compras.editar') && (
            <Tarjeta className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <Campo etiqueta="Recibir en el almacén" className="sm:w-72">
                <Select value={almacenId} onChange={(e) => setAlmacenId(e.target.value)}>
                  <option value="">Selecciona…</option>
                  {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.sucursal})</option>)}
                </Select>
              </Campo>
              <div className="flex flex-col items-end gap-2">
                <p className="text-sm text-slate-600">
                  {elegidos.length} productos · {proveedoresDistintos} {proveedoresDistintos === 1 ? 'orden' : 'órdenes'} · {formatoMoneda(total)} + IVA
                </p>
                <Boton variante="primario" icono="mas" cargando={pedir.isPending} textoCargando="Generando…"
                  disabled={!almacenId || elegidos.length === 0 || sinProveedor} onClick={generar}>
                  Generar órdenes de compra
                </Boton>
              </div>
            </Tarjeta>
          )}
          {sinProveedor && <div className="mt-3"><Aviso>Elige el proveedor de todos los productos seleccionados.</Aviso></div>}
          <div className="mt-3"><MensajeError error={pedir.error} /></div>
        </>
      )}
    </>
  )
}
