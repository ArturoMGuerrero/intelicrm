import { useState, type FormEvent } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useCambiarMiPassword } from '../api/hooks'
import { useSesion } from '../sesion/Sesion'
import { BotonIcono, Campo, cn, errorDeCampo, Icono, Input, Modal, PieFormulario, type NombreIcono } from './ui'

interface Enlace { a: string; texto: string; icono: NombreIcono; permiso?: string }

const secciones: { titulo: string; enlaces: Enlace[] }[] = [
  {
    titulo: 'Gestión CRM',
    enlaces: [
      { a: '/', texto: 'Inicio', icono: 'inicio' },
      { a: '/prospectos', texto: 'Prospectos', icono: 'prospectos', permiso: 'prospectos.ver' },
      { a: '/citas', texto: 'Citas', icono: 'citas', permiso: 'citas.ver' },
      { a: '/cotizaciones', texto: 'Cotizaciones', icono: 'cotizaciones', permiso: 'cotizaciones.ver' },
    ],
  },
  {
    titulo: 'Catálogos',
    enlaces: [
      { a: '/clientes', texto: 'Clientes', icono: 'clientes', permiso: 'clientes.ver' },
      { a: '/productos', texto: 'Productos y servicios', icono: 'productos', permiso: 'productos.ver' },
      { a: '/empleados', texto: 'Empleados', icono: 'empleados', permiso: 'empleados.ver' },
      { a: '/catalogos/acciones-actividades', texto: 'Acciones y actividades', icono: 'catalogo', permiso: 'catalogos.ver' },
      { a: '/catalogos/puestos', texto: 'Puestos', icono: 'catalogo', permiso: 'catalogos.ver' },
      { a: '/catalogos/unidades-negocio', texto: 'Unidades de negocio', icono: 'catalogo', permiso: 'catalogos.ver' },
    ],
  },
  {
    titulo: 'Seguridad',
    enlaces: [
      { a: '/usuarios', texto: 'Usuarios', icono: 'usuarios', permiso: 'usuarios.ver' },
      { a: '/roles', texto: 'Roles y permisos', icono: 'escudo', permiso: 'roles.ver' },
    ],
  },
]

function Navegacion({ onNavegar }: { onNavegar?: () => void }) {
  const { puede } = useSesion()
  return (
    <nav className="space-y-6 px-3 py-4">
      {secciones.map((s) => {
        const visibles = s.enlaces.filter((e) => !e.permiso || puede(e.permiso))
        if (visibles.length === 0) return null
        return (
          <div key={s.titulo}>
            <p className="px-3 pb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">{s.titulo}</p>
            <ul className="space-y-0.5">
              {visibles.map((e) => (
                <li key={e.a}>
                  <NavLink to={e.a} end={e.a === '/'} onClick={onNavegar}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-marca-50 text-marca-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}>
                    <Icono nombre={e.icono} className="h-[18px] w-[18px]" />
                    {e.texto}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

function Marca() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-marca-600 text-sm font-bold text-white">iC</div>
      <span className="text-lg font-semibold tracking-tight text-slate-900">InteliCRM</span>
    </div>
  )
}

/** Tarjeta del usuario con sesión: nombre, empresa, rol y acciones. */
function PanelUsuario({ onCambiarPassword }: { onCambiarPassword: () => void }) {
  const { usuario, cerrarSesion } = useSesion()
  if (!usuario) return null
  const iniciales = usuario.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

  return (
    <div className="border-t border-slate-200 p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marca-100 text-sm font-semibold text-marca-700">
          {iniciales}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{usuario.nombre}</p>
          <p className="truncate text-xs text-slate-500" title={`${usuario.cuenta} · ${usuario.rol}`}>{usuario.cuenta} · {usuario.rol}</p>
        </div>
        <BotonIcono icono="llave" etiqueta="Cambiar contraseña" onClick={onCambiarPassword} />
        <BotonIcono icono="salir" etiqueta="Cerrar sesión" onClick={cerrarSesion} />
      </div>
    </div>
  )
}

function FormCambiarPassword({ onCerrar }: { onCerrar: () => void }) {
  const cambiar = useCambiarMiPassword()
  const [f, setF] = useState({ actual: '', nueva: '', confirmar: '' })
  const noCoinciden = f.confirmar !== '' && f.nueva !== f.confirmar

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (noCoinciden) return
    cambiar.mutate({ passwordActual: f.actual, passwordNueva: f.nueva }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo="Cambiar contraseña" onCerrar={onCerrar} ancho="max-w-md">
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Contraseña actual">
          <Input type="password" autoComplete="current-password" value={f.actual} onChange={(e) => setF({ ...f, actual: e.target.value })} required autoFocus />
        </Campo>
        <Campo etiqueta="Contraseña nueva" ayuda="Mínimo 8 caracteres, con mayúscula, minúscula y número."
          error={errorDeCampo(cambiar.error, 'passwordNueva')}>
          <Input type="password" autoComplete="new-password" minLength={8} value={f.nueva} onChange={(e) => setF({ ...f, nueva: e.target.value })} required />
        </Campo>
        <Campo etiqueta="Confirmar contraseña nueva" error={noCoinciden ? 'Las contraseñas no coinciden.' : undefined}>
          <Input type="password" autoComplete="new-password" value={f.confirmar} aria-invalid={noCoinciden}
            onChange={(e) => setF({ ...f, confirmar: e.target.value })} required />
        </Campo>
        <PieFormulario error={cambiar.error} guardando={cambiar.isPending} onCancelar={onCerrar} textoGuardar="Cambiar contraseña" />
      </form>
    </Modal>
  )
}

export default function Layout() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [cambiandoPassword, setCambiandoPassword] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Menú lateral fijo (escritorio) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-6"><Marca /></div>
        <div className="flex-1 overflow-y-auto"><Navegacion /></div>
        <PanelUsuario onCambiarPassword={() => setCambiandoPassword(true)} />
      </aside>

      {/* Barra superior + menú desplegable (móvil) */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Marca />
        <BotonIcono icono="menu" etiqueta="Abrir menú" onClick={() => setMenuAbierto(true)} />
      </header>
      {menuAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuAbierto(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <Marca />
              <BotonIcono icono="cerrar" etiqueta="Cerrar menú" onClick={() => setMenuAbierto(false)} />
            </div>
            <div className="flex-1 overflow-y-auto"><Navegacion onNavegar={() => setMenuAbierto(false)} /></div>
            <PanelUsuario onCambiarPassword={() => { setMenuAbierto(false); setCambiandoPassword(true) }} />
          </div>
        </div>
      )}

      <main key={pathname} className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>

      {cambiandoPassword && <FormCambiarPassword onCerrar={() => setCambiandoPassword(false)} />}
    </div>
  )
}
