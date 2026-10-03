import { useState } from 'react'
import { useGuardarHorario, useHorario } from '../api/hooks'
import type { BloqueHorario, DiaSemana, Empleado } from '../api/tipos'
import { Boton, BotonIcono, Cargando, Input, MensajeError, Modal, PieFormulario } from './ui'

const DIAS: { valor: DiaSemana; texto: string }[] = [
  { valor: 'Monday', texto: 'Lunes' }, { valor: 'Tuesday', texto: 'Martes' }, { valor: 'Wednesday', texto: 'Miércoles' },
  { valor: 'Thursday', texto: 'Jueves' }, { valor: 'Friday', texto: 'Viernes' }, { valor: 'Saturday', texto: 'Sábado' },
  { valor: 'Sunday', texto: 'Domingo' },
]

/** "09:00:00" → "09:00" (lo que usa <input type="time">). */
const hhmm = (hora: string) => hora.slice(0, 5)

/**
 * Horario laboral del empleado por día. Si tiene horario, sus citas deben caer dentro;
 * sin horario, se le puede agendar a cualquier hora.
 */
export function FormHorario({ empleado, onCerrar }: { empleado: Empleado; onCerrar: () => void }) {
  const { data, isLoading, error } = useHorario(empleado.id)
  return (
    <Modal abierto titulo={`Horario · ${empleado.nombreCompleto}`} onCerrar={onCerrar} ancho="max-w-xl">
      {isLoading ? <Cargando /> : error || !data ? <MensajeError error={error} /> : <Editor inicial={data} empleadoId={empleado.id} onCerrar={onCerrar} />}
    </Modal>
  )
}

function Editor({ inicial, empleadoId, onCerrar }: { inicial: BloqueHorario[]; empleadoId: number; onCerrar: () => void }) {
  const guardar = useGuardarHorario()
  const [bloques, setBloques] = useState(() => inicial.map((b) => ({ ...b, horaInicio: hhmm(b.horaInicio), horaFin: hhmm(b.horaFin) })))

  const agregar = (dia: DiaSemana) => setBloques([...bloques, { dia, horaInicio: '09:00', horaFin: '18:00' }])
  const cambiar = (i: number, cambios: Partial<BloqueHorario>) => setBloques(bloques.map((b, j) => (j === i ? { ...b, ...cambios } : b)))
  const copiarLunesAViernes = () => {
    const lunes = bloques.filter((b) => b.dia === 'Monday')
    const otros = bloques.filter((b) => !['Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(b.dia))
    setBloques([...otros, ...(['Tuesday', 'Wednesday', 'Thursday', 'Friday'] as DiaSemana[]).flatMap((dia) => lunes.map((b) => ({ ...b, dia })))])
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); guardar.mutate({ empleadoId, bloques }, { onSuccess: onCerrar }) }} className="space-y-4">
      <p className="text-sm text-slate-600">
        Las citas de este empleado deberán caer dentro de su horario. Deja todos los días vacíos para no restringir.
      </p>
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {DIAS.map((d) => {
          const delDia = bloques.map((b, i) => ({ b, i })).filter(({ b }) => b.dia === d.valor)
          return (
            <li key={d.valor} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start">
              <span className="w-24 pt-2 text-sm font-medium text-slate-700">{d.texto}</span>
              <div className="flex-1 space-y-2">
                {delDia.length === 0 && <p className="pt-2 text-sm text-slate-400">No trabaja</p>}
                {delDia.map(({ b, i }) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input type="time" className="w-32" value={b.horaInicio} aria-label={`${d.texto} desde`}
                      onChange={(e) => cambiar(i, { horaInicio: e.target.value })} required />
                    <span className="text-slate-400">a</span>
                    <Input type="time" className="w-32" value={b.horaFin} aria-label={`${d.texto} hasta`}
                      onChange={(e) => cambiar(i, { horaFin: e.target.value })} required />
                    <BotonIcono icono="basura" etiqueta="Quitar bloque" peligro onClick={() => setBloques(bloques.filter((_, j) => j !== i))} />
                  </div>
                ))}
              </div>
              <Boton tamano="sm" variante="fantasma" icono="mas" onClick={() => agregar(d.valor)}>Bloque</Boton>
            </li>
          )
        })}
      </ul>
      <Boton tamano="sm" onClick={copiarLunesAViernes} disabled={!bloques.some((b) => b.dia === 'Monday')}>
        Copiar el lunes de martes a viernes
      </Boton>
      <PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} textoGuardar="Guardar horario" />
    </form>
  )
}
