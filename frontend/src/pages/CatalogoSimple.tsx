import { useState, type FormEvent } from 'react'
import { useCatalogo, useDesactivarCatalogo, useGuardarCatalogo, type RutaCatalogo } from '../api/hooks'
import type { Catalogo } from '../api/tipos'
import {
  BarraFiltros, Boton, BotonIcono, Campo, Cargando, Celda, CeldaAcciones, Checkbox, Encabezado, errorDeCampo, Fila,
  Input, Insignia, MensajeError, Modal, nulo, PieFormulario, Tabla, Tarjeta, Textarea, useConfirmar, Vacio,
} from '../components/ui'
import { SiPuede } from '../sesion/Sesion'

interface Props {
  ruta: RutaCatalogo
  titulo: string
  descripcion: string
  /** Solo Acciones y actividades tienen duración sugerida. */
  conDuracion?: boolean
}

/** Página genérica para Puestos, Unidades de negocio y Acciones/actividades (permiso "catalogos"). */
export default function CatalogoSimple({ ruta, titulo, descripcion, conDuracion = false }: Props) {
  const confirmar = useConfirmar()
  const [inactivos, setInactivos] = useState(false)
  const [editando, setEditando] = useState<Catalogo | 'nuevo' | null>(null)
  const { data, isLoading, error } = useCatalogo(ruta, inactivos)
  const desactivar = useDesactivarCatalogo(ruta)

  const darDeBaja = async (c: Catalogo) => {
    if (await confirmar({ titulo: 'Dar de baja', mensaje: <>¿Dar de baja <b>{c.nombre}</b>?</>, textoConfirmar: 'Dar de baja', peligro: true }))
      desactivar.mutate(c.id)
  }

  const columnas = [
    { titulo: 'Nombre' }, { titulo: 'Descripción' },
    ...(conDuracion ? [{ titulo: 'Duración', derecha: true }] : []),
    { titulo: '' },
  ]

  return (
    <>
      <Encabezado titulo={titulo} descripcion={descripcion}
        acciones={<SiPuede permiso="catalogos.editar"><Boton variante="primario" icono="mas" onClick={() => setEditando('nuevo')}>Agregar</Boton></SiPuede>} />

      <BarraFiltros>
        <Checkbox etiqueta="Mostrar inactivos" checked={inactivos} onChange={(e) => setInactivos(e.target.checked)} />
      </BarraFiltros>

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="Sin registros." /></Tarjeta> : (
        <Tabla columnas={columnas}>
          {data.map((c) => (
            <Fila key={c.id} inactiva={!c.activo}>
              <Celda className="font-medium text-slate-900">
                {c.nombre} {!c.activo && <Insignia className="ml-2">Inactivo</Insignia>}
              </Celda>
              <Celda className="text-slate-600">{c.descripcion ?? '—'}</Celda>
              {conDuracion && <Celda derecha className="text-slate-600 tabular-nums">{c.duracionMinutos} min</Celda>}
              <CeldaAcciones>
                <SiPuede permiso="catalogos.editar"><BotonIcono icono="editar" etiqueta="Editar" onClick={() => setEditando(c)} /></SiPuede>
                {c.activo && <SiPuede permiso="catalogos.eliminar"><BotonIcono icono="basura" etiqueta="Dar de baja" peligro onClick={() => darDeBaja(c)} /></SiPuede>}
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}

      {editando && (
        <FormCatalogo ruta={ruta} titulo={titulo} conDuracion={conDuracion}
          item={editando === 'nuevo' ? undefined : editando} onCerrar={() => setEditando(null)} />
      )}
    </>
  )
}

function FormCatalogo({ ruta, titulo, conDuracion, item, onCerrar }: {
  ruta: RutaCatalogo; titulo: string; conDuracion: boolean; item?: Catalogo; onCerrar: () => void
}) {
  const guardar = useGuardarCatalogo(ruta)
  const [f, setF] = useState({
    nombre: item?.nombre ?? '', descripcion: item?.descripcion ?? '',
    duracionMinutos: item?.duracionMinutos?.toString() ?? '30', activo: item?.activo ?? true,
  })
  const err = (c: string) => errorDeCampo(guardar.error, c)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({
      id: item?.id,
      datos: {
        nombre: f.nombre, descripcion: nulo(f.descripcion), activo: f.activo,
        duracionMinutos: conDuracion ? Number(f.duracionMinutos) : null,
      },
    }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo={`${item ? 'Editar' : 'Agregar'} · ${titulo}`} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Nombre *" error={err('nombre')}>
          <Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required autoFocus />
        </Campo>
        <Campo etiqueta="Descripción">
          <Textarea rows={2} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} />
        </Campo>
        {conDuracion && (
          <Campo etiqueta="Duración sugerida (minutos)" error={err('duracionMinutos')}>
            <Input className="w-32" type="number" min="5" max="480" step="5" value={f.duracionMinutos}
              onChange={(e) => setF({ ...f, duracionMinutos: e.target.value })} required />
          </Campo>
        )}
        {item && <Checkbox etiqueta="Activo" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />}
        <PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} />
      </form>
    </Modal>
  )
}
