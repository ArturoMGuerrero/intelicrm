import { useState, type FormEvent } from 'react'
import {
  useAlmacenes, useDesactivarAlmacen, useDesactivarSucursal, useGuardarAlmacen, useGuardarSucursal, useSucursales,
} from '../api/hooks'
import type { Almacen, Sucursal } from '../api/tipos'
import {
  BarraFiltros, Boton, BotonIcono, Campo, Cargando, Celda, CeldaAcciones, Checkbox, Doble, Encabezado, errorDeCampo,
  Fila, Input, Insignia, MensajeError, Modal, nulo, PieFormulario, Segmentos, Select, Tabla, Tarjeta, Textarea,
  useConfirmar, Vacio,
} from '../components/ui'
import { SiPuede } from '../sesion/Sesion'

type Vista = 'sucursales' | 'almacenes'

/** Sucursales de la empresa y sus almacenes (permiso "sucursales"). */
export default function Sucursales() {
  const [vista, setVista] = useState<Vista>('sucursales')
  const [inactivos, setInactivos] = useState(false)
  const [editandoSucursal, setEditandoSucursal] = useState<Sucursal | 'nueva' | null>(null)
  const [editandoAlmacen, setEditandoAlmacen] = useState<Almacen | 'nuevo' | null>(null)

  return (
    <>
      <Encabezado titulo="Sucursales y almacenes" descripcion="Ubicaciones físicas de la empresa y dónde se guarda la mercancía."
        acciones={
          <SiPuede permiso="sucursales.editar">
            {vista === 'sucursales'
              ? <Boton variante="primario" icono="mas" onClick={() => setEditandoSucursal('nueva')}>Nueva sucursal</Boton>
              : <Boton variante="primario" icono="mas" onClick={() => setEditandoAlmacen('nuevo')}>Nuevo almacén</Boton>}
          </SiPuede>
        } />

      <BarraFiltros>
        <Segmentos etiqueta="Vista" valor={vista} onCambiar={setVista}
          opciones={[{ valor: 'sucursales', texto: 'Sucursales' }, { valor: 'almacenes', texto: 'Almacenes' }]} />
        <Checkbox etiqueta="Mostrar inactivos" checked={inactivos} onChange={(e) => setInactivos(e.target.checked)} />
      </BarraFiltros>

      {vista === 'sucursales'
        ? <ListaSucursales inactivos={inactivos} onEditar={setEditandoSucursal} />
        : <ListaAlmacenes inactivos={inactivos} onEditar={setEditandoAlmacen} />}

      {editandoSucursal && (
        <FormSucursal sucursal={editandoSucursal === 'nueva' ? undefined : editandoSucursal} onCerrar={() => setEditandoSucursal(null)} />
      )}
      {editandoAlmacen && (
        <FormAlmacen almacen={editandoAlmacen === 'nuevo' ? undefined : editandoAlmacen} onCerrar={() => setEditandoAlmacen(null)} />
      )}
    </>
  )
}

function ListaSucursales({ inactivos, onEditar }: { inactivos: boolean; onEditar: (s: Sucursal) => void }) {
  const confirmar = useConfirmar()
  const { data, isLoading, error } = useSucursales(inactivos)
  const desactivar = useDesactivarSucursal()

  const darDeBaja = async (s: Sucursal) => {
    if (await confirmar({ titulo: 'Dar de baja sucursal', mensaje: <>¿Dar de baja <b>{s.nombre}</b>?</>, textoConfirmar: 'Dar de baja', peligro: true }))
      desactivar.mutate(s.id)
  }

  if (isLoading) return <Cargando />
  return (
    <>
      <MensajeError error={error} />
      {!data?.length ? <Tarjeta><Vacio mensaje="No hay sucursales." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Sucursal' }, { titulo: 'Teléfono' }, { titulo: 'Almacenes', derecha: true }, { titulo: '' }]}>
          {data.map((s) => (
            <Fila key={s.id} inactiva={!s.activo}>
              <Celda>
                <Doble principal={s.nombre} secundario={[s.direccion, s.codigoPostal && `C.P. ${s.codigoPostal}`].filter(Boolean).join(' · ') || null} />
                {!s.activo && <Insignia className="mt-1">Inactiva</Insignia>}
              </Celda>
              <Celda className="text-slate-600">{s.telefono ?? '—'}</Celda>
              <Celda derecha className="text-slate-600 tabular-nums">{s.almacenes}</Celda>
              <CeldaAcciones>
                <SiPuede permiso="sucursales.editar"><BotonIcono icono="editar" etiqueta="Editar" onClick={() => onEditar(s)} /></SiPuede>
                {s.activo && <SiPuede permiso="sucursales.eliminar"><BotonIcono icono="basura" etiqueta="Dar de baja" peligro onClick={() => darDeBaja(s)} /></SiPuede>}
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}
    </>
  )
}

function ListaAlmacenes({ inactivos, onEditar }: { inactivos: boolean; onEditar: (a: Almacen) => void }) {
  const confirmar = useConfirmar()
  const { data, isLoading, error } = useAlmacenes(inactivos)
  const desactivar = useDesactivarAlmacen()

  const darDeBaja = async (a: Almacen) => {
    if (await confirmar({ titulo: 'Dar de baja almacén', mensaje: <>¿Dar de baja <b>{a.nombre}</b>?</>, textoConfirmar: 'Dar de baja', peligro: true }))
      desactivar.mutate(a.id)
  }

  if (isLoading) return <Cargando />
  return (
    <>
      <MensajeError error={error} />
      {!data?.length ? <Tarjeta><Vacio mensaje="No hay almacenes." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Almacén' }, { titulo: 'Sucursal' }, { titulo: 'Ubicación' }, { titulo: '' }]}>
          {data.map((a) => (
            <Fila key={a.id} inactiva={!a.activo}>
              <Celda className="font-medium text-slate-900">
                {a.nombre} {!a.activo && <Insignia className="ml-2">Inactivo</Insignia>}
              </Celda>
              <Celda className="text-slate-600">{a.sucursal}</Celda>
              <Celda className="text-slate-600">{a.ubicacion ?? '—'}</Celda>
              <CeldaAcciones>
                <SiPuede permiso="sucursales.editar"><BotonIcono icono="editar" etiqueta="Editar" onClick={() => onEditar(a)} /></SiPuede>
                {a.activo && <SiPuede permiso="sucursales.eliminar"><BotonIcono icono="basura" etiqueta="Dar de baja" peligro onClick={() => darDeBaja(a)} /></SiPuede>}
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}
    </>
  )
}

function FormSucursal({ sucursal: s, onCerrar }: { sucursal?: Sucursal; onCerrar: () => void }) {
  const guardar = useGuardarSucursal()
  const [f, setF] = useState({
    nombre: s?.nombre ?? '', telefono: s?.telefono ?? '', direccion: s?.direccion ?? '',
    codigoPostal: s?.codigoPostal ?? '', activo: s?.activo ?? true,
  })
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (c: string) => errorDeCampo(guardar.error, c)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({
      id: s?.id,
      datos: {
        nombre: f.nombre, telefono: nulo(f.telefono), direccion: nulo(f.direccion),
        codigoPostal: nulo(f.codigoPostal), activo: f.activo,
      },
    }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo={s ? 'Editar sucursal' : 'Nueva sucursal'} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre *" className="sm:col-span-2" error={err('nombre')}>
          <Input value={f.nombre} onChange={cambiar('nombre')} required autoFocus />
        </Campo>
        <Campo etiqueta="Teléfono" error={err('telefono')}><Input type="tel" value={f.telefono} onChange={cambiar('telefono')} /></Campo>
        <Campo etiqueta="Código postal" error={err('codigoPostal')}>
          <Input inputMode="numeric" maxLength={5} value={f.codigoPostal} onChange={cambiar('codigoPostal')} />
        </Campo>
        <Campo etiqueta="Dirección" className="sm:col-span-2"><Textarea rows={2} value={f.direccion} onChange={cambiar('direccion')} /></Campo>
        {s && <Checkbox className="sm:col-span-2" etiqueta="Activa" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />}
        <div className="sm:col-span-2"><PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} /></div>
      </form>
    </Modal>
  )
}

function FormAlmacen({ almacen: a, onCerrar }: { almacen?: Almacen; onCerrar: () => void }) {
  const guardar = useGuardarAlmacen()
  const sucursales = useSucursales().data ?? []
  const [f, setF] = useState({
    nombre: a?.nombre ?? '', ubicacion: a?.ubicacion ?? '', sucursalId: a?.sucursalId?.toString() ?? '', activo: a?.activo ?? true,
  })
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (c: string) => errorDeCampo(guardar.error, c)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({
      id: a?.id,
      datos: { nombre: f.nombre, ubicacion: nulo(f.ubicacion), sucursalId: Number(f.sucursalId), activo: f.activo },
    }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo={a ? 'Editar almacén' : 'Nuevo almacén'} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Sucursal *" error={err('sucursalId')}>
          <Select value={f.sucursalId} onChange={cambiar('sucursalId')} required>
            <option value="">Selecciona…</option>
            {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Nombre *" error={err('nombre')}>
          <Input value={f.nombre} onChange={cambiar('nombre')} required autoFocus />
        </Campo>
        <Campo etiqueta="Ubicación" ayuda="Piso, bodega, anaquel…"><Input value={f.ubicacion} onChange={cambiar('ubicacion')} /></Campo>
        {a && <Checkbox etiqueta="Activo" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />}
        <PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} />
      </form>
    </Modal>
  )
}
