import { useState, type FormEvent } from 'react'
import { useCrearTicket, useTickets } from '../api/hooks'
import { InsigniaMensaje } from '../components/Mensajeria'
import { Boton, Campo, Cargando, Encabezado, errorDeCampo, Input, MensajeError, Tarjeta, Textarea, Vacio } from '../components/ui'
import { formatoFechaHora } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'

/** Mensajes al equipo de soporte de InteliCRM (antes "Soporte"). */
export default function Soporte() {
  const { usuario } = useSesion()
  const crear = useCrearTicket()
  const tickets = useTickets()
  const vacio = { asunto: '', mensaje: '', nombreContacto: usuario?.nombre ?? '', correoContacto: usuario?.correo ?? '' }
  const [f, setF] = useState(vacio)
  const err = (c: string) => errorDeCampo(crear.error, c)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    crear.mutate(f, { onSuccess: () => setF(vacio) })
  }

  return (
    <>
      <Encabezado titulo="Soporte" descripcion="¿Tienes una duda o encontraste un problema? Escríbenos y te responderemos por correo." />
      <div className="grid gap-6 lg:grid-cols-5">
        <Tarjeta titulo="Nuevo mensaje" className="lg:col-span-3">
          <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Tu nombre *" error={err('nombreContacto')}>
              <Input value={f.nombreContacto} onChange={(e) => setF({ ...f, nombreContacto: e.target.value })} required />
            </Campo>
            <Campo etiqueta="Correo para responderte *" error={err('correoContacto')}>
              <Input type="email" value={f.correoContacto} onChange={(e) => setF({ ...f, correoContacto: e.target.value })} required />
            </Campo>
            <Campo etiqueta="Asunto *" className="sm:col-span-2" error={err('asunto')}>
              <Input value={f.asunto} onChange={(e) => setF({ ...f, asunto: e.target.value })} required />
            </Campo>
            <Campo etiqueta="Mensaje *" className="sm:col-span-2" error={err('mensaje')}>
              <Textarea rows={6} value={f.mensaje} onChange={(e) => setF({ ...f, mensaje: e.target.value })} required
                placeholder="Describe qué intentabas hacer, qué pasó y en qué pantalla." />
            </Campo>
            <div className="space-y-3 sm:col-span-2">
              <MensajeError error={crear.error} />
              <div className="flex justify-end"><Boton type="submit" variante="primario" cargando={crear.isPending} textoCargando="Enviando…">Enviar</Boton></div>
            </div>
          </form>
        </Tarjeta>

        <Tarjeta titulo="Mensajes enviados" className="lg:col-span-2">
          {tickets.isLoading ? <Cargando /> : !tickets.data?.length ? <Vacio mensaje="Aún no has escrito a soporte." className="p-4" /> : (
            <ul className="divide-y divide-slate-100">
              {tickets.data.map((t) => (
                <li key={t.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900">{t.asunto}</p>
                    <InsigniaMensaje estatus={t.estatusEnvio} />
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600">{t.mensaje}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatoFechaHora(t.fecha)} · {t.nombreContacto}</p>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </>
  )
}
