import { useState, type FormEvent } from 'react'
import { api } from '../api/cliente'
import { useEliminarFormato, useFormatos, useSubirFormato } from '../api/hooks'
import type { Formato } from '../api/tipos'
import {
  Boton, BotonIcono, Campo, Cargando, Celda, CeldaAcciones, Doble, Encabezado, Fila, Input, MensajeError, Modal, notificar,
  PieFormulario, Tabla, Tarjeta, useConfirmar, Vacio,
} from '../components/ui'
import { formatoFecha } from '../lib/formato'
import { SiPuede } from '../sesion/Sesion'

const TAMANO_MAXIMO = 5 * 1024 * 1024

const tamano = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`

/** Formatos descargables: contratos, solicitudes, políticas (antes "Formatos"). */
export default function Formatos() {
  const confirmar = useConfirmar()
  const { data, isLoading, error } = useFormatos()
  const eliminar = useEliminarFormato()
  const [subiendo, setSubiendo] = useState(false)

  const descargar = (f: Formato) => api.descargar(`/formatos/${f.id}/archivo`, f.nombreArchivo).catch(notificar.error)
  const quitar = async (f: Formato) => {
    if (await confirmar({ titulo: 'Eliminar formato', mensaje: <>¿Eliminar <b>{f.nombre}</b>?</>, textoConfirmar: 'Eliminar', peligro: true }))
      eliminar.mutate(f.id)
  }

  return (
    <>
      <Encabezado titulo="Formatos" descripcion="Documentos que el equipo descarga y llena: contratos, solicitudes, políticas…"
        acciones={<SiPuede permiso="formatos.editar"><Boton variante="primario" icono="mas" onClick={() => setSubiendo(true)}>Subir formato</Boton></SiPuede>} />

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay formatos." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Formato' }, { titulo: 'Categoría' }, { titulo: 'Tamaño', derecha: true }, { titulo: 'Subido' }, { titulo: '' }]}>
          {data.map((f) => (
            <Fila key={f.id}>
              <Celda><Doble principal={f.nombre} secundario={f.nombreArchivo} /></Celda>
              <Celda className="text-slate-600">{f.categoria ?? '—'}</Celda>
              <Celda derecha className="text-slate-600 tabular-nums">{tamano(f.tamano)}</Celda>
              <Celda className="text-slate-600 tabular-nums">{formatoFecha(f.fechaCreacion)}</Celda>
              <CeldaAcciones>
                <Boton tamano="sm" icono="abajo" onClick={() => descargar(f)}>Descargar</Boton>
                <SiPuede permiso="formatos.eliminar"><BotonIcono icono="basura" etiqueta="Eliminar" peligro onClick={() => quitar(f)} /></SiPuede>
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}

      {subiendo && <FormSubir onCerrar={() => setSubiendo(false)} />}
    </>
  )
}

function FormSubir({ onCerrar }: { onCerrar: () => void }) {
  const subir = useSubirFormato()
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!archivo) return
    if (archivo.size > TAMANO_MAXIMO) return notificar.error('El archivo pesa más de 5 MB.')
    const datos = new FormData()
    datos.append('nombre', nombre)
    if (categoria.trim()) datos.append('categoria', categoria)
    datos.append('archivo', archivo)
    subir.mutate(datos, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo="Subir formato" onCerrar={onCerrar} ancho="max-w-md">
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Archivo *" ayuda="PDF, Word, Excel, PowerPoint, imágenes, texto o ZIP. Máximo 5 MB.">
          <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.zip" required
            onChange={(e) => {
              const elegido = e.target.files?.[0] ?? null
              setArchivo(elegido)
              if (elegido && !nombre) setNombre(elegido.name.replace(/\.[^.]+$/, ''))
            }} />
        </Campo>
        <Campo etiqueta="Nombre *"><Input value={nombre} onChange={(e) => setNombre(e.target.value)} required /></Campo>
        <Campo etiqueta="Categoría"><Input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Contratos, Ventas, RH…" /></Campo>
        <PieFormulario error={subir.error} guardando={subir.isPending} onCancelar={onCerrar} textoGuardar="Subir" />
      </form>
    </Modal>
  )
}
