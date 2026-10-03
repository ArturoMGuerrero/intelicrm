import { useState, type FormEvent } from 'react'
import { useDesactivarProducto, useGuardarProducto, useProductos, useProveedores } from '../api/hooks'
import type { Producto, TipoProducto } from '../api/tipos'
import {
  BarraFiltros, Boton, BotonIcono, Buscador, Campo, Cargando, Celda, CeldaAcciones, Checkbox, Doble, Encabezado,
  errorDeCampo, Fila, Input, Insignia, MensajeError, Modal, nulo, PieFormulario, Select, Tabla, Tarjeta, Textarea,
  useConfirmar, Vacio,
} from '../components/ui'
import { TIPOS_PRODUCTO } from '../lib/etiquetas'
import { formatoMoneda } from '../lib/formato'
import { SiPuede } from '../sesion/Sesion'

export default function Productos() {
  const confirmar = useConfirmar()
  const [buscar, setBuscar] = useState('')
  const [inactivos, setInactivos] = useState(false)
  const [editando, setEditando] = useState<Producto | 'nuevo' | null>(null)
  const { data, isLoading, error } = useProductos(buscar, inactivos)
  const desactivar = useDesactivarProducto()

  const darDeBaja = async (p: Producto) => {
    if (await confirmar({ titulo: 'Dar de baja producto', mensaje: <>¿Dar de baja <b>{p.nombre}</b>? Ya no aparecerá en cotizaciones nuevas.</>, textoConfirmar: 'Dar de baja', peligro: true }))
      desactivar.mutate(p.id)
  }

  return (
    <>
      <Encabezado titulo="Productos y servicios" descripcion="Lo que se puede incluir en una cotización."
        acciones={<SiPuede permiso="productos.editar"><Boton variante="primario" icono="mas" onClick={() => setEditando('nuevo')}>Nuevo</Boton></SiPuede>} />

      <BarraFiltros>
        <Buscador placeholder="Buscar por código o nombre…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <Checkbox etiqueta="Mostrar inactivos" checked={inactivos} onChange={(e) => setInactivos(e.target.checked)} />
      </BarraFiltros>

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay productos." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Código' }, { titulo: 'Nombre' }, { titulo: 'Tipo' }, { titulo: 'Precio', derecha: true }, { titulo: '' }]}>
          {data.map((p) => (
            <Fila key={p.id} inactiva={!p.activo}>
              <Celda className="font-mono text-xs">{p.codigo}</Celda>
              <Celda><Doble principal={p.nombre} secundario={p.descripcion} /></Celda>
              <Celda><Insignia tono={p.tipo === 'Servicio' ? 'violeta' : 'cielo'}>{p.tipo}</Insignia></Celda>
              <Celda derecha className="tabular-nums">{formatoMoneda(p.precio)}</Celda>
              <CeldaAcciones>
                <SiPuede permiso="productos.editar"><BotonIcono icono="editar" etiqueta="Editar" onClick={() => setEditando(p)} /></SiPuede>
                {p.activo && <SiPuede permiso="productos.eliminar"><BotonIcono icono="basura" etiqueta="Dar de baja" peligro onClick={() => darDeBaja(p)} /></SiPuede>}
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}

      {editando && <FormProducto producto={editando === 'nuevo' ? undefined : editando} onCerrar={() => setEditando(null)} />}
    </>
  )
}

function FormProducto({ producto, onCerrar }: { producto?: Producto; onCerrar: () => void }) {
  const guardar = useGuardarProducto()
  const proveedores = useProveedores().data ?? []
  const [f, setF] = useState({
    codigo: producto?.codigo ?? '', nombre: producto?.nombre ?? '', descripcion: producto?.descripcion ?? '',
    tipo: producto?.tipo ?? ('Producto' as TipoProducto), precio: producto?.precio.toString() ?? '',
    costo: producto?.costo.toString() ?? '0', stockMinimo: producto?.stockMinimo?.toString() ?? '',
    proveedorId: producto?.proveedorId?.toString() ?? '', activo: producto?.activo ?? true,
  })
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (c: string) => errorDeCampo(guardar.error, c)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({
      id: producto?.id,
      datos: {
        codigo: f.codigo, nombre: f.nombre, descripcion: nulo(f.descripcion), tipo: f.tipo, precio: Number(f.precio),
        costo: Number(f.costo) || 0, stockMinimo: f.tipo === 'Producto' && f.stockMinimo !== '' ? Number(f.stockMinimo) : null,
        proveedorId: f.proveedorId ? Number(f.proveedorId) : null, activo: f.activo,
      },
    }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo={producto ? 'Editar producto' : 'Nuevo producto o servicio'} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Código *" error={err('codigo')}>
          <Input className="font-mono uppercase" value={f.codigo} onChange={cambiar('codigo')} required autoFocus />
        </Campo>
        <Campo etiqueta="Tipo">
          <Select value={f.tipo} onChange={cambiar('tipo')}>
            {TIPOS_PRODUCTO.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Nombre *" className="sm:col-span-2" error={err('nombre')}>
          <Input value={f.nombre} onChange={cambiar('nombre')} required />
        </Campo>
        <Campo etiqueta="Precio (MXN, sin IVA) *" error={err('precio')}>
          <Input type="number" min="0" step="0.01" value={f.precio} onChange={cambiar('precio')} required />
        </Campo>
        <Campo etiqueta="Costo (último de compra)" error={err('costo')}>
          <Input type="number" min="0" step="0.01" value={f.costo} onChange={cambiar('costo')} />
        </Campo>
        {f.tipo === 'Producto' && (
          <Campo etiqueta="Stock mínimo" ayuda="Debajo de esto aparece en Pedido de faltantes." error={err('stockMinimo')}>
            <Input type="number" min="0" step="1" value={f.stockMinimo} onChange={cambiar('stockMinimo')} />
          </Campo>
        )}
        <Campo etiqueta="Proveedor habitual" className={f.tipo === 'Producto' ? '' : 'sm:col-span-2'}>
          <Select value={f.proveedorId} onChange={cambiar('proveedorId')}>
            <option value="">—</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Descripción" className="sm:col-span-2">
          <Textarea rows={2} value={f.descripcion} onChange={cambiar('descripcion')} />
        </Campo>
        {producto && <Checkbox className="sm:col-span-2" etiqueta="Activo" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />}
        <div className="sm:col-span-2"><PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} /></div>
      </form>
    </Modal>
  )
}
