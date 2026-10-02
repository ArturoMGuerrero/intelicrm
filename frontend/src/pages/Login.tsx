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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-900 to-fuchsia-900 p-4">
      {/* Manchas de color decorativas */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-sky-500/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-marca-500 to-sky-400 text-2xl font-bold text-white shadow-xl shadow-fuchsia-500/40 ring-4 ring-white/10">
            iC
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Inteli<span className="text-fuchsia-300">CRM</span></h1>
            <p className="mt-1 text-sm text-indigo-200">Inicia sesión para continuar</p>
          </div>
        </div>

        <form onSubmit={enviar} className="space-y-4 rounded-2xl bg-white/95 p-6 shadow-2xl shadow-indigo-950/50 ring-1 ring-white/20 backdrop-blur">
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
