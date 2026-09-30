import { useState, type FormEvent } from 'react'
import { useClientes, useDesactivarCliente, useGuardarCliente } from '../api/hooks'
import type { Cliente } from '../api/tipos'
import {
  BarraFiltros, Boton, BotonIcono, Buscador, Campo, Cargando, Celda, CeldaAcciones, Checkbox, Doble, Encabezado,
  errorDeCampo, Fila, Input, Insignia, MensajeError, Modal, nulo, PieFormulario, Tabla, Tarjeta, Textarea,
  useConfirmar, Vacio,
} from '../components/ui'
import { SiPuede } from '../sesion/Sesion'

export default function Clientes() {
  const confirmar = useConfirmar()
  const [buscar, setBuscar] = useState('')
  const [inactivos, setInactivos] = useState(false)
  const [editando, setEditando] = useState<Cliente | 'nuevo' | null>(null)
  const { data, isLoading, error } = useClientes(buscar, inactivos)
  const desactivar = useDesactivarCliente()

  const darDeBaja = async (c: Cliente) => {
    if (await confirmar({ titulo: 'Dar de baja cliente', mensaje: <>¿Dar de baja a <b>{c.razonSocial}</b>?</>, textoConfirmar: 'Dar de baja', peligro: true }))
      desactivar.mutate(c.id)
  }

  return (
    <>
      <Encabezado titulo="Clientes" descripcion="Empresas y personas que ya compraron."
        acciones={<SiPuede permiso="clientes.editar"><Boton variante="primario" icono="mas" onClick={() => setEditando('nuevo')}>Nuevo cliente</Boton></SiPuede>} />

      <BarraFiltros>
        <Buscador placeholder="Buscar por razón social, RFC o contacto…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <Checkbox etiqueta="Mostrar inactivos" checked={inactivos} onChange={(e) => setInactivos(e.target.checked)} />
      </BarraFiltros>

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay clientes." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Razón social' }, { titulo: 'RFC' }, { titulo: 'Contacto' }, { titulo: 'Teléfono / correo' }, { titulo: '' }]}>
          {data.map((c) => (
            <Fila key={c.id} inactiva={!c.activo}>
              <Celda>
                <Doble principal={c.razonSocial} secundario={c.nombreComercial} />
                {!c.activo && <Insignia className="mt-1">Inactivo</Insignia>}
              </Celda>
              <Celda className="font-mono text-xs">{c.rfc ?? '—'}</Celda>
              <Celda className="text-slate-600">{c.contactoPrincipal ?? '—'}</Celda>
              <Celda className="text-slate-600"><p>{c.telefono ?? '—'}</p><p className="text-xs text-slate-500">{c.correo}</p></Celda>
              <CeldaAcciones>
                <SiPuede permiso="clientes.editar"><BotonIcono icono="editar" etiqueta="Editar" onClick={() => setEditando(c)} /></SiPuede>
                {c.activo && <SiPuede permiso="clientes.eliminar"><BotonIcono icono="basura" etiqueta="Dar de baja" peligro onClick={() => darDeBaja(c)} /></SiPuede>}
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}

      {editando && <FormCliente cliente={editando === 'nuevo' ? undefined : editando} onCerrar={() => setEditando(null)} />}
    </>
  )
}

function FormCliente({ cliente, onCerrar }: { cliente?: Cliente; onCerrar: () => void }) {
  const guardar = useGuardarCliente()
  const [f, setF] = useState({
    razonSocial: cliente?.razonSocial ?? '', nombreComercial: cliente?.nombreComercial ?? '', rfc: cliente?.rfc ?? '',
    contactoPrincipal: cliente?.contactoPrincipal ?? '', telefono: cliente?.telefono ?? '', correo: cliente?.correo ?? '',
    direccion: cliente?.direccion ?? '', activo: cliente?.activo ?? true,
  })
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (c: string) => errorDeCampo(guardar.error, c)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({
      id: cliente?.id,
      datos: {
        razonSocial: f.razonSocial, nombreComercial: nulo(f.nombreComercial), rfc: nulo(f.rfc.toUpperCase()),
        contactoPrincipal: nulo(f.contactoPrincipal), telefono: nulo(f.telefono), correo: nulo(f.correo),
        direccion: nulo(f.direccion), activo: f.activo,
      },
    }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo={cliente ? 'Editar cliente' : 'Nuevo cliente'} onCerrar={onCerrar} ancho="max-w-2xl">
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Razón social *" className="sm:col-span-2" error={err('razonSocial')}>
          <Input value={f.razonSocial} onChange={cambiar('razonSocial')} required autoFocus />
        </Campo>
        <Campo etiqueta="Nombre comercial"><Input value={f.nombreComercial} onChange={cambiar('nombreComercial')} /></Campo>
        <Campo etiqueta="RFC" error={err('rfc')}>
          <Input className="font-mono uppercase" maxLength={13} value={f.rfc} onChange={cambiar('rfc')} />
        </Campo>
        <Campo etiqueta="Contacto principal"><Input value={f.contactoPrincipal} onChange={cambiar('contactoPrincipal')} /></Campo>
        <Campo etiqueta="Teléfono" error={err('telefono')}><Input type="tel" value={f.telefono} onChange={cambiar('telefono')} /></Campo>
        <Campo etiqueta="Correo" className="sm:col-span-2" error={err('correo')}><Input type="email" value={f.correo} onChange={cambiar('correo')} /></Campo>
        <Campo etiqueta="Dirección" className="sm:col-span-2"><Textarea rows={2} value={f.direccion} onChange={cambiar('direccion')} /></Campo>
        {cliente && <Checkbox className="sm:col-span-2" etiqueta="Activo" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />}
        <div className="sm:col-span-2"><PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} /></div>
      </form>
    </Modal>
  )
}
