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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-marca-900 p-4">
      {/* Manchas de color decorativas */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-marca-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-sky-500/15 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-marca-600 text-2xl font-bold text-white shadow-lg ring-4 ring-white/10">
            iC
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Inteli<span className="text-marca-300">CRM</span></h1>
            <p className="mt-1 text-sm text-slate-300">Inicia sesión para continuar</p>
          </div>
        </div>

        <form onSubmit={enviar} className="space-y-4 rounded-2xl bg-white/95 p-6 shadow-2xl ring-1 ring-white/10">
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
