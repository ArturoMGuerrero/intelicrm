import { useState, type FormEvent } from 'react'
import { useCatalogoPermisos, useEliminarRol, useGuardarRol, useRoles } from '../api/hooks'
import type { ModuloPermiso, Rol } from '../api/tipos'
import {
  Aviso, Boton, BotonIcono, Campo, Cargando, cn, Encabezado, errorDeCampo, Input, Insignia, MensajeError, Modal,
  nulo, PieFormulario, Tarjeta, useConfirmar,
} from '../components/ui'
import { etiquetaAccion } from '../lib/etiquetas'
import { SiPuede } from '../sesion/Sesion'

export default function Roles() {
  const confirmar = useConfirmar()
  const { data, isLoading, error } = useRoles()
  const catalogo = useCatalogoPermisos()
  const eliminar = useEliminarRol()
  const [editando, setEditando] = useState<Rol | 'nuevo' | null>(null)

  const eliminarRol = async (r: Rol) => {
    if (await confirmar({ titulo: 'Eliminar rol', mensaje: <>¿Eliminar el rol <b>{r.nombre}</b>?</>, textoConfirmar: 'Eliminar', peligro: true }))
      eliminar.mutate(r.id)
  }

  return (
    <>
      <Encabezado titulo="Roles y permisos" descripcion="Qué puede ver y hacer cada tipo de usuario."
        acciones={<SiPuede permiso="roles.editar"><Boton variante="primario" icono="mas" onClick={() => setEditando('nuevo')}>Nuevo rol</Boton></SiPuede>} />

      <MensajeError error={error ?? catalogo.error} />
      {isLoading || catalogo.isLoading ? <Cargando /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data?.map((r) => (
            <Tarjeta key={r.id}
              titulo={<span className="flex items-center gap-2">{r.nombre}{r.esAdministrador && <Insignia tono="azul">Acceso total</Insignia>}</span>}
              acciones={
                <div className="flex">
                  <SiPuede permiso="roles.editar"><BotonIcono icono="editar" etiqueta="Editar rol" onClick={() => setEditando(r)} /></SiPuede>
                  {!r.esAdministrador && (
                    <SiPuede permiso="roles.eliminar">
                      <BotonIcono icono="basura" etiqueta={r.usuarios > 0 ? 'Tiene usuarios asignados' : 'Eliminar rol'} peligro
                        disabled={r.usuarios > 0} onClick={() => eliminarRol(r)} />
                    </SiPuede>
                  )}
                </div>
              }>
              {r.descripcion && <p className="-mt-2 mb-3 text-sm text-slate-500">{r.descripcion}</p>}
              <p className="mb-3 text-xs text-slate-500">{r.usuarios} {r.usuarios === 1 ? 'usuario' : 'usuarios'} · {r.permisos.length} permisos</p>
              <ResumenPermisos modulos={catalogo.data ?? []} permisos={r.permisos} />
            </Tarjeta>
          ))}
        </div>
      )}

      {editando && catalogo.data && (
        <FormRol rol={editando === 'nuevo' ? undefined : editando} modulos={catalogo.data} onCerrar={() => setEditando(null)} />
      )}
    </>
  )
}

/** Lista compacta: módulo → acciones permitidas. */
function ResumenPermisos({ modulos, permisos }: { modulos: ModuloPermiso[]; permisos: string[] }) {
  const conAcceso = modulos
    .map((m) => ({ m, acciones: m.acciones.filter((a) => permisos.includes(`${m.clave}.${a}`)) }))
    .filter((x) => x.acciones.length > 0)
  if (conAcceso.length === 0) return <p className="text-sm text-slate-400">Sin permisos.</p>
  return (
    <ul className="space-y-1.5 text-sm">
      {conAcceso.map(({ m, acciones }) => (
        <li key={m.clave} className="flex items-center justify-between gap-2">
          <span className="text-slate-700">{m.nombre}</span>
          <span className="flex gap-1">
            {acciones.map((a) => <Insignia key={a} tono={a === 'eliminar' ? 'rojo' : a === 'editar' ? 'ambar' : 'gris'}>{a}</Insignia>)}
          </span>
        </li>
      ))}
    </ul>
  )
}

function FormRol({ rol, modulos, onCerrar }: { rol?: Rol; modulos: ModuloPermiso[]; onCerrar: () => void }) {
  const guardar = useGuardarRol()
  const [nombre, setNombre] = useState(rol?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(rol?.descripcion ?? '')
  const [permisos, setPermisos] = useState<Set<string>>(() => new Set(rol?.permisos ?? []))
  const esAdmin = rol?.esAdministrador ?? false

  // Reglas de coherencia: editar o eliminar implican ver; quitar "ver" quita todo el módulo.
  const alternar = (modulo: string, accion: string) => {
    const clave = `${modulo}.${accion}`
    const nuevo = new Set(permisos)
    if (nuevo.has(clave)) {
      nuevo.delete(clave)
      if (accion === 'ver') ['editar', 'eliminar'].forEach((a) => nuevo.delete(`${modulo}.${a}`))
    } else {
      nuevo.add(clave)
      if (accion !== 'ver') nuevo.add(`${modulo}.ver`)
    }
    setPermisos(nuevo)
  }

  const alternarModulo = (m: ModuloPermiso) => {
    const todos = m.acciones.every((a) => permisos.has(`${m.clave}.${a}`))
    const nuevo = new Set(permisos)
    m.acciones.forEach((a) => (todos ? nuevo.delete(`${m.clave}.${a}`) : nuevo.add(`${m.clave}.${a}`)))
    setPermisos(nuevo)
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({ id: rol?.id, datos: { nombre, descripcion: nulo(descripcion), permisos: [...permisos] } }, { onSuccess: onCerrar })
  }

  const grupos = [...new Set(modulos.map((m) => m.grupo))]
  const acciones = modulos[0]?.acciones ?? []

  return (
    <Modal abierto titulo={rol ? `Editar rol: ${rol.nombre}` : 'Nuevo rol'} onCerrar={onCerrar} ancho="max-w-3xl">
      <form onSubmit={enviar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre *" error={errorDeCampo(guardar.error, 'nombre')}>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
          </Campo>
          <Campo etiqueta="Descripción">
            <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </Campo>
        </div>

        {esAdmin ? (
          <Aviso tono="azul">El rol de administrador siempre tiene todos los permisos.</Aviso>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <th className="px-4 py-2.5 text-left">Módulo</th>
                  {acciones.map((a) => <th key={a} className="w-32 px-2 py-2.5 text-center">{etiquetaAccion[a] ?? a}</th>)}
                </tr>
              </thead>
              {grupos.map((g) => (
                <tbody key={g}>
                  <tr><td colSpan={acciones.length + 1} className="border-t border-slate-200 bg-slate-50/60 px-4 py-1.5 text-xs font-semibold text-slate-500">{g}</td></tr>
                  {modulos.filter((m) => m.grupo === g).map((m) => (
                    <tr key={m.clave} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <button type="button" onClick={() => alternarModulo(m)} className="text-left text-slate-800 hover:text-marca-700" title="Marcar o desmarcar todo el módulo">
                          {m.nombre}
                        </button>
                      </td>
                      {m.acciones.map((a) => {
                        const marcado = permisos.has(`${m.clave}.${a}`)
                        return (
                          <td key={a} className="px-2 py-2 text-center">
                            <input type="checkbox" checked={marcado} onChange={() => alternar(m.clave, a)}
                              aria-label={`${m.nombre}: ${etiquetaAccion[a] ?? a}`}
                              className={cn('h-4 w-4 cursor-pointer rounded border-slate-300', a === 'eliminar' ? 'accent-red-600' : 'accent-marca-600')} />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        )}
        {!esAdmin && <p className="text-xs text-slate-500">Al marcar "Crear y editar" o "Eliminar" se marca "Ver" automáticamente. Clic en el nombre del módulo para marcarlo completo.</p>}
        {rol && !esAdmin && rol.usuarios > 0 && (
          <Aviso>Al guardar, los {rol.usuarios} usuario(s) con este rol tendrán que volver a iniciar sesión para tomar los permisos nuevos.</Aviso>
        )}
        <PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} />
      </form>
    </Modal>
  )
}
