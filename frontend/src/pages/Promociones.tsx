import { useMemo, useState, type FormEvent } from 'react'
import { useDestinatarios, useEnviarPromocion, useHistorialMensajes, usePromociones } from '../api/hooks'
import type { CanalMensaje, Destinatario } from '../api/tipos'
import { AvisoSimulado, TablaMensajes } from '../components/Mensajeria'
import {
  Boton, Buscador, Campo, Cargando, Celda, cn, Encabezado, errorDeCampo, Fila, Input, Insignia, MensajeError, Modal,
  PieFormulario, Segmentos, Tabla, Tarjeta, Textarea, useConfirmar, Vacio,
} from '../components/ui'
import { formatoFechaHora } from '../lib/formato'
import { SiPuede } from '../sesion/Sesion'

const clave = (d: Destinatario) => `${d.tipo}-${d.id}`

/** Promociones por SMS o correo a prospectos y clientes (antes "Gestión de promociones"). */
export default function Promociones() {
  const { data, isLoading, error } = usePromociones()
  const [nueva, setNueva] = useState(false)
  const [detalle, setDetalle] = useState<number | null>(null)

  return (
    <>
      <Encabezado titulo="Promociones" descripcion="Envíos masivos por SMS o correo a prospectos y clientes."
        acciones={<SiPuede permiso="promociones.editar"><Boton variante="primario" icono="mas" onClick={() => setNueva(true)}>Nueva promoción</Boton></SiPuede>} />
      <div className="mb-4"><AvisoSimulado /></div>

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="Aún no se han enviado promociones." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Fecha' }, { titulo: 'Promoción' }, { titulo: 'Canal' }, { titulo: 'Enviados', derecha: true }]}>
          {data.map((p) => (
            <Fila key={p.id} onClick={() => setDetalle(p.id)}>
              <Celda className="whitespace-nowrap text-slate-600 tabular-nums">{formatoFechaHora(p.fechaEnvio)}</Celda>
              <Celda><p className="font-medium text-slate-900">{p.nombre}</p><p className="line-clamp-1 text-xs text-slate-500">{p.mensaje}</p></Celda>
              <Celda><Insignia tono={p.canal === 'Sms' ? 'cielo' : 'indigo'}>{p.canal === 'Sms' ? 'SMS' : 'Correo'}</Insignia></Celda>
              <Celda derecha className="tabular-nums">
                {p.enviados}/{p.destinatarios}{p.fallidos > 0 && <span className="ml-1 text-rose-600">({p.fallidos} error)</span>}
              </Celda>
            </Fila>
          ))}
        </Tabla>
      )}

      {nueva && <FormPromocion onCerrar={() => setNueva(false)} />}
      {detalle && <DetallePromocion id={detalle} onCerrar={() => setDetalle(null)} />}
    </>
  )
}

function DetallePromocion({ id, onCerrar }: { id: number; onCerrar: () => void }) {
  const { data, isLoading } = useHistorialMensajes({ promocionId: id })
  return (
    <Modal abierto titulo="Mensajes de la promoción" onCerrar={onCerrar} ancho="max-w-4xl">
      {isLoading ? <Cargando /> : <TablaMensajes mensajes={data ?? []} />}
    </Modal>
  )
}

function FormPromocion({ onCerrar }: { onCerrar: () => void }) {
  const confirmar = useConfirmar()
  const enviar = useEnviarPromocion()
  const { data: destinatarios, isLoading } = useDestinatarios()
  const [f, setF] = useState({ nombre: '', canal: 'Sms' as CanalMensaje, asunto: '', mensaje: '' })
  const [buscar, setBuscar] = useState('')
  const [elegidos, setElegidos] = useState<Set<string>>(new Set())

  const contacto = (d: Destinatario) => (f.canal === 'Sms' ? d.celular : d.correo)
  const visibles = useMemo(() => {
    const texto = buscar.trim().toLowerCase()
    return (destinatarios ?? []).filter((d) => !texto || `${d.nombre} ${d.empresa ?? ''}`.toLowerCase().includes(texto))
  }, [destinatarios, buscar])
  const conContacto = visibles.filter((d) => contacto(d))
  const validos = (destinatarios ?? []).filter((d) => elegidos.has(clave(d)) && contacto(d))

  const alternar = (d: Destinatario) => {
    const nuevo = new Set(elegidos)
    if (nuevo.has(clave(d))) nuevo.delete(clave(d))
    else nuevo.add(clave(d))
    setElegidos(nuevo)
  }
  const todos = () => setElegidos(new Set([...elegidos, ...conContacto.map(clave)]))

  const muestra = f.mensaje.replaceAll('{nombre}', validos[0]?.nombre ?? 'Mariana').replaceAll('{empresa}', 'Comercializadora Demo')

  const mandar = async (e: FormEvent) => {
    e.preventDefault()
    if (!await confirmar({
      titulo: 'Enviar promoción', textoConfirmar: `Enviar a ${validos.length}`,
      mensaje: <>Se enviará por <b>{f.canal === 'Sms' ? 'SMS' : 'correo'}</b> a <b>{validos.length}</b> destinatarios. Esta acción no se puede deshacer.</>,
    })) return
    enviar.mutate({
      nombre: f.nombre, canal: f.canal, asunto: f.canal === 'Correo' ? f.asunto : null, mensaje: f.mensaje,
      prospectoIds: validos.filter((d) => d.tipo === 'Prospecto').map((d) => d.id),
      clienteIds: validos.filter((d) => d.tipo === 'Cliente').map((d) => d.id),
    }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo="Nueva promoción" onCerrar={onCerrar} ancho="max-w-5xl">
      <form onSubmit={mandar} className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Campo etiqueta="Nombre interno *" error={errorDeCampo(enviar.error, 'nombre')}>
            <Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Ej. Descuento de octubre" required autoFocus />
          </Campo>
          <Segmentos etiqueta="Canal" valor={f.canal} onCambiar={(canal) => setF({ ...f, canal })}
            opciones={[{ valor: 'Sms', texto: 'SMS' }, { valor: 'Correo', texto: 'Correo' }]} />
          <AvisoSimulado canal={f.canal} />
          {f.canal === 'Correo' && (
            <Campo etiqueta="Asunto *"><Input value={f.asunto} onChange={(e) => setF({ ...f, asunto: e.target.value })} required /></Campo>
          )}
          <Campo etiqueta="Mensaje *" ayuda="Puedes usar {nombre} y {empresa}." error={errorDeCampo(enviar.error, 'mensaje')}>
            <Textarea rows={f.canal === 'Sms' ? 3 : 7} value={f.mensaje} onChange={(e) => setF({ ...f, mensaje: e.target.value })} required />
          </Campo>
          {f.mensaje && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Así se verá</p>
              <p className="whitespace-pre-line text-slate-700">{muestra}</p>
              {f.canal === 'Sms' && <p className={cn('mt-1 text-xs', muestra.length > 160 ? 'text-amber-700' : 'text-slate-500')}>{muestra.length} caracteres</p>}
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700">Destinatarios ({validos.length})</p>
            <div className="flex gap-1">
              <Boton tamano="sm" variante="fantasma" onClick={todos}>Todos los visibles</Boton>
              <Boton tamano="sm" variante="fantasma" onClick={() => setElegidos(new Set())}>Ninguno</Boton>
            </div>
          </div>
          <Buscador placeholder="Buscar…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
          <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-slate-200">
            {isLoading ? <Cargando /> : visibles.length === 0 ? <Vacio mensaje="Sin resultados." className="p-4" /> : (
              <ul className="divide-y divide-slate-100 text-sm">
                {visibles.map((d) => {
                  const dato = contacto(d)
                  return (
                    <li key={clave(d)}>
                      <label className={cn('flex items-center gap-3 px-3 py-2', dato ? 'cursor-pointer hover:bg-slate-50' : 'opacity-50')}>
                        <input type="checkbox" className="h-4 w-4 accent-marca-600" disabled={!dato}
                          checked={elegidos.has(clave(d)) && !!dato} onChange={() => alternar(d)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-slate-800">{d.nombre}</span>
                          <span className="block truncate text-xs text-slate-500">{d.tipo}{d.empresa ? ` · ${d.empresa}` : ''}</span>
                        </span>
                        <span className="text-xs text-slate-500 tabular-nums">{dato ?? (f.canal === 'Sms' ? 'Sin celular' : 'Sin correo')}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <PieFormulario error={enviar.error} guardando={enviar.isPending} onCancelar={onCerrar} textoGuardar={`Enviar a ${validos.length}`} />
        </div>
      </form>
    </Modal>
  )
}
