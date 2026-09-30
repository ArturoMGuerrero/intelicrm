import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Boton, Campo, Input, MensajeError } from '../components/ui'
import { useSesion } from '../sesion/Sesion'

export default function Login() {
  const { usuario, iniciarSesion } = useSesion()
  const destino = (useLocation().state as { desde?: string } | null)?.desde ?? '/'
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<unknown>(null)

  if (usuario) return <Navigate to={destino} replace />

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await iniciarSesion(correo, password)
    } catch (err) {
      setError(err)
      setPassword('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-marca-50 via-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-marca-600 text-lg font-bold text-white shadow-sm">iC</div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">InteliCRM</h1>
            <p className="mt-1 text-sm text-slate-500">Inicia sesión para continuar</p>
          </div>
        </div>

        <form onSubmit={enviar} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Campo etiqueta="Correo">
            <Input type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} required autoFocus />
          </Campo>
          <Campo etiqueta="Contraseña">
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Campo>
          <MensajeError error={error} />
          <Boton type="submit" variante="primario" className="w-full" cargando={enviando} textoCargando="Entrando…">
            Entrar
          </Boton>
        </form>
      </div>
    </div>
  )
}
