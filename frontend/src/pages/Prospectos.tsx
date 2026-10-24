import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useCambiarEtapa, useEmpleados, useProspectos } from '../api/hooks'
import type { EtapaProspecto, Prospecto } from '../api/tipos'
import FormProspecto from '../components/FormProspecto'
import { FormPromocion } from './Promociones'
import {
  BarraFiltros, Boton, BotonIcono, Buscador, Cargando, Celda, Doble, Encabezado, Fila, Insignia, MensajeError, Tarjeta as Panel,
  Segmentos, Select, Tabla, Tarjeta, Vacio,
} from '../components/ui'
import { ETAPAS, etiquetaEtapa, tonoEtapa } from '../lib/etiquetas'
import { formatoMoneda } from '../lib/formato'
import { SiPuede, usePuede } from '../sesion/Sesion'

type Vista = 'tabla' | 'embudo'

export default function Prospectos() {
  const [vista, setVista] = useState<Vista>('tabla')
  const [buscar, setBuscar] = useState('')
  const [etapa, setEtapa] = useState<EtapaProspecto | ''>('')
  const [empleadoId, setEmpleadoId] = useState<number | ''>('')
  const [formAbierto, setFormAbierto] = useState(false)

  const empleados = useEmpleados()
  const { data, isLoading, error } = useProspectos({ buscar, empleadoId, etapa: vista === 'embudo' ? '' : etapa })

  return (
    <>
      <Encabezado
        titulo="Prospectos"
        descripcion="Posibles clientes y su avance en el embudo de ventas."
        acciones={
          <SiPuede permiso="prospectos.editar">
            <Boton variante="primario" icono="mas" onClick={() => setFormAbierto(true)}>Nuevo prospecto</Boton>
          </SiPuede>
        }
      />

      <BarraFiltros>
        <Buscador placeholder="Buscar por nombre, empresa, correo o teléfono…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        {vista === 'tabla' && (
          <Select className="md:w-44" value={etapa} onChange={(e) => setEtapa(e.target.value as EtapaProspecto | '')} aria-label="Etapa">
            <option value="">Todas las etapas</option>
            {ETAPAS.map((e) => <option key={e} value={e}>{etiquetaEtapa[e]}</option>)}
          </Select>
        )}
        <Select className="md:w-52" value={empleadoId} aria-label="Responsable"
          onChange={(e) => setEmpleadoId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Todos los responsables</option>
          {empleados.data?.map((e) => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
        </Select>
        <Segmentos etiqueta="Vista" valor={vista} onCambiar={setVista}
          opciones={[{ valor: 'tabla', texto: 'Tabla' }, { valor: 'embudo', texto: 'Embudo' }]} />
      </BarraFiltros>

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : data && (vista === 'tabla' ? <TablaProspectos prospectos={data} /> : <Embudo prospectos={data} />)}

      {formAbierto && <FormProspecto onCerrar={() => setFormAbierto(false)} />}
    </>
  )
}

function TablaProspectos({ prospectos }: { prospectos: Prospecto[] }) {
  const navegar = useNavigate()
  // Selección para enviar correo o SMS a varios (antes "Enviar correos" / "Enviar mensajes").
  const puedeEnviar = usePuede('promociones.editar')
  const [elegidos, setElegidos] = useState<Set<number>>(new Set())
  const [enviando, setEnviando] = useState(false)
  if (prospectos.length === 0) return <Tarjeta><Vacio mensaje="No se encontraron prospectos." /></Tarjeta>

  const visibles = prospectos.map((p) => p.id)
  const todos = visibles.every((id) => elegidos.has(id))
  const alternar = (id: number) => {
    const nuevo = new Set(elegidos)
    if (nuevo.has(id)) nuevo.delete(id)
    else nuevo.add(id)
    setElegidos(nuevo)
  }

  return (
    <>
      {puedeEnviar && elegidos.size > 0 && (
        <Panel className="mb-3 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
          <span className="text-sm text-slate-700"><b>{elegidos.size}</b> prospectos seleccionados</span>
          <div className="flex gap-2">
            <Boton tamano="sm" variante="fantasma" onClick={() => setElegidos(new Set())}>Quitar selección</Boton>
            <Boton tamano="sm" variante="primario" icono="mensaje" onClick={() => setEnviando(true)}>Enviar correo o SMS</Boton>
          </div>
        </Panel>
      )}
    <Tabla columnas={[
      ...(puedeEnviar ? [{ titulo: <input type="checkbox" className="h-4 w-4 accent-marca-600" aria-label="Seleccionar todos" checked={todos}
        onChange={() => setElegidos(todos ? new Set() : new Set(visibles))} /> }] : []),
      { titulo: 'Prospecto' }, { titulo: 'Contacto' }, { titulo: 'Etapa' },
      { titulo: 'Valor estimado', derecha: true }, { titulo: 'Responsable' },
    ]}>
      {prospectos.map((p) => (
        <Fila key={p.id} onClick={() => navegar(`/prospectos/${p.id}`)}>
          {puedeEnviar && (
            <Celda className="w-10" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" className="h-4 w-4 accent-marca-600" aria-label={`Seleccionar a ${p.nombreCompleto}`}
                checked={elegidos.has(p.id)} onChange={() => alternar(p.id)} />
            </Celda>
          )}
          <Celda>
            <Doble principal={<Link to={`/prospectos/${p.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>{p.nombreCompleto}</Link>}
              secundario={[p.cargo, p.empresa].filter(Boolean).join(' · ') || '—'} />
          </Celda>
          <Celda className="text-slate-600">
            <p>{p.correo ?? '—'}</p>
            <p className="text-xs text-slate-500">{p.telefono}</p>
          </Celda>
          <Celda><Insignia tono={tonoEtapa[p.etapa]}>{etiquetaEtapa[p.etapa]}</Insignia></Celda>
          <Celda derecha className="tabular-nums">{formatoMoneda(p.valorEstimado)}</Celda>
          <Celda className="text-slate-600">{p.empleadoResponsable ?? 'Sin asignar'}</Celda>
        </Fila>
      ))}
    </Tabla>
      {enviando && (
        <FormPromocion iniciales={[...elegidos].map((id) => `Prospecto-${id}`)}
          onCerrar={() => { setEnviando(false); setElegidos(new Set()) }} />
      )}
    </>
  )
}

/** Tablero por etapa. Las flechas mueven al prospecto a la etapa anterior/siguiente. */
function Embudo({ prospectos }: { prospectos: Prospecto[] }) {
  const cambiarEtapa = useCambiarEtapa()
  const puedeEditar = usePuede('prospectos.editar')

  const mover = (p: Prospecto, direccion: -1 | 1) => {
    const destino = ETAPAS[ETAPAS.indexOf(p.etapa) + direccion]
    if (destino) cambiarEtapa.mutate({ id: p.id, etapa: destino })
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2">
      <div className="flex gap-3" style={{ minWidth: `${ETAPAS.length * 240}px` }}>
        {ETAPAS.map((etapa) => {
          const columna = prospectos.filter((p) => p.etapa === etapa)
          const total = columna.reduce((s, p) => s + (p.valorEstimado ?? 0), 0)
          return (
            <section key={etapa} className="flex w-60 shrink-0 flex-col rounded-xl bg-slate-100 p-2">
              <header className="mb-2 px-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Insignia tono={tonoEtapa[etapa]}>{etiquetaEtapa[etapa]}</Insignia>
                  <span className="text-xs font-medium text-slate-500">{columna.length}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 tabular-nums">{formatoMoneda(total)}</p>
              </header>
              <ul className="space-y-2">
                {columna.map((p) => (
                  <li key={p.id} className="rounded-xl border border-slate-200 bg-superficie p-3 shadow-sm">
                    <Link to={`/prospectos/${p.id}`} className="block text-sm font-medium text-slate-900 hover:underline">{p.nombreCompleto}</Link>
                    <p className="truncate text-xs text-slate-500">{p.empresa ?? '—'}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 tabular-nums">{formatoMoneda(p.valorEstimado)}</span>
                      {puedeEditar && (
                        <div className="flex">
                          <BotonIcono icono="izquierda" etiqueta="Mover a la etapa anterior"
                            disabled={etapa === ETAPAS[0] || cambiarEtapa.isPending} onClick={() => mover(p, -1)} />
                          <BotonIcono icono="derecha" etiqueta="Mover a la etapa siguiente"
                            disabled={etapa === ETAPAS[ETAPAS.length - 1] || cambiarEtapa.isPending} onClick={() => mover(p, 1)} />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
                {columna.length === 0 && <li className="px-2 py-6 text-center text-xs text-slate-500">Sin prospectos</li>}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
