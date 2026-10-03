import { useState, type FormEvent } from 'react'
import { useAjustarInventario, useAlmacenes, useExistencias, useKardex, useProductos, useTraspasar } from '../api/hooks'
import type { Existencia, TipoMovimientoInventario } from '../api/tipos'
import {
  BarraFiltros, Boton, BotonIcono, Buscador, Campo, Cargando, Celda, CeldaAcciones, Checkbox, cn, Doble, Encabezado,
  errorDeCampo, Fila, Input, Insignia, MensajeError, Modal, nulo, PieFormulario, Segmentos, Select, Tabla, Tarjeta,
  Vacio, type Tono,
} from '../components/ui'
import { formatoFechaHora, formatoMoneda } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'

const etiquetaMovimiento: Record<TipoMovimientoInventario, [string, Tono]> = {
  EntradaCompra: ['Compra', 'verde'],
  SalidaVenta: ['Venta', 'cielo'],
  AjusteEntrada: ['Ajuste +', 'ambar'],
  AjusteSalida: ['Ajuste −', 'ambar'],
  TraspasoEntrada: ['Traspaso entra', 'indigo'],
  TraspasoSalida: ['Traspaso sale', 'indigo'],
  CancelacionVenta: ['Cancelación', 'gris'],
}

const cantidad = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 2 })

/** Existencias por almacén y kárdex (antes "Existencias", "Kárdex" y "Modificar existencias"). */
export default function Inventario() {
  const [vista, setVista] = useState<'existencias' | 'kardex'>('existencias')
  const [kardexDe, setKardexDe] = useState<number | undefined>()

  return (
    <>
      <Encabezado titulo="Inventario" descripcion="Existencias por almacén, movimientos y ajustes por conteo físico." />
      <div className="mb-4">
        <Segmentos etiqueta="Vista" valor={vista} onCambiar={setVista}
          opciones={[{ valor: 'existencias', texto: 'Existencias' }, { valor: 'kardex', texto: 'Kárdex' }]} />
      </div>
      {vista === 'existencias'
        ? <Existencias onVerKardex={(id) => { setKardexDe(id); setVista('kardex') }} />
        : <Kardex productoInicial={kardexDe} />}
    </>
  )
}

function Existencias({ onVerKardex }: { onVerKardex: (productoId: number) => void }) {
  const { puede } = useSesion()
  const almacenes = useAlmacenes().data ?? []
  const [almacenId, setAlmacenId] = useState('')
  const [buscar, setBuscar] = useState('')
  const [bajoMinimo, setBajoMinimo] = useState(false)
  const [accion, setAccion] = useState<{ tipo: 'ajuste' | 'traspaso'; existencia: Existencia } | null>(null)
  const { data, isLoading, error } = useExistencias({ almacenId: almacenId ? Number(almacenId) : undefined, buscar, soloBajoMinimo: bajoMinimo })
  const valorTotal = data?.reduce((s, e) => s + e.valor, 0) ?? 0
  const porAlmacen = !!almacenId

  return (
    <>
      <BarraFiltros>
        <Select className="md:w-64" value={almacenId} onChange={(e) => setAlmacenId(e.target.value)} aria-label="Almacén">
          <option value="">Todos los almacenes</option>
          {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.sucursal})</option>)}
        </Select>
        <Buscador placeholder="Buscar producto o código…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <Checkbox etiqueta="Solo debajo del mínimo" checked={bajoMinimo} onChange={(e) => setBajoMinimo(e.target.checked)} />
      </BarraFiltros>
      {!porAlmacen && <p className="mb-3 text-xs text-slate-500">Elige un almacén para ajustar o traspasar existencias.</p>}

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay productos con inventario. Los servicios no llevan existencias." /></Tarjeta> : (
        <Tabla columnas={[
          { titulo: 'Producto' }, { titulo: 'Existencia', derecha: true }, { titulo: 'Mínimo', derecha: true },
          { titulo: 'Costo prom.', derecha: true }, { titulo: 'Valor', derecha: true }, { titulo: '' },
        ]} pie={
          <tr><Celda colSpan={4} className="text-right font-medium text-slate-500">Valor del inventario</Celda>
            <Celda derecha className="font-semibold tabular-nums">{formatoMoneda(valorTotal)}</Celda><Celda /></tr>
        }>
          {data.map((e) => (
            <Fila key={e.productoId}>
              <Celda><Doble principal={e.producto} secundario={<span className="font-mono">{e.codigo}</span>} /></Celda>
              <Celda derecha className={cn('font-semibold tabular-nums', e.bajoMinimo && 'text-rose-600')}>
                {cantidad(e.cantidad)} {e.bajoMinimo && <Insignia tono="rojo" className="ml-1">Bajo</Insignia>}
              </Celda>
              <Celda derecha className="text-slate-500 tabular-nums">{e.stockMinimo != null ? cantidad(e.stockMinimo) : '—'}</Celda>
              <Celda derecha className="text-slate-600 tabular-nums">{formatoMoneda(e.costoPromedio)}</Celda>
              <Celda derecha className="tabular-nums">{formatoMoneda(e.valor)}</Celda>
              <CeldaAcciones>
                <BotonIcono icono="catalogo" etiqueta="Ver kárdex" onClick={() => onVerKardex(e.productoId)} />
                {porAlmacen && puede('inventario.editar') && (
                  <>
                    <BotonIcono icono="editar" etiqueta="Ajustar por conteo" onClick={() => setAccion({ tipo: 'ajuste', existencia: e })} />
                    <BotonIcono icono="derecha" etiqueta="Traspasar a otro almacén" onClick={() => setAccion({ tipo: 'traspaso', existencia: e })} />
                  </>
                )}
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}

      {accion?.tipo === 'ajuste' && <FormAjuste existencia={accion.existencia} onCerrar={() => setAccion(null)} />}
      {accion?.tipo === 'traspaso' && <FormTraspaso existencia={accion.existencia} onCerrar={() => setAccion(null)} />}
    </>
  )
}

function FormAjuste({ existencia: e, onCerrar }: { existencia: Existencia; onCerrar: () => void }) {
  const ajustar = useAjustarInventario()
  const [f, setF] = useState({ cantidadFisica: e.cantidad.toString(), costoUnitario: '', motivo: '' })
  const diferencia = (Number(f.cantidadFisica) || 0) - e.cantidad

  const enviar = (ev: FormEvent) => {
    ev.preventDefault()
    ajustar.mutate({
      productoId: e.productoId, almacenId: e.almacenId, cantidadFisica: Number(f.cantidadFisica),
      costoUnitario: f.costoUnitario === '' ? null : Number(f.costoUnitario), motivo: f.motivo,
    }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo={`Ajustar · ${e.producto}`} onCerrar={onCerrar} ancho="max-w-md">
      <form onSubmit={enviar} className="space-y-4">
        <div className="flex justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-500">En sistema ({e.almacen})</span><span className="font-semibold tabular-nums">{cantidad(e.cantidad)}</span>
        </div>
        <Campo etiqueta="Cantidad contada *" error={errorDeCampo(ajustar.error, 'cantidadFisica')}
          ayuda={diferencia ? `Se registrará ${diferencia > 0 ? 'una entrada' : 'una salida'} de ${cantidad(Math.abs(diferencia))}.` : 'Sin diferencia.'}>
          <Input type="number" min="0" step="any" value={f.cantidadFisica} onChange={(ev) => setF({ ...f, cantidadFisica: ev.target.value })} required autoFocus />
        </Campo>
        {diferencia > 0 && (
          <Campo etiqueta="Costo unitario de lo que entra" ayuda={`Vacío = costo promedio actual (${formatoMoneda(e.costoPromedio)}).`}>
            <Input type="number" min="0" step="0.01" value={f.costoUnitario} onChange={(ev) => setF({ ...f, costoUnitario: ev.target.value })} />
          </Campo>
        )}
        <Campo etiqueta="Motivo *" error={errorDeCampo(ajustar.error, 'motivo')}>
          <Input value={f.motivo} onChange={(ev) => setF({ ...f, motivo: ev.target.value })} placeholder="Conteo físico, merma, inventario inicial…" required />
        </Campo>
        <PieFormulario error={ajustar.error} guardando={ajustar.isPending} onCancelar={onCerrar} textoGuardar="Registrar ajuste" />
      </form>
    </Modal>
  )
}

function FormTraspaso({ existencia: e, onCerrar }: { existencia: Existencia; onCerrar: () => void }) {
  const traspasar = useTraspasar()
  const almacenes = (useAlmacenes().data ?? []).filter((a) => a.id !== e.almacenId)
  const [f, setF] = useState({ almacenDestinoId: '', cantidad: '', notas: '' })

  const enviar = (ev: FormEvent) => {
    ev.preventDefault()
    traspasar.mutate({
      productoId: e.productoId, almacenOrigenId: e.almacenId, almacenDestinoId: Number(f.almacenDestinoId),
      cantidad: Number(f.cantidad), notas: nulo(f.notas),
    }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo={`Traspasar · ${e.producto}`} onCerrar={onCerrar} ancho="max-w-md">
      <form onSubmit={enviar} className="space-y-4">
        <p className="text-sm text-slate-600">Desde <b>{e.almacen}</b>, donde hay {cantidad(e.cantidad)}.</p>
        {almacenes.length === 0 ? <p className="text-sm text-amber-700">No hay otro almacén activo. Créalo en Sucursales y almacenes.</p> : (
          <Campo etiqueta="Almacén destino *">
            <Select value={f.almacenDestinoId} onChange={(ev) => setF({ ...f, almacenDestinoId: ev.target.value })} required autoFocus>
              <option value="">Selecciona…</option>
              {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.sucursal})</option>)}
            </Select>
          </Campo>
        )}
        <Campo etiqueta="Cantidad *" error={errorDeCampo(traspasar.error, 'cantidad')}>
          <Input type="number" min="0.0001" max={e.cantidad} step="any" value={f.cantidad} onChange={(ev) => setF({ ...f, cantidad: ev.target.value })} required />
        </Campo>
        <Campo etiqueta="Notas"><Input value={f.notas} onChange={(ev) => setF({ ...f, notas: ev.target.value })} /></Campo>
        <PieFormulario error={traspasar.error} guardando={traspasar.isPending} onCancelar={onCerrar} textoGuardar="Traspasar" />
      </form>
    </Modal>
  )
}

function Kardex({ productoInicial }: { productoInicial?: number }) {
  const productos = (useProductos().data ?? []).filter((p) => p.tipo === 'Producto')
  const almacenes = useAlmacenes().data ?? []
  const [f, setF] = useState({ productoId: productoInicial?.toString() ?? '', almacenId: '', desde: '', hasta: '' })
  const { data, isLoading, error } = useKardex({
    productoId: f.productoId ? Number(f.productoId) : undefined, almacenId: f.almacenId ? Number(f.almacenId) : undefined,
    desde: f.desde || undefined, hasta: f.hasta || undefined,
  })

  return (
    <>
      <BarraFiltros>
        <Select className="md:w-72" value={f.productoId} onChange={(e) => setF({ ...f, productoId: e.target.value })} aria-label="Producto">
          <option value="">Todos los productos</option>
          {productos.map((p) => <option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>)}
        </Select>
        <Select className="md:w-56" value={f.almacenId} onChange={(e) => setF({ ...f, almacenId: e.target.value })} aria-label="Almacén">
          <option value="">Todos los almacenes</option>
          {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </Select>
        <Input className="md:w-40" type="date" value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} aria-label="Desde" />
        <Input className="md:w-40" type="date" value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} aria-label="Hasta" />
        {(f.productoId || f.almacenId || f.desde || f.hasta) && (
          <Boton variante="fantasma" onClick={() => setF({ productoId: '', almacenId: '', desde: '', hasta: '' })}>Limpiar</Boton>
        )}
      </BarraFiltros>

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="Sin movimientos con estos filtros." /></Tarjeta> : (
        <Tabla columnas={[
          { titulo: 'Fecha' }, { titulo: 'Producto' }, { titulo: 'Almacén' }, { titulo: 'Movimiento' },
          { titulo: 'Cantidad', derecha: true }, { titulo: 'Existencia', derecha: true }, { titulo: 'Costo', derecha: true }, { titulo: 'Referencia' },
        ]}>
          {data.map((m) => {
            const [texto, tono] = etiquetaMovimiento[m.tipo]
            return (
              <Fila key={m.id}>
                <Celda className="whitespace-nowrap text-slate-600 tabular-nums">{formatoFechaHora(m.fecha)}</Celda>
                <Celda>{m.producto}</Celda>
                <Celda className="text-slate-600">{m.almacen}</Celda>
                <Celda><Insignia tono={tono}>{texto}</Insignia></Celda>
                <Celda derecha className={cn('font-medium tabular-nums', m.cantidad < 0 ? 'text-rose-600' : 'text-emerald-700')}>
                  {m.cantidad > 0 ? '+' : ''}{cantidad(m.cantidad)}
                </Celda>
                <Celda derecha className="tabular-nums">{cantidad(m.existenciaNueva)}</Celda>
                <Celda derecha className="text-slate-600 tabular-nums">{formatoMoneda(m.costoUnitario)}</Celda>
                <Celda className="text-slate-600"><Doble principal={m.referencia ?? '—'} secundario={m.notas} /></Celda>
              </Fila>
            )
          })}
        </Tabla>
      )}
    </>
  )
}
