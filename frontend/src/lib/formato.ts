const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const fecha = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
const fechaHora = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const hora = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' })
const diaLargo = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const formatoMoneda = (valor: number | null | undefined) => (valor == null ? '—' : moneda.format(valor))

/** Acepta "2026-09-29" (DateOnly) o "2026-09-29T10:00:00" (DateTime local). */
export const aFecha = (texto: string) => (texto.length === 10 ? new Date(`${texto}T00:00:00`) : new Date(texto))

export const formatoFecha = (texto: string) => fecha.format(aFecha(texto))
export const formatoFechaHora = (texto: string) => fechaHora.format(aFecha(texto))
export const formatoHora = (texto: string) => hora.format(aFecha(texto))
export const formatoDiaLargo = (d: Date) => diaLargo.format(d)

const dos = (n: number) => String(n).padStart(2, '0')

/** Fecha local en formato yyyy-MM-dd (lo que espera un DateOnly o un <input type="date">). */
export const aIsoFecha = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`

/** Fecha y hora local yyyy-MM-ddTHH:mm (lo que usa <input type="datetime-local">). */
export const aIsoFechaHora = (d: Date) => `${aIsoFecha(d)}T${dos(d.getHours())}:${dos(d.getMinutes())}`

export const sumarDias = (d: Date, dias: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + dias)
  return r
}
