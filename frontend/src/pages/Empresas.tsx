import { useState, type FormEvent } from 'react'
import { useCambiarEstadoEmpresa, useCrearEmpresa, useEmpresasPlataforma } from '../api/hooks'
import type { EmpresaPlataforma } from '../api/tipos'
import {
  Aviso, Boton, Campo, Cargando, Celda, CeldaAcciones, Doble, Encabezado, errorDeCampo, Fila, Input, Insignia, MensajeError,
  Modal, PieFormulario, Tabla, Tarjeta, useConfirmar, Vacio,
} from '../components/ui'
import { formatoFecha, formatoFechaHora } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'

/**
 * Empresas de la plataforma (solo superadministradores): alta con su administrador, y suspensión.
 * Cada empresa está aislada; desde aquí no se ven sus clientes ni sus ventas.
 */
export default function Empresas() {
  const confirmar = useConfirmar()
  const { usuario } = useSesion()
  const { data, isLoading, error } = useEmpresasPlataforma()
  const cambiarEstado = useCambiarEstadoEmpresa()
  const [nueva, setNueva] = useState(false)

  const alternar = async (e: EmpresaPlataforma) => {
    const suspender = e.activa
    if (await confirmar({
      titulo: suspender ? 'Suspender empresa' : 'Reactivar empresa',
      mensaje: suspender
        ? <>Los usuarios de <b>{e.nombre}</b> no podrán entrar y se cerrarán sus sesiones abiertas. Sus datos se conservan.</>
        : <>Los usuarios de <b>{e.nombre}</b> podrán volver a entrar.</>,
      textoConfirmar: suspender ? 'Suspender' : 'Reactivar',
      peligro: suspender,
    }))
      cambiarEstado.mutate({ id: e.id, activa: !e.activa })
  }

  return (
    <>
      <Encabezado titulo="Empresas" descripcion="Alta y suspensión de las empresas que usan InteliCRM."
        acciones={<Boton variante="primario" icono="mas" onClick={() => setNueva(true)}>Nueva empresa</Boton>} />
      <div className="mb-4">
        <Aviso>Cada empresa está aislada: tiene sus propios usuarios, roles y datos. Desde aquí no se ven sus clientes ni sus ventas.</Aviso>
      </div>

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay empresas." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Empresa' }, { titulo: 'Administrador' }, { titulo: 'Usuarios', derecha: true },
          { titulo: 'Último acceso' }, { titulo: 'Estado' }, { titulo: '' }]}>
          {data.map((e) => (
            <Fila key={e.id} inactiva={!e.activa}>
              <Celda>
                <Doble principal={e.nombre} secundario={`Alta: ${formatoFecha(e.fechaCreacion)}`} />
                {e.id === usuario?.cuentaId && <Insignia tono="violeta" className="mt-1">Tu empresa</Insignia>}
              </Celda>
              <Celda><Doble principal={e.administrador ?? '—'} secundario={e.correoAdministrador} /></Celda>
              <Celda derecha className="tabular-nums">
                {e.usuariosActivos}<span className="text-slate-500"> / {e.usuarios}</span>
              </Celda>
              <Celda className="text-slate-600">{e.ultimoAcceso ? formatoFechaHora(e.ultimoAcceso) : 'Nunca'}</Celda>
              <Celda><Insignia tono={e.activa ? 'verde' : 'rojo'}>{e.activa ? 'Activa' : 'Suspendida'}</Insignia></Celda>
              <CeldaAcciones>
                {e.id !== usuario?.cuentaId && (
                  <Boton tamano="sm" variante={e.activa ? 'peligro' : 'secundario'} disabled={cambiarEstado.isPending} onClick={() => alternar(e)}>
                    {e.activa ? 'Suspender' : 'Reactivar'}
                  </Boton>
                )}
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}

      {nueva && <FormEmpresa onCerrar={() => setNueva(false)} />}
    </>
  )
}

function FormEmpresa({ onCerrar }: { onCerrar: () => void }) {
  const crear = useCrearEmpresa()
  const [f, setF] = useState({ empresa: '', nombreAdministrador: '', correoAdministrador: '', passwordAdministrador: '', confirmar: '' })
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (c: string) => errorDeCampo(crear.error, c)
  const noCoinciden = f.confirmar !== '' && f.confirmar !== f.passwordAdministrador

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (noCoinciden) return
    const { confirmar: _, ...datos } = f
    crear.mutate(datos, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo="Nueva empresa" onCerrar={onCerrar} ancho="max-w-lg">
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Nombre de la empresa *" error={err('empresa')}>
          <Input value={f.empresa} onChange={cambiar('empresa')} required autoFocus />
        </Campo>
        <p className="border-b border-slate-200 pb-1 text-xs font-semibold tracking-wider text-slate-500 uppercase">Su administrador</p>
        <Campo etiqueta="Nombre *" error={err('nombreAdministrador')}>
          <Input value={f.nombreAdministrador} onChange={cambiar('nombreAdministrador')} required />
        </Campo>
        <Campo etiqueta="Correo *" ayuda="Con este correo inicia sesión. Debe ser único en todo el sistema." error={err('correoAdministrador')}>
          <Input type="email" autoComplete="off" value={f.correoAdministrador} onChange={cambiar('correoAdministrador')} required />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Contraseña *" ayuda="Mínimo 8 caracteres, con mayúscula, minúscula y número." error={err('passwordAdministrador')}>
            <Input type="password" autoComplete="new-password" minLength={8} value={f.passwordAdministrador} onChange={cambiar('passwordAdministrador')} required />
          </Campo>
          <Campo etiqueta="Confirmar contraseña *" error={noCoinciden ? 'Las contraseñas no coinciden.' : undefined}>
            <Input type="password" autoComplete="new-password" value={f.confirmar} onChange={cambiar('confirmar')} required />
          </Campo>
        </div>
        <p className="text-xs text-slate-500">
          Se crea con los roles Administrador, Gerente comercial y Vendedor, y catálogos básicos de formas de pago y actividades.
          Comparte la contraseña con el administrador por un medio seguro; podrá cambiarla al entrar.
        </p>
        <PieFormulario error={crear.error} guardando={crear.isPending} onCancelar={onCerrar} textoGuardar="Crear empresa" />
      </form>
    </Modal>
  )
}
