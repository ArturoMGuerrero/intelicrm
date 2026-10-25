import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api/cliente'
import { useCatalogo, useDesactivarProducto, useGuardarProducto, useProductos, useProveedores } from '../api/hooks'
import type { Producto, TipoProducto } from '../api/tipos'
import {
  BarraFiltros, Boton, BotonIcono, Buscador, Campo, Cargando, Celda, CeldaAcciones, Checkbox, cn, Doble, Encabezado,
  errorDeCampo, Fila, Input, Insignia, MensajeError, Modal, notificar, nulo, numeroONulo, PieFormulario, Select, Tabla,
  Tarjeta, Textarea, useConfirmar, Vacio,
} from '../components/ui'
import { etiquetaTasa, TASAS_IVA } from '../components/EditorPartidas'
import { TIPOS_PRODUCTO } from '../lib/etiquetas'
import { formatoMoneda } from '../lib/formato'
import { SiPuede } from '../sesion/Sesion'

const TAMANO_IMAGEN = 300 * 1024

export default function Productos() {
  const confirmar = useConfirmar()
  const [parametros] = useSearchParams()
  const [buscar, setBuscar] = useState(parametros.get('buscar') ?? '')
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
        <Buscador placeholder="Buscar por código, nombre o código de barras…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <Checkbox etiqueta="Mostrar inactivos" checked={inactivos} onChange={(e) => setInactivos(e.target.checked)} />
      </BarraFiltros>

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay productos." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Código' }, { titulo: 'Nombre' }, { titulo: 'Categoría' }, { titulo: 'Tipo' },
          { titulo: 'Precio', derecha: true }, { titulo: '' }]}>
          {data.map((p) => (
            <Fila key={p.id} inactiva={!p.activo}>
              <Celda className="font-mono text-xs">
                <p>{p.codigo}</p>
                {p.codigoBarras && <p className="text-slate-500">{p.codigoBarras}</p>}
              </Celda>
              <Celda><Doble principal={p.nombre} secundario={[p.presentacion, p.descripcion].filter(Boolean).join(' · ') || null} /></Celda>
              <Celda className="text-slate-600">{p.categoria ?? '—'}</Celda>
              <Celda><Insignia tono={p.tipo === 'Servicio' ? 'violeta' : 'cielo'}>{p.tipo}</Insignia></Celda>
              <Celda derecha className="tabular-nums">
                <p>{formatoMoneda(p.precio)}{p.unidadMedida && <span className="text-xs text-slate-500"> / {p.unidadMedida}</span>}</p>
                {p.precioMayoreo != null && (
                  <p className="text-xs text-slate-500">{formatoMoneda(p.precioMayoreo)} desde {p.cantidadMayoreo}</p>
                )}
                {p.tasaIva != null && p.tasaIva !== 0.16 && <p className="text-xs font-medium text-amber-700">IVA {etiquetaTasa(p.tasaIva)}</p>}
              </Celda>
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

function Seccion({ titulo }: { titulo: string }) {
  return <p className="border-b border-slate-200 pb-1 text-xs font-semibold tracking-wider text-slate-500 uppercase sm:col-span-2">{titulo}</p>
}

type FilaProveedor = { proveedorId: string; codigoProveedor: string; costo: string }

function FormProducto({ producto: p, onCerrar }: { producto?: Producto; onCerrar: () => void }) {
  const guardar = useGuardarProducto()
  const qc = useQueryClient()
  const proveedores = useProveedores().data ?? []
  const categorias = useCatalogo('categorias-producto').data ?? []
  const texto = (v: string | null | undefined) => v ?? ''
  const [f, setF] = useState({
    codigo: texto(p?.codigo), nombre: texto(p?.nombre), descripcion: texto(p?.descripcion),
    tipo: p?.tipo ?? ('Producto' as TipoProducto), categoriaId: p?.categoriaId?.toString() ?? '',
    codigoBarras: texto(p?.codigoBarras), codigoAlterno: texto(p?.codigoAlterno), presentacion: texto(p?.presentacion),
    unidadMedida: texto(p?.unidadMedida), ubicacion: texto(p?.ubicacion),
    precio: p?.precio.toString() ?? '', tasaIva: p?.tasaIva?.toString() ?? '', precioMayoreo: p?.precioMayoreo?.toString() ?? '', cantidadMayoreo: p?.cantidadMayoreo?.toString() ?? '',
    costo: p?.costo.toString() ?? '0', stockMinimo: p?.stockMinimo?.toString() ?? '',
    proveedorId: p?.proveedorId?.toString() ?? '', activo: p?.activo ?? true,
  })
  const [otros, setOtros] = useState<FilaProveedor[]>(() => (p?.otrosProveedores ?? []).map((x) => ({
    proveedorId: x.proveedorId.toString(), codigoProveedor: texto(x.codigoProveedor), costo: x.costo?.toString() ?? '',
  })))
  // Imagen: undefined = sin cambios; null = quitarla; texto = nueva (data URL).
  const [imagen, setImagen] = useState<string | null | undefined>(undefined)
  const [imagenActual, setImagenActual] = useState<string | null>(null)
  useEffect(() => {
    if (p?.tieneImagen) api.get<{ imagen: string | null }>(`/productos/${p.id}/imagen`).then((r) => setImagenActual(r.imagen)).catch(() => {})
  }, [p])

  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (c: string) => errorDeCampo(guardar.error, c)

  const categoria = categorias.find((c) => c.id === Number(f.categoriaId))
  const sugerido = categoria?.margenPorcentaje != null && Number(f.costo) > 0
    ? Math.round(Number(f.costo) * (1 + categoria.margenPorcentaje / 100) * 100) / 100 : null

  const elegirImagen = (archivo: File | undefined) => {
    if (!archivo) return
    if (!['image/png', 'image/jpeg'].includes(archivo.type)) return notificar.error('La imagen debe ser PNG o JPEG.')
    if (archivo.size > TAMANO_IMAGEN) return notificar.error('La imagen pesa más de 300 KB.')
    const lector = new FileReader()
    lector.onload = () => setImagen(lector.result as string)
    lector.readAsDataURL(archivo)
  }
  const vistaImagen = imagen === undefined ? imagenActual : imagen

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({
      id: p?.id,
      datos: {
        codigo: f.codigo, nombre: f.nombre, descripcion: nulo(f.descripcion), tipo: f.tipo, categoriaId: numeroONulo(f.categoriaId),
        codigoBarras: nulo(f.codigoBarras), codigoAlterno: nulo(f.codigoAlterno), presentacion: nulo(f.presentacion),
        unidadMedida: nulo(f.unidadMedida), ubicacion: nulo(f.ubicacion),
        precio: Number(f.precio), tasaIva: f.tasaIva === '' ? null : Number(f.tasaIva), precioMayoreo: numeroONulo(f.precioMayoreo), cantidadMayoreo: numeroONulo(f.cantidadMayoreo),
        costo: Number(f.costo) || 0, stockMinimo: f.tipo === 'Producto' && f.stockMinimo !== '' ? Number(f.stockMinimo) : null,
        proveedorId: numeroONulo(f.proveedorId),
        otrosProveedores: otros.filter((x) => x.proveedorId).map((x) => ({
          proveedorId: Number(x.proveedorId), codigoProveedor: nulo(x.codigoProveedor), costo: numeroONulo(x.costo),
        })),
        activo: f.activo,
      },
    }, {
      onSuccess: async (guardado) => {
        if (imagen !== undefined) {
          try {
            await api.put(`/productos/${(guardado as Producto).id}/imagen`, { imagen })
            qc.invalidateQueries({ queryKey: ['productos'] })
          } catch (error) {
            notificar.error(error)
          }
        }
        onCerrar()
      },
    })
  }

  return (
    <Modal abierto titulo={p ? `Editar ${p.nombre}` : 'Nuevo producto o servicio'} onCerrar={onCerrar} ancho="max-w-3xl">
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
        <Seccion titulo="Datos generales" />
        <Campo etiqueta="Código *" error={err('codigo')}>
          <Input className="font-mono uppercase" value={f.codigo} onChange={cambiar('codigo')} required autoFocus />
        </Campo>
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Tipo">
            <Select value={f.tipo} onChange={cambiar('tipo')}>
              {TIPOS_PRODUCTO.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="Categoría">
            <Select value={f.categoriaId} onChange={cambiar('categoriaId')}>
              <option value="">—</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Campo>
        </div>
        <Campo etiqueta="Nombre *" className="sm:col-span-2" error={err('nombre')}>
          <Input value={f.nombre} onChange={cambiar('nombre')} required />
        </Campo>
        <Campo etiqueta="Código de barras" error={err('codigoBarras')}>
          <Input className="font-mono" value={f.codigoBarras} onChange={cambiar('codigoBarras')} placeholder="Escanéalo aquí" />
        </Campo>
        <Campo etiqueta="Código alterno" ayuda="Clave del fabricante o del cliente."><Input className="font-mono" value={f.codigoAlterno} onChange={cambiar('codigoAlterno')} /></Campo>
        <Campo etiqueta="Presentación"><Input value={f.presentacion} onChange={cambiar('presentacion')} placeholder="Caja con 12, bote 1 L…" /></Campo>
        <Campo etiqueta="Unidad"><Input value={f.unidadMedida} onChange={cambiar('unidadMedida')} placeholder="Pieza, caja, kg, hora…" /></Campo>
        <Campo etiqueta="Descripción" className="sm:col-span-2"><Textarea rows={2} value={f.descripcion} onChange={cambiar('descripcion')} /></Campo>

        <Seccion titulo="Precios (MXN, sin IVA)" />
        <Campo etiqueta="Costo (último de compra)" error={err('costo')}>
          <Input type="number" min="0" step="0.01" value={f.costo} onChange={cambiar('costo')} />
        </Campo>
        <Campo etiqueta="Precio *" error={err('precio')}
          ayuda={sugerido != null ? `Con el margen de ${categoria!.nombre} (${categoria!.margenPorcentaje} %): ${formatoMoneda(sugerido)}` : undefined}>
          <div className="flex gap-2">
            <Input type="number" min="0" step="0.01" value={f.precio} onChange={cambiar('precio')} required />
            {sugerido != null && Number(f.precio) !== sugerido && (
              <Boton tamano="sm" onClick={() => setF({ ...f, precio: sugerido.toString() })}>Usar</Boton>
            )}
          </div>
        </Campo>
        <Campo etiqueta="IVA" ayuda="0 % exentos o exportación, 8 % región fronteriza, 16 % general." className="sm:col-span-2">
          <Select value={f.tasaIva} onChange={cambiar('tasaIva')}>
            {!p && <option value="">El predeterminado de la empresa</option>}
            {TASAS_IVA.map((t) => <option key={t} value={t}>{etiquetaTasa(t)}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Precio de mayoreo" error={err('precioMayoreo')}>
          <Input type="number" min="0" step="0.01" value={f.precioMayoreo} onChange={cambiar('precioMayoreo')} />
        </Campo>
        <Campo etiqueta="Mayoreo desde (unidades)" ayuda="Se propone en cotizaciones desde esta cantidad." error={err('cantidadMayoreo')}>
          <Input type="number" min="2" step="1" value={f.cantidadMayoreo} onChange={cambiar('cantidadMayoreo')} />
        </Campo>

        <Seccion titulo="Inventario y proveedores" />
        {f.tipo === 'Producto' && (
          <>
            <Campo etiqueta="Stock mínimo" ayuda="Debajo de esto aparece en Pedido de faltantes." error={err('stockMinimo')}>
              <Input type="number" min="0" step="1" value={f.stockMinimo} onChange={cambiar('stockMinimo')} />
            </Campo>
            <Campo etiqueta="Ubicación en almacén"><Input value={f.ubicacion} onChange={cambiar('ubicacion')} placeholder="Pasillo 3, anaquel B" /></Campo>
          </>
        )}
        <Campo etiqueta="Proveedor principal" className="sm:col-span-2" ayuda="Se usa al pedir faltantes.">
          <Select value={f.proveedorId} onChange={cambiar('proveedorId')}>
            <option value="">—</option>
            {proveedores.map((x) => <option key={x.id} value={x.id}>{x.razonSocial}</option>)}
          </Select>
        </Campo>
        <div className="space-y-2 sm:col-span-2">
          <p className="text-sm font-medium text-slate-700">Otros proveedores</p>
          {otros.map((x, i) => (
            <div key={i} className="grid grid-cols-[1fr_8rem_7rem_auto] items-center gap-2">
              <Select value={x.proveedorId} aria-label="Proveedor"
                onChange={(e) => setOtros(otros.map((y, j) => (j === i ? { ...y, proveedorId: e.target.value } : y)))}>
                <option value="">Selecciona…</option>
                {proveedores.filter((pr) => pr.id.toString() !== f.proveedorId).map((pr) => <option key={pr.id} value={pr.id}>{pr.razonSocial}</option>)}
              </Select>
              <Input placeholder="Su código" value={x.codigoProveedor} aria-label="Código del proveedor"
                onChange={(e) => setOtros(otros.map((y, j) => (j === i ? { ...y, codigoProveedor: e.target.value } : y)))} />
              <Input type="number" min="0" step="0.01" placeholder="Costo" value={x.costo} aria-label="Costo"
                onChange={(e) => setOtros(otros.map((y, j) => (j === i ? { ...y, costo: e.target.value } : y)))} />
              <BotonIcono icono="basura" etiqueta="Quitar proveedor" peligro onClick={() => setOtros(otros.filter((_, j) => j !== i))} />
            </div>
          ))}
          <Boton tamano="sm" icono="mas" onClick={() => setOtros([...otros, { proveedorId: '', codigoProveedor: '', costo: '' }])}>Agregar proveedor</Boton>
        </div>

        <Seccion titulo="Imagen" />
        <div className="flex items-center gap-4 sm:col-span-2">
          <div className={cn('flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50',
            !vistaImagen && 'text-xs text-slate-500')}>
            {vistaImagen ? <img src={vistaImagen} alt="" className="h-full w-full object-contain" /> : 'Sin imagen'}
          </div>
          <div className="space-y-2">
            <label className="inline-block cursor-pointer rounded-lg border border-slate-200 bg-superficie px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-marca-50">
              Elegir imagen
              <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => elegirImagen(e.target.files?.[0])} />
            </label>
            {vistaImagen && <Boton tamano="sm" variante="fantasma" onClick={() => setImagen(null)}>Quitar</Boton>}
            <p className="text-xs text-slate-500">PNG o JPEG, máximo 300 KB.</p>
          </div>
        </div>

        {p && <Checkbox className="sm:col-span-2" etiqueta="Activo" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />}
        <div className="sm:col-span-2"><PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} /></div>
      </form>
    </Modal>
  )
}
