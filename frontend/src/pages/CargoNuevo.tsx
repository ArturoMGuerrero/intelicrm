import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import {
  useAlmacenes, useCatalogo, useClientes, useCrearCargo, useEmpleados, usePreciosCliente, useProductos, useProspectos,
} from '../api/hooks'
import { EditorPartidas, partidaVacia, partidasParaApi, type PartidaForm } from '../components/EditorPartidas'
import {
  Boton, BotonEnlace, Campo, Encabezado, errorDeCampo, Icono, Input, MensajeError, nulo, Select, Tarjeta, Textarea,
} from '../components/ui'
import { aIsoFecha } from '../lib/formato'
import { useSesion } from '../sesion/Sesion'

/** Captura de un cargo directo (sin cotización previa). */
export default function CargoNuevo() {
  const navegar = useNavigate()
  const { usuario } = useSesion()
  const [params] = useSearchParams()
  const crear = useCrearCargo()
  const prospectos = useProspectos()
  const clientes = useClientes()
  const empleados = useEmpleados()
  const productos = useProductos()
  const condiciones = useCatalogo('condiciones-pago').data ?? []
  const almacenes = useAlmacenes().data ?? []

  const [para, setPara] = useState<'prospecto' | 'cliente'>(params.get('clienteId') ? 'cliente' : 'prospecto')
  const [f, setF] = useState({
    prospectoId: params.get('prospectoId') ?? '',
    clienteId: params.get('clienteId') ?? '',
    empleadoId: usuario?.empleadoId?.toString() ?? '',
    fecha: aIsoFecha(new Date()),
    condicionPagoId: '',
    diasCredito: '0',
    almacenId: '',
    notas: '',
  })
  const [partidas, setPartidas] = useState<PartidaForm[]>(() => [partidaVacia()])
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })

  // Si el destinatario es (o está ligado a) un cliente con lista de precios, se usan sus precios.
  const clienteEfectivo = para === 'cliente' ? Number(f.clienteId) || undefined
    : prospectos.data?.find((p) => p.id === Number(f.prospectoId))?.clienteId ?? undefined
  const precios = usePreciosCliente(clienteEfectivo)

  // Al elegir una condición de pago se proponen sus días de crédito.
  const elegirCondicion = (id: string) => {
    const condicion = condiciones.find((c) => c.id === Number(id))
    setF({ ...f, condicionPagoId: id, diasCredito: condicion?.diasCredito?.toString() ?? f.diasCredito })
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    crear.mutate({
      prospectoId: para === 'prospecto' && f.prospectoId ? Number(f.prospectoId) : null,
      clienteId: para === 'cliente' && f.clienteId ? Number(f.clienteId) : null,
      empleadoId: f.empleadoId ? Number(f.empleadoId) : null,
      fecha: f.fecha,
      condicionPagoId: f.condicionPagoId ? Number(f.condicionPagoId) : null,
      diasCredito: Number(f.diasCredito),
      almacenId: f.almacenId ? Number(f.almacenId) : null,
      notas: nulo(f.notas),
      partidas: partidasParaApi(partidas),
    }, { onSuccess: (c) => navegar(`/cargos/${c.id}`, { replace: true }) })
  }

  return (
    <form onSubmit={enviar}>
      <Link to="/cargos" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <Icono nombre="izquierda" className="h-4 w-4" /> Cargos
      </Link>
      <Encabezado titulo="Nuevo cargo" descripcion="Para cargar una cotización aceptada, ábrela y usa «Generar cargo»." />

      <div className="space-y-6">
        <Tarjeta className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Cargar a" className="lg:col-span-2">
            <div className="flex gap-2">
              <Select className="w-32" value={para} onChange={(e) => setPara(e.target.value as 'prospecto' | 'cliente')} aria-label="Tipo de destinatario">
                <option value="prospecto">Prospecto</option>
                <option value="cliente">Cliente</option>
              </Select>
              {para === 'prospecto' ? (
                <Select value={f.prospectoId} onChange={cambiar('prospectoId')} required aria-label="Prospecto">
                  <option value="">Selecciona…</option>
                  {prospectos.data?.map((p) => <option key={p.id} value={p.id}>{p.nombreCompleto}{p.empresa ? ` — ${p.empresa}` : ''}</option>)}
                </Select>
              ) : (
                <Select value={f.clienteId} onChange={cambiar('clienteId')} required aria-label="Cliente">
                  <option value="">Selecciona…</option>
                  {clientes.data?.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
                </Select>
              )}
            </div>
          </Campo>
          <Campo etiqueta="Vendedor">
            <Select value={f.empleadoId} onChange={cambiar('empleadoId')}>
              <option value="">—</option>
              {empleados.data?.map((e) => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="Fecha"><Input type="date" value={f.fecha} onChange={cambiar('fecha')} required /></Campo>
          <Campo etiqueta="Condición de pago" className="lg:col-span-2">
            <Select value={f.condicionPagoId} onChange={(e) => elegirCondicion(e.target.value)}>
              <option value="">— (indicar días)</option>
              {condiciones.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="Días de crédito" ayuda="0 = contado." error={errorDeCampo(crear.error, 'diasCredito')}>
            <Input type="number" min="0" max="365" value={f.diasCredito} onChange={cambiar('diasCredito')} required />
          </Campo>
          <Campo etiqueta="Surtir del almacén" ayuda="Vacío = no mueve inventario.">
            <Select value={f.almacenId} onChange={cambiar('almacenId')}>
              <option value="">—</option>
              {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </Select>
          </Campo>
        </Tarjeta>

        <EditorPartidas partidas={partidas} setPartidas={setPartidas} productos={productos.data} preciosEspeciales={precios.data} />

        <Tarjeta>
          <Campo etiqueta="Notas"><Textarea value={f.notas} onChange={cambiar('notas')} /></Campo>
        </Tarjeta>
      </div>

      <div className="mt-6 space-y-3">
        <MensajeError error={crear.error} />
        <div className="flex justify-end gap-2">
          <BotonEnlace to="/cargos">Cancelar</BotonEnlace>
          <Boton type="submit" variante="primario" cargando={crear.isPending}>Crear cargo</Boton>
        </div>
      </div>
    </form>
  )
}
