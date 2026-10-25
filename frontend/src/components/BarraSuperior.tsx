import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAvisos, useBusquedaGeneral } from '../api/hooks'
import type { Aviso, ResultadoBusqueda } from '../api/tipos'
import { useSesion } from '../sesion/Sesion'
import { IndicadorTipoCambio } from './TipoCambio'
import { BotonIcono, cn, Icono, type NombreIcono } from './ui'

const iconoTipo: Record<string, NombreIcono> = {
  Prospecto: 'prospectos', Cliente: 'clientes', 'Cotización': 'cotizaciones', Cargo: 'recibo',
  Proveedor: 'proveedores', Producto: 'productos',
}

const tonoAviso: Record<Aviso['nivel'], string> = {
  info: 'bg-sky-50 text-sky-700',
  alerta: 'bg-amber-50 text-amber-700',
  peligro: 'bg-rose-50 text-rose-700',
}

/** Cierra un menú desplegable al hacer clic fuera de él o al presionar Escape. */
function useCerrarFuera(abierto: boolean, cerrar: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!abierto) return
    const clic = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) cerrar() }
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar() }
    document.addEventListener('mousedown', clic)
    document.addEventListener('keydown', tecla)
    return () => { document.removeEventListener('mousedown', clic); document.removeEventListener('keydown', tecla) }
  }, [abierto, cerrar])
  return ref
}

function Desplegable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('absolute top-full right-0 z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-superficie shadow-xl', className)}>
      {children}
    </div>
  )
}

/** Búsqueda general: prospectos, clientes, folios, proveedores y productos. Atajo: Ctrl+K. */
function BusquedaGeneral() {
  const navegar = useNavigate()
  const [texto, setTexto] = useState('')
  const [consulta, setConsulta] = useState('')
  const [abierta, setAbierta] = useState(false)
  const [marcado, setMarcado] = useState(0)
  const entrada = useRef<HTMLInputElement>(null)
  const ref = useCerrarFuera(abierta, () => setAbierta(false))
  const { data, isFetching } = useBusquedaGeneral(consulta)
  const resultados = consulta.trim().length >= 2 ? data ?? [] : []

  // Espera a que el usuario deje de escribir antes de consultar.
  useEffect(() => {
    const t = setTimeout(() => { setConsulta(texto); setMarcado(0) }, 250)
    return () => clearTimeout(t)
  }, [texto])

  useEffect(() => {
    const atajo = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        entrada.current?.focus()
      }
    }
    document.addEventListener('keydown', atajo)
    return () => document.removeEventListener('keydown', atajo)
  }, [])

  const abrir = (r: ResultadoBusqueda) => {
    navegar(r.ruta)
    setAbierta(false)
    setTexto('')
    entrada.current?.blur()
  }

  const teclas = (e: React.KeyboardEvent) => {
    if (!resultados.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setMarcado((marcado + 1) % resultados.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setMarcado((marcado - 1 + resultados.length) % resultados.length) }
    else if (e.key === 'Enter') { e.preventDefault(); abrir(resultados[marcado]) }
  }

  const grupos = [...new Set(resultados.map((r) => r.tipo))]

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Icono nombre="buscar" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input ref={entrada} type="search" value={texto} placeholder="Buscar clientes, prospectos, folios…"
        onChange={(e) => { setTexto(e.target.value); setAbierta(true) }} onFocus={() => setAbierta(true)} onKeyDown={teclas}
        aria-label="Búsqueda general"
        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pr-14 pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-marca-500 focus:bg-superficie focus:ring-2 focus:ring-marca-100 focus:outline-none" />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-slate-200 bg-superficie px-1.5 text-[11px] text-slate-400 sm:block">
        Ctrl K
      </kbd>

      {abierta && texto.trim().length >= 2 && (
        <Desplegable className="right-auto left-0 w-full min-w-80">
          {resultados.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              {isFetching || consulta !== texto ? 'Buscando…' : `Sin resultados para «${texto.trim()}».`}
            </p>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto py-1">
              {grupos.map((tipo) => (
                <div key={tipo}>
                  <p className="px-4 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{tipo}</p>
                  {resultados.filter((r) => r.tipo === tipo).map((r) => {
                    const i = resultados.indexOf(r)
                    return (
                      <button key={`${r.tipo}-${r.id}`} type="button" onMouseEnter={() => setMarcado(i)} onClick={() => abrir(r)}
                        className={cn('flex w-full items-center gap-3 px-4 py-2 text-left', i === marcado && 'bg-marca-50')}>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Icono nombre={iconoTipo[r.tipo] ?? 'documento'} className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-900">{r.titulo}</span>
                          {r.subtitulo && <span className="block truncate text-xs text-slate-500">{r.subtitulo}</span>}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </Desplegable>
      )}
    </div>
  )
}

/** Campana con avisos: citas de hoy, cobros vencidos, inventario bajo, ... */
function Avisos() {
  const [abierto, setAbierto] = useState(false)
  const ref = useCerrarFuera(abierto, () => setAbierto(false))
  const { data } = useAvisos()
  const avisos = data ?? []
  const urgente = avisos.some((a) => a.nivel === 'peligro')

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setAbierto(!abierto)} aria-label={`Avisos (${avisos.length})`} title="Avisos"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800">
        <Icono nombre="campana" className="h-5 w-5" />
        {avisos.length > 0 && (
          <span className={cn('absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2 ring-superficie',
            urgente ? 'bg-rose-500 text-white' : 'bg-marca-600 text-white')}>
            {avisos.length}
          </span>
        )}
      </button>

      {abierto && (
        <Desplegable className="w-80 sm:w-96">
          <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">Avisos</p>
          {avisos.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Todo en orden, no hay pendientes.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {avisos.map((a) => (
                <li key={a.clave}>
                  <Link to={a.ruta} onClick={() => setAbierto(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                    <span className={cn('mt-0.5 flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-xs font-bold', tonoAviso[a.nivel])}>
                      {a.cantidad}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900">{a.titulo}</span>
                      <span className="block text-xs text-slate-500">{a.detalle}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Desplegable>
      )}
    </div>
  )
}

/** Avatar con el nombre del usuario; abre el menú con cambiar contraseña y cerrar sesión. */
function MenuUsuario({ onCambiarPassword }: { onCambiarPassword: () => void }) {
  const { usuario, cerrarSesion } = useSesion()
  const [abierto, setAbierto] = useState(false)
  const ref = useCerrarFuera(abierto, () => setAbierto(false))
  if (!usuario) return null
  const iniciales = usuario.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

  const opcion = 'flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50'
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}
        className="flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1 transition-colors hover:bg-slate-100">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-marca-500 to-marca-700 text-xs font-semibold text-white">{iniciales}</span>
        <span className="hidden text-left md:block">
          <span className="block max-w-40 truncate text-sm leading-tight font-medium text-slate-900">{usuario.nombre}</span>
          <span className="block max-w-40 truncate text-xs leading-tight text-slate-500">{usuario.rol}</span>
        </span>
        <Icono nombre="abajo" className="hidden h-4 w-4 text-slate-400 md:block" />
      </button>

      {abierto && (
        <Desplegable className="w-64">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-slate-900">{usuario.nombre}</p>
            <p className="truncate text-xs text-slate-500">{usuario.correo}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{usuario.cuenta} · {usuario.rol}</p>
          </div>
          <div className="py-1">
            <button type="button" className={opcion} onClick={() => { setAbierto(false); onCambiarPassword() }}>
              <Icono nombre="llave" className="h-4 w-4 text-slate-400" /> Cambiar contraseña
            </button>
            <Link to="/soporte" className={opcion} onClick={() => setAbierto(false)}>
              <Icono nombre="ayuda" className="h-4 w-4 text-slate-400" /> Soporte
            </Link>
            <button type="button" className={cn(opcion, 'text-rose-600')} onClick={cerrarSesion}>
              <Icono nombre="salir" className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </Desplegable>
      )}
    </div>
  )
}

/**
 * Barra superior fija: ruta de navegación (sección › pantalla), búsqueda general,
 * avisos y menú del usuario. En móvil incluye el botón para abrir el menú lateral.
 */
export default function BarraSuperior({ seccion, pantalla, detalle, onAbrirMenu, onCambiarPassword }: {
  seccion?: string
  pantalla?: { texto: string; a: string }
  detalle: boolean
  onAbrirMenu: () => void
  onCambiarPassword: () => void
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-fondo/80 px-4 backdrop-blur sm:px-6 lg:px-8 2xl:px-10">
      <BotonIcono icono="menu" etiqueta="Abrir menú" onClick={onAbrirMenu} className="-ml-1 text-slate-600 lg:hidden" />

      <nav aria-label="Ruta" className="hidden min-w-0 shrink items-center gap-1.5 text-sm xl:flex">
        {seccion && <span className="truncate text-slate-500">{seccion}</span>}
        {pantalla && (
          <>
            <Icono nombre="derecha" className="h-3.5 w-3.5 text-slate-300" />
            {detalle
              ? <Link to={pantalla.a} className="truncate text-slate-500 hover:text-slate-900">{pantalla.texto}</Link>
              : <span className="truncate font-medium text-slate-900">{pantalla.texto}</span>}
          </>
        )}
        {detalle && (
          <>
            <Icono nombre="derecha" className="h-3.5 w-3.5 text-slate-300" />
            <span className="font-medium text-slate-900">Detalle</span>
          </>
        )}
      </nav>

      <div className="flex flex-1 justify-center xl:px-6"><BusquedaGeneral /></div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <IndicadorTipoCambio />
        <Avisos />
        <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
        <MenuUsuario onCambiarPassword={onCambiarPassword} />
      </div>
    </header>
  )
}
