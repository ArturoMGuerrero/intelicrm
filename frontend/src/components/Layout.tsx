import { useState, type FormEvent } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useCambiarMiPassword } from '../api/hooks'
import { useSesion } from '../sesion/Sesion'
import {
  acentos, BotonIcono, Campo, cn, ContextoAcento, errorDeCampo, Icono, Input, Modal, PieFormulario,
  type ColorAcento, type NombreIcono,
} from './ui'

interface Enlace { a: string; texto: string; icono: NombreIcono; color: ColorAcento; permiso?: string }

const secciones: { titulo: string; enlaces: Enlace[] }[] = [
  {
    titulo: 'Gestión CRM',
    enlaces: [
      { a: '/', texto: 'Inicio', icono: 'inicio', color: 'indigo' },
      { a: '/prospectos', texto: 'Prospectos', icono: 'prospectos', color: 'azul', permiso: 'prospectos.ver' },
      { a: '/citas', texto: 'Citas', icono: 'citas', color: 'cielo', permiso: 'citas.ver' },
      { a: '/cotizaciones', texto: 'Cotizaciones', icono: 'cotizaciones', color: 'ambar', permiso: 'cotizaciones.ver' },
    ],
  },
  {
    titulo: 'Ventas, cobros y pagos',
    enlaces: [
      { a: '/cargos', texto: 'Cargos', icono: 'recibo', color: 'azul', permiso: 'cargos.ver' },
      { a: '/cobranza', texto: 'Cuentas por cobrar', icono: 'cobranza', color: 'esmeralda', permiso: 'cobranza.ver' },
      { a: '/cuentas-pagar', texto: 'Cuentas por pagar', icono: 'salida', color: 'ambar', permiso: 'cuentas-pagar.ver' },
    ],
  },
  {
    titulo: 'Catálogos',
    enlaces: [
      { a: '/clientes', texto: 'Clientes', icono: 'clientes', color: 'esmeralda', permiso: 'clientes.ver' },
      { a: '/proveedores', texto: 'Proveedores', icono: 'proveedores', color: 'ambar', permiso: 'proveedores.ver' },
      { a: '/productos', texto: 'Productos y servicios', icono: 'productos', color: 'turquesa', permiso: 'productos.ver' },
      { a: '/empleados', texto: 'Empleados', icono: 'empleados', color: 'indigo', permiso: 'empleados.ver' },
      { a: '/catalogos/acciones-actividades', texto: 'Acciones y actividades', icono: 'rayo', color: 'pizarra', permiso: 'catalogos.ver' },
      { a: '/catalogos/descripciones-servicio', texto: 'Descripción de servicios', icono: 'brillo', color: 'turquesa', permiso: 'catalogos.ver' },
      { a: '/catalogos/puestos', texto: 'Puestos', icono: 'maletin', color: 'cielo', permiso: 'catalogos.ver' },
      { a: '/catalogos/unidades-negocio', texto: 'Unidades de negocio', icono: 'cuadricula', color: 'esmeralda', permiso: 'catalogos.ver' },
    ],
  },
  {
    titulo: 'Parametrización',
    enlaces: [
      { a: '/catalogos/instrumentos-pago', texto: 'Instrumentos de pago', icono: 'pago', color: 'esmeralda', permiso: 'catalogos.ver' },
      { a: '/catalogos/condiciones-pago', texto: 'Condiciones de pago', icono: 'reloj', color: 'ambar', permiso: 'catalogos.ver' },
      { a: '/catalogos/tipos-contacto', texto: 'Tipos de contacto', icono: 'telefono', color: 'cielo', permiso: 'catalogos.ver' },
      { a: '/sucursales', texto: 'Sucursales y almacenes', icono: 'sucursales', color: 'ambar', permiso: 'sucursales.ver' },
    ],
  },
  {
    titulo: 'Seguridad',
    enlaces: [
      { a: '/usuarios', texto: 'Usuarios', icono: 'usuarios', color: 'pizarra', permiso: 'usuarios.ver' },
      { a: '/roles', texto: 'Roles y permisos', icono: 'escudo', color: 'indigo', permiso: 'roles.ver' },
    ],
  },
]

const todosLosEnlaces = secciones.flatMap((s) => s.enlaces)

/** Enlace del menú que corresponde a la ruta actual (el prefijo más largo; '/' solo exacto). */
function enlaceDeRuta(pathname: string) {
  return todosLosEnlaces
    .filter((e) => (e.a === '/' ? pathname === '/' : pathname === e.a || pathname.startsWith(e.a + '/')))
    .sort((x, y) => y.a.length - x.a.length)[0]
}

function Navegacion({ onNavegar }: { onNavegar?: () => void }) {
  const { puede } = useSesion()
  return (
    <nav className="space-y-6 px-3 py-4">
      {secciones.map((s) => {
        const visibles = s.enlaces.filter((e) => !e.permiso || puede(e.permiso))
        if (visibles.length === 0) return null
        return (
          <div key={s.titulo}>
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-widest text-slate-500 uppercase">{s.titulo}</p>
            <ul className="space-y-0.5">
              {visibles.map((e) => (
                <li key={e.a}>
                  <NavLink to={e.a} end={e.a === '/'} onClick={onNavegar}
                    className={({ isActive }) => cn(
                      'group flex items-center gap-3 rounded-xl px-2.5 py-1.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white')}>
                    {({ isActive }) => (
                      <>
                        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all',
                          isActive ? acentos[e.color].menuActivo : acentos[e.color].menu)}>
                          <Icono nombre={e.icono} className="h-4 w-4" />
                        </span>
                        {e.texto}
                      </>
                    )}
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

function Marca({ clara = false }: { clara?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-marca-600 text-sm font-bold text-white">
        iC
      </div>
      <span className={cn('text-lg font-bold tracking-tight', clara ? 'text-white' : 'text-slate-900')}>
        Inteli<span className={clara ? 'text-marca-300' : 'text-marca-600'}>CRM</span>
      </span>
    </div>
  )
}

/** Fondo del menú lateral: gris pizarra oscuro. */
const fondoMenu = 'bg-gradient-to-b from-slate-900 to-slate-950'
const botonMenu = 'text-slate-400 hover:bg-white/10 hover:text-white'

/** Tarjeta del usuario con sesión: nombre, empresa, rol y acciones. */
function PanelUsuario({ onCambiarPassword }: { onCambiarPassword: () => void }) {
  const { usuario, cerrarSesion } = useSesion()
  if (!usuario) return null
  const iniciales = usuario.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

  return (
    <div className="p-3">
      <div className="flex items-center gap-3 rounded-xl bg-white/5 px-2.5 py-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marca-500/30 text-sm font-semibold text-marca-100">
          {iniciales}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{usuario.nombre}</p>
          <p className="truncate text-xs text-slate-400" title={`${usuario.cuenta} · ${usuario.rol}`}>{usuario.cuenta} · {usuario.rol}</p>
        </div>
        <BotonIcono icono="llave" etiqueta="Cambiar contraseña" onClick={onCambiarPassword} className={botonMenu} />
        <BotonIcono icono="salir" etiqueta="Cerrar sesión" onClick={cerrarSesion} className={botonMenu} />
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
  const actual = enlaceDeRuta(pathname)

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Menú lateral fijo (escritorio) */}
      <aside className={cn('fixed inset-y-0 left-0 hidden w-64 flex-col lg:flex', fondoMenu)}>
        <div className="flex h-16 items-center border-b border-white/10 px-5"><Marca clara /></div>
        <div className="menu-scroll flex-1 overflow-y-auto"><Navegacion /></div>
        <PanelUsuario onCambiarPassword={() => setCambiandoPassword(true)} />
      </aside>

      {/* Barra superior + menú desplegable (móvil) */}
      <header className={cn('sticky top-0 z-40 flex h-14 items-center justify-between px-4 shadow-md lg:hidden', fondoMenu)}>
        <Marca clara />
        <BotonIcono icono="menu" etiqueta="Abrir menú" onClick={() => setMenuAbierto(true)} className={botonMenu} />
      </header>
      {menuAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuAbierto(false)} />
          <div className={cn('absolute inset-y-0 left-0 flex w-72 flex-col shadow-2xl', fondoMenu)}>
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
              <Marca clara />
              <BotonIcono icono="cerrar" etiqueta="Cerrar menú" onClick={() => setMenuAbierto(false)} className={botonMenu} />
            </div>
            <div className="menu-scroll flex-1 overflow-y-auto"><Navegacion onNavegar={() => setMenuAbierto(false)} /></div>
            <PanelUsuario onCambiarPassword={() => { setMenuAbierto(false); setCambiandoPassword(true) }} />
          </div>
        </div>
      )}

      <ContextoAcento.Provider value={actual ? { color: actual.color, icono: actual.icono } : null}>
        <main key={pathname} className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </ContextoAcento.Provider>

      {cambiandoPassword && <FormCambiarPassword onCerrar={() => setCambiandoPassword(false)} />}
    </div>
  )
}
