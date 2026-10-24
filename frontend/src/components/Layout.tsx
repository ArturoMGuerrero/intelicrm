import { useState, type FormEvent } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useCambiarMiPassword } from '../api/hooks'
import { useSesion } from '../sesion/Sesion'
import { useTema, type Tema } from '../lib/tema'
import BarraSuperior from './BarraSuperior'
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
      { a: '/seguimiento', texto: 'Seguimiento', icono: 'campana', color: 'ambar', permiso: 'prospectos.ver' },
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
      { a: '/catalogos/categorias-producto', texto: 'Categorías de productos', icono: 'cuadricula', color: 'turquesa', permiso: 'catalogos.ver' },
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
      { a: '/empresa', texto: 'Mi empresa', icono: 'edificio', color: 'indigo', permiso: 'empresa.ver' },
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
    <nav className="pb-4">
      {!compacto && (
        <div className="relative mx-4 mb-3">
          <Icono nombre="buscar" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar en el menú…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-marca-400 focus:bg-superficie focus:ring-2 focus:ring-marca-100 focus:outline-none" />
        </div>
      )}
      {grupos.length === 0 && <p className="px-6 text-sm text-slate-500">Sin resultados.</p>}

      <div className="space-y-3">
        {grupos.map((s) => {
          // Al buscar, o si contiene la página actual, la sección se muestra abierta.
          const abierta = compacto || !!texto || s.titulo === seccionActual || !cerradas.includes(s.titulo)
          return (
            <div key={s.titulo}>
              {compacto ? (
                <div className="mx-5 mb-3 border-t border-slate-200 first:hidden" />
              ) : (
                <button type="button" onClick={() => alternar(s.titulo)} aria-expanded={abierta}
                  className="flex w-full items-center justify-between px-6 pb-1 text-[11px] font-semibold tracking-widest text-slate-500 uppercase transition-colors hover:text-slate-800">
                  {s.titulo}
                  <Icono nombre="abajo" className={cn('h-3.5 w-3.5 transition-transform', !abierta && '-rotate-90')} />
                </button>
              )}
              {abierta && (
                <ul>
                  {s.visibles.map((e) => (
                    <li key={e.a}>
                      <NavLink to={e.a} end={e.a === '/'} onClick={onNavegar} title={compacto ? e.texto : undefined}
                        className={({ isActive }) => cn(
                          'group relative flex items-center gap-3.5 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:bg-slate-100',
                          compacto ? 'justify-center' : 'px-6',
                          isActive
                            ? 'bg-marca-50 text-marca-700'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950')}>
                        {({ isActive }) => (
                          <>
                            {isActive && <span className="absolute top-1 right-0 bottom-1 w-1 rounded-l-md bg-marca-600" />}
                            <Icono nombre={e.icono} className={cn('h-[18px] w-[18px] transition-colors',
                              isActive ? 'text-marca-600' : 'text-slate-500 group-hover:text-slate-800')} />
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

function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-marca-600 text-sm font-bold text-white shadow-md shadow-marca-600/30">
        iC
      </div>
      {!compacta && (
        <span className="text-lg font-extrabold tracking-tight text-slate-900">
          Inteli<span className="text-marca-500">CRM</span>
        </span>
      )}
    </div>
  )
}

/** Avatar y nombre del usuario en la parte alta del menú. */
function Perfil({ compacto }: { compacto: boolean }) {
  const { usuario } = useSesion()
  if (!usuario) return null
  const iniciales = usuario.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  return (
    <div className={cn('flex items-center gap-3 py-4', compacto ? 'justify-center' : 'px-6')}
      title={compacto ? `${usuario.nombre} · ${usuario.rol}` : undefined}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-marca-400 to-marca-700 text-base font-semibold text-white shadow-lg shadow-marca-600/25 ring-4 ring-superficie">
        {iniciales}
      </span>
      {!compacto && (
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{usuario.nombre}</p>
          <p className="truncate text-sm text-slate-500">{usuario.rol}</p>
        </div>
      )}
    </div>
  )
}

/** Cerrar sesión e interruptor de modo oscuro, al pie del menú. */
function PieMenu({ compacto, tema, onAlternarTema }: { compacto: boolean; tema: Tema; onAlternarTema: () => void }) {
  const { cerrarSesion } = useSesion()
  const oscuro = tema === 'oscuro'
  const fila = cn('flex w-full items-center gap-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950',
    compacto ? 'justify-center' : 'px-6')
  return (
    <div className="border-t border-slate-200 py-2">
      <button type="button" onClick={cerrarSesion} className={fila} title={compacto ? 'Cerrar sesión' : undefined}>
        <Icono nombre="salir" className="h-[18px] w-[18px] text-slate-500" />
        {!compacto && 'Cerrar sesión'}
      </button>
      <button type="button" role="switch" aria-checked={oscuro} onClick={onAlternarTema} className={fila}
        title={compacto ? (oscuro ? 'Modo claro' : 'Modo oscuro') : undefined}>
        <Icono nombre={oscuro ? 'sol' : 'luna'} className="h-[18px] w-[18px] text-slate-500" />
        {!compacto && (
          <>
            <span className="flex-1 text-left">Modo oscuro</span>
            <span className={cn('relative h-5 w-9 rounded-full transition-colors', oscuro ? 'bg-marca-600' : 'bg-slate-300')}>
              <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', oscuro ? 'left-[18px]' : 'left-0.5')} />
            </span>
          </>
        )}
      </button>
    </div>
  )
}

const botonMenu = 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'

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
  const { tema, alternar: alternarTema } = useTema()
  const { pathname, search } = useLocation()
  const actual = enlaceDeRuta(pathname)
  const seccion = secciones.find((s) => actual && s.enlaces.includes(actual))?.titulo

  const alternarCompacto = () => {
    setCompacto(!compacto)
    guardarPreferencia('menu.compacto', !compacto)
  }

  return (
    <div className={cn('min-h-screen transition-[padding]', compacto ? 'lg:pl-26' : 'lg:pl-70')}>
      {/* Menú lateral flotante (escritorio); se puede contraer a solo iconos */}
      <aside className={cn('fixed inset-y-3 left-3 z-30 hidden flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-superficie shadow-sm transition-[width] lg:flex',
        compacto ? 'w-20' : 'w-64')}>
        <div className={cn('flex h-16 shrink-0 items-center border-b border-slate-200', compacto ? 'justify-center' : 'justify-between pr-3 pl-6')}>
          <Marca compacta={compacto} />
          {!compacto && <BotonIcono icono="izquierda" etiqueta="Contraer menú" onClick={alternarCompacto} className={botonMenu} />}
        </div>
        <div className="menu-scroll flex-1 overflow-y-auto">
          {compacto && (
            <div className="flex justify-center pt-3">
              <BotonIcono icono="derecha" etiqueta="Expandir menú" onClick={alternarCompacto} className={botonMenu} />
            </div>
          )}
          <Perfil compacto={compacto} />
          <Navegacion compacto={compacto} />
        </div>
        <PieMenu compacto={compacto} tema={tema} onAlternarTema={alternarTema} />
      </aside>

      <BarraSuperior seccion={seccion} pantalla={actual} detalle={!!actual && pathname !== actual.a}
        onAbrirMenu={() => setMenuAbierto(true)} onCambiarPassword={() => setCambiandoPassword(true)} />

      {/* Menú desplegable (móvil) */}
      {menuAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuAbierto(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-superficie shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 pr-3 pl-6">
              <Marca />
              <BotonIcono icono="cerrar" etiqueta="Cerrar menú" onClick={() => setMenuAbierto(false)} className={botonMenu} />
            </div>
            <div className="menu-scroll flex-1 overflow-y-auto">
              <Perfil compacto={false} />
              <Navegacion onNavegar={() => setMenuAbierto(false)} />
            </div>
            <PieMenu compacto={false} tema={tema} onAlternarTema={alternarTema} />
          </div>
        </div>
      )}

      <ContextoAcento.Provider value={actual ? { color: actual.color, icono: actual.icono } : null}>
        <main key={pathname + search} className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 2xl:px-10">
          <Outlet />
        </main>
      </ContextoAcento.Provider>

      {cambiandoPassword && <FormCambiarPassword onCerrar={() => setCambiandoPassword(false)} />}
    </div>
  )
}
