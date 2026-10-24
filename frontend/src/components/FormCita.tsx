import { useState, type FormEvent } from 'react'
import { useCatalogo, useClientes, useEmpleados, useEnviarMensajeCita, useGuardarCita, useProspectos } from '../api/hooks'
import type { CanalMensaje, Cita } from '../api/tipos'
import { aIsoFechaHora } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'
import { AvisosCita } from './Mensajeria'
import { Campo, Checkbox, errorDeCampo, Input, Modal, nulo, numeroONulo, PieFormulario, Segmentos, Select, Textarea } from './ui'

interface Props {
  cita?: Cita
  /** Valores iniciales para una cita nueva (p. ej. desde el detalle de un prospecto o de un cliente). */
  prospectoId?: number
  clienteId?: number
  fecha?: Date
  notas?: string
  onCerrar: () => void
}

type Con = 'prospecto' | 'cliente'

function horaSugerida(fecha?: Date) {
  const d = fecha ? new Date(fecha) : new Date()
  // Siguiente media hora a partir de ahora (o 9:00 si es otro día).
  if (!fecha || d.toDateString() === new Date().toDateString()) {
    const ahora = new Date()
    d.setHours(ahora.getHours(), ahora.getMinutes() < 30 ? 30 : 60, 0, 0)
  } else {
    d.setHours(9, 0, 0, 0)
  }
  return aIsoFechaHora(d)
}

export default function FormCita({ cita, prospectoId, clienteId, fecha, notas, onCerrar }: Props) {
  const { usuario, puede } = useSesion()
  const guardar = useGuardarCita()
  const enviarAviso = useEnviarMensajeCita()
  const prospectos = useProspectos()
  const clientes = useClientes()
  const empleados = useEmpleados()
  const acciones = useCatalogo('acciones-actividades')

  const [con, setCon] = useState<Con>((cita?.clienteId ?? clienteId) ? 'cliente' : 'prospecto')
  const [f, setF] = useState({
    prospectoId: (cita?.prospectoId ?? prospectoId)?.toString() ?? '',
    clienteId: (cita?.clienteId ?? clienteId)?.toString() ?? '',
    // En una cita nueva, sugerir al empleado vinculado al usuario.
    empleadoId: (cita?.empleadoId ?? usuario?.empleadoId)?.toString() ?? '',
    accionActividadId: cita?.accionActividadId?.toString() ?? '',
    fechaHoraInicio: cita ? cita.fechaHoraInicio.slice(0, 16) : horaSugerida(fecha),
    duracionMinutos: cita?.duracionMinutos.toString() ?? '',
    lugar: cita?.lugar ?? '',
    notas: cita?.notas ?? notas ?? '',
  })
  // "Guardar y enviar": manda la confirmación al guardar una cita nueva (antes "Guardar y Enviar").
  const [confirmarPor, setConfirmarPor] = useState<CanalMensaje | ''>('')
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (campo: string) => errorDeCampo(guardar.error, campo)

  // Al elegir una acción, sugerir su duración si el usuario no escribió una.
  const cambiarAccion = (e: { target: { value: string } }) => {
    const accion = acciones.data?.find((a) => a.id === Number(e.target.value))
    setF({
      ...f,
      accionActividadId: e.target.value,
      duracionMinutos: f.duracionMinutos || (accion?.duracionMinutos?.toString() ?? ''),
    })
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate(
      {
        id: cita?.id,
        datos: {
          prospectoId: con === 'prospecto' ? Number(f.prospectoId) : null,
          clienteId: con === 'cliente' ? Number(f.clienteId) : null,
          empleadoId: Number(f.empleadoId),
          accionActividadId: numeroONulo(f.accionActividadId),
          fechaHoraInicio: f.fechaHoraInicio,
          duracionMinutos: numeroONulo(f.duracionMinutos),
          lugar: nulo(f.lugar),
          notas: nulo(f.notas),
        },
      },
      {
        onSuccess: (guardada) => {
          if (confirmarPor && !cita) enviarAviso.mutate({ citaId: (guardada as Cita).id, canal: confirmarPor, tipo: 'ConfirmacionCita' })
          onCerrar()
        },
      },
    )
  }

  return (
    <Modal abierto titulo={cita ? 'Editar cita' : 'Nueva cita'} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Segmentos etiqueta="La cita es con" valor={con} onCambiar={setCon}
            opciones={[{ valor: 'prospecto', texto: 'Prospecto' }, { valor: 'cliente', texto: 'Cliente' }]} />
        </div>
        {con === 'prospecto' ? (
          <Campo etiqueta="Prospecto *" className="sm:col-span-2" error={err('prospectoId')}>
            <Select value={f.prospectoId} onChange={cambiar('prospectoId')} required>
              <option value="">Selecciona…</option>
              {prospectos.data?.map((p) => (
                <option key={p.id} value={p.id}>{p.nombreCompleto}{p.empresa ? ` — ${p.empresa}` : ''}</option>
              ))}
            </Select>
          </Campo>
        ) : (
          <Campo etiqueta="Cliente *" className="sm:col-span-2" error={err('clienteId')}>
            <Select value={f.clienteId} onChange={cambiar('clienteId')} required>
              <option value="">Selecciona…</option>
              {clientes.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.razonSocial}{c.contactoPrincipal ? ` — ${c.contactoPrincipal}` : ''}</option>
              ))}
            </Select>
          </Campo>
        )}
        <Campo etiqueta="Empleado *" error={err('empleadoId')}>
          <Select value={f.empleadoId} onChange={cambiar('empleadoId')} required>
            <option value="">Selecciona…</option>
            {empleados.data?.map((e) => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Acción / actividad">
          <Select value={f.accionActividadId} onChange={cambiarAccion}>
            <option value="">—</option>
            {acciones.data?.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Fecha y hora *" error={err('fechaHoraInicio')}>
          <Input type="datetime-local" value={f.fechaHoraInicio} onChange={cambiar('fechaHoraInicio')} required />
        </Campo>
        <Campo etiqueta="Duración (min)" error={err('duracionMinutos')}>
          <Input type="number" min="5" max="480" step="5" placeholder="30" value={f.duracionMinutos} onChange={cambiar('duracionMinutos')} />
        </Campo>
        <Campo etiqueta="Lugar" className="sm:col-span-2" error={err('lugar')}>
          <Input value={f.lugar} onChange={cambiar('lugar')} placeholder="Oficina, domicilio del cliente, videollamada…" />
        </Campo>
        <Campo etiqueta="Notas" className="sm:col-span-2">
          <Textarea rows={2} value={f.notas} onChange={cambiar('notas')} />
        </Campo>
        {!cita && puede('citas.editar') && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-slate-50 px-3 py-2.5 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Al guardar, enviar confirmación por:</span>
            <Checkbox etiqueta="SMS" checked={confirmarPor === 'Sms'} onChange={(e) => setConfirmarPor(e.target.checked ? 'Sms' : '')} />
            <Checkbox etiqueta="Correo" checked={confirmarPor === 'Correo'} onChange={(e) => setConfirmarPor(e.target.checked ? 'Correo' : '')} />
          </div>
        )}
        {cita && <div className="sm:col-span-2"><AvisosCita cita={cita} /></div>}
        <div className="sm:col-span-2">
          <PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar}
            textoGuardar={confirmarPor && !cita ? 'Guardar y enviar' : undefined} />
        </div>
      </form>
    </Modal>
  )
}
