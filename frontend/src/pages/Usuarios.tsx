import { useState, type FormEvent } from 'react'
import { useDesbloquearUsuario, useEmpleados, useGuardarUsuario, useRestablecerPassword, useRoles, useUsuarios } from '../api/hooks'
import type { Usuario } from '../api/tipos'
import {
  Boton, BotonIcono, Campo, Cargando, Celda, CeldaAcciones, Checkbox, Doble, Encabezado, errorDeCampo, Fila, Input,
  Insignia, MensajeError, Modal, numeroONulo, PieFormulario, Select, Tabla, Tarjeta, useConfirmar, Vacio,
} from '../components/ui'
import { formatoFechaHora } from '../lib/formato'
import { SiPuede, useSesion } from '../sesion/Sesion'

const AYUDA_PASSWORD = 'Mínimo 8 caracteres, con mayúscula, minúscula y número.'

export default function Usuarios() {
  const { usuario: yo } = useSesion()
  const confirmar = useConfirmar()
  const { data, isLoading, error } = useUsuarios()
  const desbloquear = useDesbloquearUsuario()
  const [editando, setEditando] = useState<Usuario | 'nuevo' | null>(null)
  const [restableciendo, setRestableciendo] = useState<Usuario | null>(null)

  const desbloquearUsuario = async (u: Usuario) => {
    if (await confirmar({ titulo: 'Desbloquear usuario', mensaje: <>¿Permitir que <b>{u.nombre}</b> vuelva a intentar iniciar sesión?</>, textoConfirmar: 'Desbloquear' }))
      desbloquear.mutate(u.id)
  }

  return (
    <>
      <Encabezado titulo="Usuarios" descripcion="Personas que pueden entrar al sistema y el rol que tienen."
        acciones={<SiPuede permiso="usuarios.editar"><Boton variante="primario" icono="mas" onClick={() => setEditando('nuevo')}>Nuevo usuario</Boton></SiPuede>} />

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay usuarios." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Usuario' }, { titulo: 'Rol' }, { titulo: 'Empleado' }, { titulo: 'Estado' }, { titulo: 'Último acceso' }, { titulo: '' }]}>
          {data.map((u) => (
            <Fila key={u.id} inactiva={!u.activo}>
              <Celda><Doble principal={<>{u.nombre}{u.id === yo?.usuarioId && <span className="ml-2 text-xs font-normal text-slate-500">(tú)</span>}</>} secundario={u.correo} /></Celda>
              <Celda className="text-slate-600">{u.rol}</Celda>
              <Celda className="text-slate-600">{u.empleado ?? '—'}</Celda>
              <Celda>
                {!u.activo ? <Insignia>Inactivo</Insignia> : u.bloqueado ? <Insignia tono="ambar">Bloqueado</Insignia> : <Insignia tono="verde">Activo</Insignia>}
              </Celda>
              <Celda className="whitespace-nowrap text-slate-600">{u.ultimoAcceso ? formatoFechaHora(u.ultimoAcceso) : 'Nunca'}</Celda>
              <CeldaAcciones>
                <SiPuede permiso="usuarios.editar">
                  {u.bloqueado && <BotonIcono icono="candado" etiqueta="Desbloquear" onClick={() => desbloquearUsuario(u)} />}
                  <BotonIcono icono="llave" etiqueta="Restablecer contraseña" onClick={() => setRestableciendo(u)} />
                  <BotonIcono icono="editar" etiqueta="Editar" onClick={() => setEditando(u)} />
                </SiPuede>
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}

      {editando && <FormUsuario usuario={editando === 'nuevo' ? undefined : editando} esUnoMismo={editando !== 'nuevo' && editando.id === yo?.usuarioId} onCerrar={() => setEditando(null)} />}
      {restableciendo && <FormRestablecer usuario={restableciendo} onCerrar={() => setRestableciendo(null)} />}
    </>
  )
}

function FormUsuario({ usuario, esUnoMismo, onCerrar }: { usuario?: Usuario; esUnoMismo: boolean; onCerrar: () => void }) {
  const guardar = useGuardarUsuario()
  const roles = useRoles()
  const empleados = useEmpleados()
  const [f, setF] = useState({
    nombre: usuario?.nombre ?? '', correo: usuario?.correo ?? '', rolId: usuario?.rolId.toString() ?? '',
    empleadoId: usuario?.empleadoId?.toString() ?? '', activo: usuario?.activo ?? true, password: '',
  })
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (c: string) => errorDeCampo(guardar.error, c)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({
      id: usuario?.id,
      datos: {
        nombre: f.nombre, correo: f.correo, rolId: Number(f.rolId), empleadoId: numeroONulo(f.empleadoId),
        activo: f.activo, password: usuario ? null : f.password,
      },
    }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo={usuario ? 'Editar usuario' : 'Nuevo usuario'} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre *" className="sm:col-span-2" error={err('nombre')}>
          <Input value={f.nombre} onChange={cambiar('nombre')} required autoFocus />
        </Campo>
        <Campo etiqueta="Correo (para iniciar sesión) *" className="sm:col-span-2" error={err('correo')}>
          <Input type="email" autoComplete="off" value={f.correo} onChange={cambiar('correo')} required />
        </Campo>
        <Campo etiqueta="Rol *" error={err('rolId')}>
          <Select value={f.rolId} onChange={cambiar('rolId')} required disabled={esUnoMismo}>
            <option value="">Selecciona…</option>
            {roles.data?.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Empleado vinculado" ayuda="Para sugerirlo en citas y bitácora.">
          <Select value={f.empleadoId} onChange={cambiar('empleadoId')}>
            <option value="">—</option>
            {empleados.data?.map((e) => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
          </Select>
        </Campo>
        {!usuario && (
          <Campo etiqueta="Contraseña inicial *" className="sm:col-span-2" ayuda={AYUDA_PASSWORD}>
            <Input type="password" autoComplete="new-password" minLength={8} value={f.password} onChange={cambiar('password')} required />
          </Campo>
        )}
        {usuario && !esUnoMismo && (
          <Checkbox className="sm:col-span-2" etiqueta="Activo (puede iniciar sesión)" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />
        )}
        {esUnoMismo && <p className="text-xs text-slate-500 sm:col-span-2">No puedes cambiar tu propio rol ni desactivarte.</p>}
        <div className="sm:col-span-2"><PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} /></div>
      </form>
    </Modal>
  )
}

function FormRestablecer({ usuario, onCerrar }: { usuario: Usuario; onCerrar: () => void }) {
  const restablecer = useRestablecerPassword()
  const [password, setPassword] = useState('')

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    restablecer.mutate({ id: usuario.id, passwordNueva: password }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo="Restablecer contraseña" onCerrar={onCerrar} ancho="max-w-md">
      <form onSubmit={enviar} className="space-y-4">
        <p className="text-sm text-slate-600">Asigna una contraseña nueva a <b>{usuario.nombre}</b>. Compártela por un medio seguro y pídele que la cambie al entrar.</p>
        <Campo etiqueta="Contraseña nueva" ayuda={AYUDA_PASSWORD}>
          <Input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
        </Campo>
        <PieFormulario error={restablecer.error} guardando={restablecer.isPending} onCancelar={onCerrar} textoGuardar="Restablecer" />
      </form>
    </Modal>
  )
}
