import { useState, type FormEvent } from 'react'
import { useDesactivarListaPrecios, useGuardarListaPrecios, useListaPrecios, useListasPrecios, useProductos } from '../api/hooks'
import type { ListaPrecios, ListaPreciosResumen } from '../api/tipos'
import {
  BarraFiltros, Boton, BotonIcono, Campo, Cargando, Celda, CeldaAcciones, Checkbox, Encabezado, errorDeCampo, Fila, Input,
  Insignia, MensajeError, Modal, nulo, PieFormulario, Select, Tabla, Tarjeta, Textarea, useConfirmar, Vacio,
} from '../components/ui'
import { formatoMoneda } from '../lib/formato'
import { SiPuede } from '../sesion/Sesion'

/** Listas de precios especiales (Mayoreo, Distribuidores...) que se asignan a clientes. */
export default function ListasPrecios() {
  const confirmar = useConfirmar()
  const [inactivas, setInactivas] = useState(false)
  const [editando, setEditando] = useState<number | 'nueva' | null>(null)
  const { data, isLoading, error } = useListasPrecios(inactivas)
  const desactivar = useDesactivarListaPrecios()

  const darDeBaja = async (l: ListaPreciosResumen) => {
    if (await confirmar({
      titulo: 'Dar de baja lista', peligro: true, textoConfirmar: 'Dar de baja',
      mensaje: <>¿Dar de baja <b>{l.nombre}</b>? Sus {l.clientes} clientes volverán a usar los precios generales.</>,
    })) desactivar.mutate(l.id)
  }

  return (
    <>
      <Encabezado titulo="Listas de precios" descripcion="Precios especiales por cliente. Lo que no esté en la lista usa el precio general del producto."
        acciones={<SiPuede permiso="listas-precios.editar"><Boton variante="primario" icono="mas" onClick={() => setEditando('nueva')}>Nueva lista</Boton></SiPuede>} />
      <BarraFiltros><Checkbox etiqueta="Mostrar inactivas" checked={inactivas} onChange={(e) => setInactivas(e.target.checked)} /></BarraFiltros>

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay listas de precios." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Lista' }, { titulo: 'Productos', derecha: true }, { titulo: 'Clientes', derecha: true }, { titulo: '' }]}>
          {data.map((l) => (
            <Fila key={l.id} inactiva={!l.activo}>
              <Celda>
                <p className="font-medium text-slate-900">{l.nombre} {!l.activo && <Insignia className="ml-2">Inactiva</Insignia>}</p>
                {l.descripcion && <p className="text-xs text-slate-500">{l.descripcion}</p>}
              </Celda>
              <Celda derecha className="tabular-nums">{l.productos}</Celda>
              <Celda derecha className="tabular-nums">{l.clientes}</Celda>
              <CeldaAcciones>
                <SiPuede permiso="listas-precios.editar"><BotonIcono icono="editar" etiqueta="Editar" onClick={() => setEditando(l.id)} /></SiPuede>
                {l.activo && <SiPuede permiso="listas-precios.eliminar"><BotonIcono icono="basura" etiqueta="Dar de baja" peligro onClick={() => darDeBaja(l)} /></SiPuede>}
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}

      {editando === 'nueva' && <FormLista onCerrar={() => setEditando(null)} />}
      {typeof editando === 'number' && <CargarLista id={editando} onCerrar={() => setEditando(null)} />}
    </>
  )
}

function CargarLista({ id, onCerrar }: { id: number; onCerrar: () => void }) {
  const { data, isLoading, error } = useListaPrecios(id)
  if (isLoading) return <Modal abierto titulo="Lista de precios" onCerrar={onCerrar}><Cargando /></Modal>
  if (error || !data) return <Modal abierto titulo="Lista de precios" onCerrar={onCerrar}><MensajeError error={error} /></Modal>
  return <FormLista lista={data} onCerrar={onCerrar} />
}

function FormLista({ lista, onCerrar }: { lista?: ListaPrecios; onCerrar: () => void }) {
  const guardar = useGuardarListaPrecios()
  const productos = useProductos().data ?? []
  const [f, setF] = useState({ nombre: lista?.nombre ?? '', descripcion: lista?.descripcion ?? '', activo: lista?.activo ?? true })
  const [precios, setPrecios] = useState(() => (lista?.precios ?? []).map((p) => ({ productoId: p.productoId, precio: p.precio.toString() })))
  const [agregar, setAgregar] = useState('')
  const disponibles = productos.filter((p) => !precios.some((x) => x.productoId === p.id))

  const agregarProducto = () => {
    const producto = productos.find((p) => p.id === Number(agregar))
    if (!producto) return
    setPrecios([...precios, { productoId: producto.id, precio: producto.precio.toString() }])
    setAgregar('')
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({
      id: lista?.id,
      datos: {
        nombre: f.nombre, descripcion: nulo(f.descripcion), activo: f.activo,
        precios: precios.map((p) => ({ productoId: p.productoId, precio: Number(p.precio) })),
      },
    }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo={lista ? `Editar ${lista.nombre}` : 'Nueva lista de precios'} onCerrar={onCerrar} ancho="max-w-3xl">
      <form onSubmit={enviar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre *" error={errorDeCampo(guardar.error, 'nombre')}>
            <Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required autoFocus />
          </Campo>
          <Campo etiqueta="Descripción"><Textarea rows={1} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></Campo>
        </div>

        <div className="flex gap-2">
          <Select value={agregar} onChange={(e) => setAgregar(e.target.value)} aria-label="Producto a agregar">
            <option value="">Agregar producto a la lista…</option>
            {disponibles.map((p) => <option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>)}
          </Select>
          <Boton icono="mas" onClick={agregarProducto} disabled={!agregar}>Agregar</Boton>
        </div>

        {precios.length === 0 ? <p className="text-sm text-slate-500">Agrega los productos que tendrán un precio distinto al general.</p> : (
          <Tabla columnas={[{ titulo: 'Producto' }, { titulo: 'Precio general', derecha: true }, { titulo: 'Precio en la lista', derecha: true }, { titulo: 'Dif.', derecha: true }, { titulo: '' }]}>
            {precios.map((p, i) => {
              const producto = productos.find((x) => x.id === p.productoId)
              const general = producto?.precio ?? 0
              const diferencia = general ? ((Number(p.precio) - general) / general) * 100 : 0
              return (
                <tr key={p.productoId}>
                  <Celda>{producto ? `${producto.codigo} · ${producto.nombre}` : `#${p.productoId}`}</Celda>
                  <Celda derecha className="text-slate-500 tabular-nums">{formatoMoneda(general)}</Celda>
                  <Celda derecha>
                    <Input className="ml-auto w-32 text-right" type="number" min="0" step="0.01" value={p.precio} aria-label="Precio en la lista"
                      onChange={(e) => setPrecios(precios.map((x, j) => (j === i ? { ...x, precio: e.target.value } : x)))} required />
                  </Celda>
                  <Celda derecha className={diferencia < 0 ? 'text-emerald-700 tabular-nums' : 'text-slate-500 tabular-nums'}>
                    {diferencia ? `${diferencia > 0 ? '+' : ''}${diferencia.toFixed(1)}%` : '—'}
                  </Celda>
                  <Celda><BotonIcono icono="basura" etiqueta="Quitar" peligro onClick={() => setPrecios(precios.filter((_, j) => j !== i))} /></Celda>
                </tr>
              )
            })}
          </Tabla>
        )}

        {lista && <Checkbox etiqueta="Activa" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />}
        <PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} />
      </form>
    </Modal>
  )
}
