import { useState, type FormEvent } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useCambiarMiPassword } from '../api/hooks'
import { useSesion } from '../sesion/Sesion'
import {
  BotonIcono, Campo, cn, ContextoAcento, errorDeCampo, Icono, Input, Modal, PieFormulario,
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
    titulo: 'Compras e inventario',
    enlaces: [
      { a: '/compras', texto: 'Órdenes de compra', icono: 'carrito', color: 'turquesa', permiso: 'compras.ver' },
      { a: '/inventario', texto: 'Inventario', icono: 'productos', color: 'indigo', permiso: 'inventario.ver' },
    ],
  },
  {
    titulo: 'Catálogos',
    enlaces: [
      { a: '/clientes', texto: 'Clientes', icono: 'clientes', color: 'esmeralda', permiso: 'clientes.ver' },
      { a: '/proveedores', texto: 'Proveedores', icono: 'proveedores', color: 'ambar', permiso: 'proveedores.ver' },
      { a: '/productos', texto: 'Productos y servicios', icono: 'productos', color: 'turquesa', permiso: 'productos.ver' },
      { a: '/listas-precios', texto: 'Listas de precios', icono: 'etiqueta', color: 'ambar', permiso: 'listas-precios.ver' },
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
      { a: '/empresa', texto: 'Mi empresa', icono: 'edificio', color: 'indigo' },
      { a: '/catalogos/instrumentos-pago', texto: 'Instrumentos de pago', icono: 'pago', color: 'esmeralda', permiso: 'catalogos.ver' },
      { a: '/catalogos/condiciones-pago', texto: 'Condiciones de pago', icono: 'reloj', color: 'ambar', permiso: 'catalogos.ver' },
      { a: '/catalogos/tipos-contacto', texto: 'Tipos de contacto', icono: 'telefono', color: 'cielo', permiso: 'catalogos.ver' },
      { a: '/sucursales', texto: 'Sucursales y almacenes', icono: 'sucursales', color: 'ambar', permiso: 'sucursales.ver' },
    ],
  },
  {
    titulo: 'Comunicación',
    enlaces: [
      { a: '/mensajes', texto: 'Mensajes', icono: 'mensaje', color: 'cielo', permiso: 'mensajes.ver' },
      { a: '/promociones', texto: 'Promociones', icono: 'megafono', color: 'esmeralda', permiso: 'promociones.ver' },
      { a: '/formatos', texto: 'Formatos', icono: 'documento', color: 'pizarra', permiso: 'formatos.ver' },
    ],
  },
  {
    titulo: 'Seguridad',
    enlaces: [
      { a: '/usuarios', texto: 'Usuarios', icono: 'usuarios', color: 'pizarra', permiso: 'usuarios.ver' },
      { a: '/roles', texto: 'Roles y permisos', icono: 'escudo', color: 'indigo', permiso: 'roles.ver' },
      { a: '/soporte', texto: 'Soporte', icono: 'ayuda', color: 'pizarra' },
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

/** Preferencias del menú guardadas en el navegador (si no hay almacenamiento, se usan los valores por omisión). */
function leerPreferencia<T>(clave: string, porOmision: T): T {
  try {
    const valor = localStorage.getItem(clave)
    return valor ? (JSON.parse(valor) as T) : porOmision
  } catch {
    return porOmision
  }
}
function guardarPreferencia(clave: string, valor: unknown) {
  try { localStorage.setItem(clave, JSON.stringify(valor)) } catch { /* sin almacenamiento */ }
}

const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function Navegacion({ onNavegar, compacto = false }: { onNavegar?: () => void; compacto?: boolean }) {
  const { puede } = useSesion()
  const { pathname } = useLocation()
  const [buscar, setBuscar] = useState('')
  const [cerradas, setCerradas] = useState<string[]>(() => leerPreferencia('menu.seccionesCerradas', []))
  const texto = sinAcentos(buscar.trim())
  const seccionActual = secciones.find((s) => s.enlaces.includes(enlaceDeRuta(pathname)!))?.titulo

  const alternar = (titulo: string) => {
    const nuevas = cerradas.includes(titulo) ? cerradas.filter((t) => t !== titulo) : [...cerradas, titulo]
    setCerradas(nuevas)
    guardarPreferencia('menu.seccionesCerradas', nuevas)
  }

  const grupos = secciones
    .map((s) => ({
      ...s,
      visibles: s.enlaces.filter((e) => (!e.permiso || puede(e.permiso)) && (!texto || sinAcentos(e.texto).includes(texto))),
    }))
    .filter((s) => s.visibles.length > 0)

  return (
    <nav className={cn('py-4', compacto ? 'px-2' : 'px-3')}>
      {!compacto && (
        <div className="relative mb-4">
          <Icono nombre="buscar" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar en el menú…"
            className="w-full rounded-lg border border-white/10 bg-tinta-900 py-1.5 pr-3 pl-9 text-sm text-slate-200 placeholder:text-slate-500 focus:border-marca-400/60 focus:bg-white/10 focus:outline-none" />
        </div>
      )}
      {grupos.length === 0 && <p className="px-3 text-sm text-slate-500">Sin resultados.</p>}

      <div className={compacto ? 'space-y-3' : 'space-y-4'}>
        {grupos.map((s) => {
          // Al buscar, o si contiene la página actual, la sección se muestra abierta.
          const abierta = compacto || !!texto || s.titulo === seccionActual || !cerradas.includes(s.titulo)
          return (
            <div key={s.titulo}>
              {compacto ? (
                <div className="mx-3 mb-3 border-t border-white/10 first:hidden" />
              ) : (
                <button type="button" onClick={() => alternar(s.titulo)} aria-expanded={abierta}
                  className="flex w-full items-center justify-between rounded-md px-3 pb-1.5 text-[11px] font-semibold tracking-widest text-slate-500 uppercase transition-colors hover:text-slate-300">
                  {s.titulo}
                  <Icono nombre="abajo" className={cn('h-3.5 w-3.5 transition-transform', !abierta && '-rotate-90')} />
                </button>
              )}
              {abierta && (
                <ul className="space-y-0.5">
                  {s.visibles.map((e) => (
                    <li key={e.a}>
                      <NavLink to={e.a} end={e.a === '/'} onClick={onNavegar} title={compacto ? e.texto : undefined}
                        className={({ isActive }) => cn(
                          'group relative flex items-center gap-3 rounded-lg py-1.5 text-sm font-medium transition-colors',
                          compacto ? 'justify-center px-0' : 'px-2.5',
                          isActive
                            ? 'bg-tinta-800 text-white shadow-sm ring-1 ring-white/5'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100')}>
                        {({ isActive }) => (
                          <>
                            {isActive && <span className={cn('absolute top-1.5 bottom-1.5 -left-3 w-1 rounded-r-full', compacto && '-left-2', 'bg-marca-400')} />}
                            <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
                              isActive ? 'bg-marca-400/15 text-marca-400' : 'text-slate-500 group-hover:text-slate-300')}>
                              <Icono nombre={e.icono} className="h-4 w-4" />
                            </span>
                            {!compacto && <span className="truncate">{e.texto}</span>}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}

function Marca({ clara = false, compacta = false }: { clara?: boolean; compacta?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-marca-400 text-sm font-bold text-tinta-950 shadow-md shadow-marca-400/20">
        iC
      </div>
      {!compacta && (
        <span className={cn('text-lg font-bold tracking-tight', clara ? 'text-white' : 'text-slate-900')}>
          Inteli<span className={clara ? 'text-marca-400' : 'text-marca-700'}>CRM</span>
        </span>
      )}
    </div>
  )
}

/** Fondo del menú lateral: casi negro (#101114); el elemento activo usa grafito (#292D33). */
const fondoMenu = 'bg-tinta-950'
const botonMenu = 'text-slate-400 hover:bg-white/10 hover:text-white'

/** Tarjeta del usuario con sesión: nombre, empresa, rol y acciones. */
function PanelUsuario({ onCambiarPassword, compacto = false }: { onCambiarPassword: () => void; compacto?: boolean }) {
  const { usuario, cerrarSesion } = useSesion()
  if (!usuario) return null
  const iniciales = usuario.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

  if (compacto) {
    return (
      <div className="flex flex-col items-center gap-1 border-t border-white/10 p-2">
        <span title={`${usuario.nombre} · ${usuario.cuenta} · ${usuario.rol}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-marca-400/15 text-sm font-semibold text-marca-300">
          {iniciales}
        </span>
        <BotonIcono icono="llave" etiqueta="Cambiar contraseña" onClick={onCambiarPassword} className={botonMenu} />
        <BotonIcono icono="salir" etiqueta="Cerrar sesión" onClick={cerrarSesion} className={botonMenu} />
      </div>
    )
  }

  return (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-3 rounded-xl bg-tinta-900 px-2.5 py-2.5 ring-1 ring-white/5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marca-400/15 text-sm font-semibold text-marca-300">
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
  const [compacto, setCompacto] = useState(() => leerPreferencia('menu.compacto', false))
  const { pathname } = useLocation()
  const actual = enlaceDeRuta(pathname)

  const alternarCompacto = () => {
    setCompacto(!compacto)
    guardarPreferencia('menu.compacto', !compacto)
  }

  return (
    <div className={cn('min-h-screen transition-[padding]', compacto ? 'lg:pl-20' : 'lg:pl-64')}>
      {/* Menú lateral fijo (escritorio); se puede contraer a solo iconos */}
      <aside className={cn('fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/5 shadow-xl transition-[width] lg:flex', fondoMenu, compacto ? 'w-20' : 'w-64')}>
        <div className={cn('flex h-16 shrink-0 items-center border-b border-white/10', compacto ? 'justify-center' : 'justify-between pr-3 pl-5')}>
          <Marca clara compacta={compacto} />
          {!compacto && <BotonIcono icono="izquierda" etiqueta="Contraer menú" onClick={alternarCompacto} className={botonMenu} />}
        </div>
        {compacto && (
          <div className="flex justify-center pt-3">
            <BotonIcono icono="derecha" etiqueta="Expandir menú" onClick={alternarCompacto} className={botonMenu} />
          </div>
        )}
        <div className="menu-scroll flex-1 overflow-y-auto"><Navegacion compacto={compacto} /></div>
        <PanelUsuario compacto={compacto} onCambiarPassword={() => setCambiandoPassword(true)} />
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
        <main key={pathname} className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 2xl:px-10">
          <Outlet />
        </main>
      </ContextoAcento.Provider>

      {cambiandoPassword && <FormCambiarPassword onCerrar={() => setCambiandoPassword(false)} />}
    </div>
  )
}
