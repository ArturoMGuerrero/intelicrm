import { useEnviarMensajeCita, useEstadoMensajeria } from '../api/hooks'
import type { CanalMensaje, Cita, EstatusMensaje, MensajeEnviado, TipoPlantilla } from '../api/tipos'
import { formatoFechaHora } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'
import { Aviso, Boton, Celda, Doble, Fila, Insignia, Tabla, Tarjeta, Vacio, type Tono } from './ui'

const tonoMensaje: Record<EstatusMensaje, Tono> = { Enviado: 'verde', Simulado: 'ambar', Error: 'rojo' }

export function InsigniaMensaje({ estatus }: { estatus: EstatusMensaje }) {
  return <Insignia tono={tonoMensaje[estatus]}>{estatus}</Insignia>
}

/** Avisa si el canal no tiene proveedor configurado (los envíos solo se registran). */
export function AvisoSimulado({ canal }: { canal?: CanalMensaje }) {
  const { data } = useEstadoMensajeria()
  if (!data) return null
  const faltan = [
    (!canal || canal === 'Sms') && !data.smsConfigurado && 'SMS',
    (!canal || canal === 'Correo') && !data.correoConfigurado && 'correo',
  ].filter(Boolean)
  if (faltan.length === 0) return null
  return (
    <Aviso>
      Modo simulado para {faltan.join(' y ')}: los mensajes se registran pero no se envían. Configura el proveedor en la
      sección «Mensajeria» del backend (ver README).
    </Aviso>
  )
}

export function TablaMensajes({ mensajes }: { mensajes: MensajeEnviado[] }) {
  if (mensajes.length === 0) return <Tarjeta><Vacio mensaje="Aún no se han enviado mensajes." /></Tarjeta>
  return (
    <Tabla columnas={[{ titulo: 'Fecha' }, { titulo: 'Para' }, { titulo: 'Origen' }, { titulo: 'Mensaje' }, { titulo: 'Estatus' }]}>
      {mensajes.map((m) => (
        <Fila key={m.id}>
          <Celda className="whitespace-nowrap text-slate-600 tabular-nums">{formatoFechaHora(m.fecha)}</Celda>
          <Celda><Doble principal={m.nombreDestinatario ?? m.destinatario} secundario={`${m.canal === 'Sms' ? 'SMS' : 'Correo'} · ${m.destinatario}`} /></Celda>
          <Celda className="text-slate-600">{m.origen}</Celda>
          <Celda className="max-w-md">
            {m.asunto && <p className="font-medium text-slate-800">{m.asunto}</p>}
            <p className="line-clamp-2 text-slate-600" title={m.cuerpo}>{m.cuerpo}</p>
            {m.error && <p className="text-xs text-rose-600">{m.error}</p>}
          </Celda>
          <Celda><InsigniaMensaje estatus={m.estatus} /></Celda>
        </Fila>
      ))}
    </Tabla>
  )
}

/** Botones para mandar confirmación o recordatorio de una cita futura al prospecto. */
export function AvisosCita({ cita }: { cita: Cita }) {
  const { puede } = useSesion()
  const enviar = useEnviarMensajeCita()
  const vigente = (cita.estatus === 'Programada' || cita.estatus === 'Confirmada') && new Date(cita.fechaHoraInicio) > new Date()
  if (!vigente || !puede('citas.editar')) return null

  const boton = (tipo: TipoPlantilla, canal: CanalMensaje, texto: string) => (
    <Boton tamano="sm" disabled={enviar.isPending} onClick={() => enviar.mutate({ citaId: cita.id, canal, tipo })}>{texto}</Boton>
  )
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-sm font-medium text-slate-700">Avisar al prospecto</p>
      <div className="flex flex-wrap gap-2">
        {boton('ConfirmacionCita', 'Sms', 'Confirmación por SMS')}
        {boton('ConfirmacionCita', 'Correo', 'Confirmación por correo')}
        {boton('RecordatorioCita', 'Sms', 'Recordatorio por SMS')}
        {boton('RecordatorioCita', 'Correo', 'Recordatorio por correo')}
      </div>
    </div>
  )
}
