import { useState, type FormEvent } from 'react'
import { useCatalogo, useDesactivarEmpleado, useEmpleados, useGuardarEmpleado } from '../api/hooks'
import type { Empleado } from '../api/tipos'
import {
  BarraFiltros, Boton, BotonIcono, Campo, Cargando, Celda, CeldaAcciones, Checkbox, Encabezado, errorDeCampo, Fila,
  Input, Insignia, MensajeError, Modal, nulo, numeroONulo, PieFormulario, Select, Tabla, Tarjeta, useConfirmar, Vacio,
} from '../components/ui'
import { SiPuede } from '../sesion/Sesion'

export default function Empleados() {
  const confirmar = useConfirmar()
  const [inactivos, setInactivos] = useState(false)
  const [editando, setEditando] = useState<Empleado | 'nuevo' | null>(null)
  const { data, isLoading, error } = useEmpleados(inactivos)
  const desactivar = useDesactivarEmpleado()

  const darDeBaja = async (e: Empleado) => {
    if (await confirmar({ titulo: 'Dar de baja empleado', mensaje: <>¿Dar de baja a <b>{e.nombreCompleto}</b>?</>, textoConfirmar: 'Dar de baja', peligro: true }))
      desactivar.mutate(e.id)
  }

  return (
    <>
      <Encabezado titulo="Empleados" descripcion="Ejecutivos que atienden prospectos y agendan citas."
        acciones={<SiPuede permiso="empleados.editar"><Boton variante="primario" icono="mas" onClick={() => setEditando('nuevo')}>Nuevo empleado</Boton></SiPuede>} />

      <BarraFiltros>
        <Checkbox etiqueta="Mostrar inactivos" checked={inactivos} onChange={(e) => setInactivos(e.target.checked)} />
      </BarraFiltros>

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay empleados." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Nombre' }, { titulo: 'Puesto' }, { titulo: 'Unidad de negocio' }, { titulo: 'Contacto' }, { titulo: '' }]}>
          {data.map((e) => (
            <Fila key={e.id} inactiva={!e.activo}>
              <Celda>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: e.colorAgenda }} title="Color en la agenda" />
                  <span className="font-medium text-slate-900">{e.nombreCompleto}</span>
                  {!e.activo && <Insignia>Inactivo</Insignia>}
                </div>
              </Celda>
              <Celda className="text-slate-600">{e.puesto ?? '—'}</Celda>
              <Celda className="text-slate-600">{e.unidadNegocio ?? '—'}</Celda>
              <Celda className="text-slate-600"><p>{e.correo ?? '—'}</p><p className="text-xs text-slate-500">{e.telefono}</p></Celda>
              <CeldaAcciones>
                <SiPuede permiso="empleados.editar"><BotonIcono icono="editar" etiqueta="Editar" onClick={() => setEditando(e)} /></SiPuede>
                {e.activo && <SiPuede permiso="empleados.eliminar"><BotonIcono icono="basura" etiqueta="Dar de baja" peligro onClick={() => darDeBaja(e)} /></SiPuede>}
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}

      {editando && <FormEmpleado empleado={editando === 'nuevo' ? undefined : editando} onCerrar={() => setEditando(null)} />}
    </>
  )
}

function FormEmpleado({ empleado, onCerrar }: { empleado?: Empleado; onCerrar: () => void }) {
  const guardar = useGuardarEmpleado()
  const puestos = useCatalogo('puestos')
  const unidades = useCatalogo('unidades-negocio')
  const [f, setF] = useState({
    nombre: empleado?.nombre ?? '', apellidos: empleado?.apellidos ?? '', telefono: empleado?.telefono ?? '',
    correo: empleado?.correo ?? '', puestoId: empleado?.puestoId?.toString() ?? '',
    unidadNegocioId: empleado?.unidadNegocioId?.toString() ?? '', colorAgenda: empleado?.colorAgenda ?? '#3b82f6',
    activo: empleado?.activo ?? true,
  })
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (c: string) => errorDeCampo(guardar.error, c)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({
      id: empleado?.id,
      datos: {
        nombre: f.nombre, apellidos: f.apellidos, telefono: nulo(f.telefono), correo: nulo(f.correo),
        puestoId: numeroONulo(f.puestoId), unidadNegocioId: numeroONulo(f.unidadNegocioId),
        colorAgenda: f.colorAgenda, activo: f.activo,
      },
    }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo={empleado ? 'Editar empleado' : 'Nuevo empleado'} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre *" error={err('nombre')}><Input value={f.nombre} onChange={cambiar('nombre')} required autoFocus /></Campo>
        <Campo etiqueta="Apellidos *" error={err('apellidos')}><Input value={f.apellidos} onChange={cambiar('apellidos')} required /></Campo>
        <Campo etiqueta="Teléfono" error={err('telefono')}><Input type="tel" value={f.telefono} onChange={cambiar('telefono')} /></Campo>
        <Campo etiqueta="Correo" error={err('correo')}><Input type="email" value={f.correo} onChange={cambiar('correo')} /></Campo>
        <Campo etiqueta="Puesto">
          <Select value={f.puestoId} onChange={cambiar('puestoId')}>
            <option value="">—</option>
            {puestos.data?.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Unidad de negocio">
          <Select value={f.unidadNegocioId} onChange={cambiar('unidadNegocioId')}>
            <option value="">—</option>
            {unidades.data?.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Color en la agenda">
          <input className="h-10 w-20 cursor-pointer rounded-lg border border-slate-300" type="color" value={f.colorAgenda} onChange={cambiar('colorAgenda')} />
        </Campo>
        {empleado && <Checkbox className="self-end pb-2" etiqueta="Activo" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />}
        <div className="sm:col-span-2"><PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} /></div>
      </form>
    </Modal>
  )
}
