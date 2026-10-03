import { useState } from 'react'
import { useEstadoMensajeria, useGuardarPlantilla, useHistorialMensajes, usePlantillas } from '../api/hooks'
import type { CanalMensaje, Plantilla } from '../api/tipos'
import { AvisoSimulado, TablaMensajes } from '../components/Mensajeria'
import {
  Boton, Campo, Cargando, cn, Encabezado, errorDeCampo, FiltroChips, Input, Insignia, MensajeError, Segmentos, Tarjeta, Textarea,
} from '../components/ui'
import { useSesion } from '../sesion/Sesion'

const titulos = { ConfirmacionCita: 'Confirmación de cita', RecordatorioCita: 'Recordatorio de cita' } as const

/** Valores de ejemplo para la vista previa (como en "Definición de mensajes" del original). */
const ejemplo: Record<string, string> = {
  '{prospecto}': 'Mariana Torres', '{fecha}': 'lunes 12 de octubre', '{hora}': '11:30',
  '{ejecutivo}': 'Sofía Ramírez', '{actividad}': 'Demostración', '{empresa}': 'Comercializadora Demo',
}
const vistaPrevia = (texto: string) => Object.entries(ejemplo).reduce((t, [k, v]) => t.replaceAll(k, v), texto)

/** Plantillas de mensajes de citas (antes "Definición de mensajes") e historial de envíos. */
export default function Mensajes() {
  const [vista, setVista] = useState<'plantillas' | 'historial'>('plantillas')
  return (
    <>
      <Encabezado titulo="Mensajes" descripcion="Textos de confirmación y recordatorio de citas, e historial de todo lo enviado." />
      <div className="mb-4 space-y-3">
        <AvisoSimulado />
        <Segmentos etiqueta="Vista" valor={vista} onCambiar={setVista}
          opciones={[{ valor: 'plantillas', texto: 'Plantillas' }, { valor: 'historial', texto: 'Historial' }]} />
      </div>
      {vista === 'plantillas' ? <Plantillas /> : <Historial />}
    </>
  )
}

function Plantillas() {
  const { data, isLoading, error } = usePlantillas()
  const estado = useEstadoMensajeria().data
  if (isLoading) return <Cargando />
  if (error || !data) return <MensajeError error={error} />
  return (
    <div className="space-y-6">
      {estado && (
        <p className="text-sm text-slate-600">
          Variables disponibles: {estado.variables.map((v) => <code key={v} className="mx-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs">{v}</code>)}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {data.map((p) => <EditorPlantilla key={`${p.tipo}-${p.canal}`} plantilla={p} />)}
      </div>
    </div>
  )
}

function EditorPlantilla({ plantilla }: { plantilla: Plantilla }) {
  const { puede } = useSesion()
  const guardar = useGuardarPlantilla()
  const [f, setF] = useState({ asunto: plantilla.asunto ?? '', cuerpo: plantilla.cuerpo })
  const esSms = plantilla.canal === 'Sms'
  const cambiado = f.asunto !== (plantilla.asunto ?? '') || f.cuerpo !== plantilla.cuerpo
  const largo = vistaPrevia(f.cuerpo).length

  return (
    <Tarjeta titulo={
      <span className="flex items-center gap-2">
        {titulos[plantilla.tipo]} <Insignia tono={esSms ? 'cielo' : 'indigo'}>{esSms ? 'SMS' : 'Correo'}</Insignia>
        {!plantilla.personalizada && <Insignia>Sugerida</Insignia>}
      </span>
    }>
      <form className="space-y-3" onSubmit={(e) => {
        e.preventDefault()
        guardar.mutate({ tipo: plantilla.tipo, canal: plantilla.canal, asunto: esSms ? null : f.asunto, cuerpo: f.cuerpo })
      }}>
        <fieldset disabled={!puede('mensajes.editar')} className="space-y-3">
          {!esSms && (
            <Campo etiqueta="Asunto" error={errorDeCampo(guardar.error, 'asunto')}>
              <Input value={f.asunto} onChange={(e) => setF({ ...f, asunto: e.target.value })} required />
            </Campo>
          )}
          <Campo etiqueta="Mensaje" error={errorDeCampo(guardar.error, 'cuerpo')}>
            <Textarea rows={esSms ? 3 : 6} value={f.cuerpo} onChange={(e) => setF({ ...f, cuerpo: e.target.value })} required />
          </Campo>
        </fieldset>
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Vista previa</p>
          {!esSms && <p className="font-medium text-slate-800">{vistaPrevia(f.asunto)}</p>}
          <p className="whitespace-pre-line text-slate-700">{vistaPrevia(f.cuerpo)}</p>
          {esSms && (
            <p className={cn('mt-1 text-xs', largo > 160 ? 'text-amber-700' : 'text-slate-500')}>
              {largo} caracteres{largo > 160 && ' · se cobrará como 2 SMS'}
            </p>
          )}
        </div>
        <MensajeError error={guardar.error} />
        {puede('mensajes.editar') && (
          <div className="flex justify-end">
            <Boton type="submit" variante="primario" tamano="sm" disabled={!cambiado && plantilla.personalizada} cargando={guardar.isPending}>
              Guardar
            </Boton>
          </div>
        )}
      </form>
    </Tarjeta>
  )
}

function Historial() {
  const [canal, setCanal] = useState<CanalMensaje | ''>('')
  const { data, isLoading, error } = useHistorialMensajes({ canal })
  return (
    <>
      <FiltroChips valor={canal} onCambiar={setCanal}
        opciones={[{ valor: '', texto: 'Todos' }, { valor: 'Sms', texto: 'SMS' }, { valor: 'Correo', texto: 'Correo' }]} />
      <MensajeError error={error} />
      {isLoading ? <Cargando /> : <TablaMensajes mensajes={data ?? []} />}
    </>
  )
}
