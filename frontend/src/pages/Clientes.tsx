import { useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { ApiError } from '../api/cliente'
import { useCatalogo, useClientes, useDesactivarCliente, useGuardarCliente, useListasPrecios } from '../api/hooks'
import type { Cliente, TipoPersona } from '../api/tipos'
import {
  BarraFiltros, Boton, BotonIcono, Buscador, Campo, Cargando, Celda, CeldaAcciones, Checkbox, cn, Doble, Encabezado,
  errorDeCampo, Fila, Input, Insignia, MensajeError, Modal, nulo, numeroONulo, PieFormulario, Segmentos, Select, Tabla, Tarjeta,
  Textarea, useConfirmar, Vacio,
} from '../components/ui'
import { etiquetaTasa, TASAS_IVA } from '../components/EditorPartidas'
import EstadoCuenta from '../components/EstadoCuenta'
import FormCita from '../components/FormCita'
import { SiPuede, useSesion } from '../sesion/Sesion'

export default function Clientes() {
  const confirmar = useConfirmar()
  const [parametros] = useSearchParams()
  const [buscar, setBuscar] = useState(parametros.get('buscar') ?? '')
  const [inactivos, setInactivos] = useState(false)
  const [editando, setEditando] = useState<Cliente | 'nuevo' | null>(null)
  const [estadoCuenta, setEstadoCuenta] = useState<Cliente | null>(null)
  const [cita, setCita] = useState<Cliente | null>(null)
  const { data, isLoading, error } = useClientes(buscar, inactivos)
  const desactivar = useDesactivarCliente()

  const darDeBaja = async (c: Cliente) => {
    if (await confirmar({ titulo: 'Dar de baja cliente', mensaje: <>¿Dar de baja a <b>{c.razonSocial}</b>?</>, textoConfirmar: 'Dar de baja', peligro: true }))
      desactivar.mutate(c.id)
  }

  return (
    <>
      <Encabezado titulo="Clientes" descripcion="Empresas y personas que ya compraron."
        acciones={<SiPuede permiso="clientes.editar"><Boton variante="primario" icono="mas" onClick={() => setEditando('nuevo')}>Nuevo cliente</Boton></SiPuede>} />

      <BarraFiltros>
        <Buscador placeholder="Buscar por razón social, RFC o contacto…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <Checkbox etiqueta="Mostrar inactivos" checked={inactivos} onChange={(e) => setInactivos(e.target.checked)} />
      </BarraFiltros>

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay clientes." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Razón social' }, { titulo: 'RFC' }, { titulo: 'Contacto' }, { titulo: 'Teléfono / correo' }, { titulo: 'Condiciones' }, { titulo: '' }]}>
          {data.map((c) => (
            <Fila key={c.id} inactiva={!c.activo}>
              <Celda>
                <Doble principal={c.razonSocial} secundario={c.nombreComercial} />
                {!c.activo && <Insignia className="mt-1">Inactivo</Insignia>}
              </Celda>
              <Celda className="font-mono text-xs">{c.rfc ?? '—'}</Celda>
              <Celda className="text-slate-600">
                <p>{c.contactoPrincipal ?? '—'}</p>
                {c.contactos.length > 1 && <p className="text-xs text-slate-500">+{c.contactos.length - 1} contactos más</p>}
              </Celda>
              <Celda className="text-slate-600"><p>{c.telefono ?? '—'}</p><p className="text-xs text-slate-500">{c.correo}</p></Celda>
              <Celda className="text-slate-600">
                <p>{c.condicionPago ?? '—'}</p>
                {c.zona && <p className="text-xs text-slate-500">Zona {c.zona}</p>}
              </Celda>
              <CeldaAcciones>
                <SiPuede permiso="cargos.ver"><BotonIcono icono="cobranza" etiqueta="Estado de cuenta" onClick={() => setEstadoCuenta(c)} /></SiPuede>
                {c.activo && <SiPuede permiso="citas.editar"><BotonIcono icono="citas" etiqueta="Agendar cita" onClick={() => setCita(c)} /></SiPuede>}
                <SiPuede permiso="clientes.editar"><BotonIcono icono="editar" etiqueta="Editar" onClick={() => setEditando(c)} /></SiPuede>
                {c.activo && <SiPuede permiso="clientes.eliminar"><BotonIcono icono="basura" etiqueta="Dar de baja" peligro onClick={() => darDeBaja(c)} /></SiPuede>}
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}

      {editando && <FormCliente cliente={editando === 'nuevo' ? undefined : editando} onCerrar={() => setEditando(null)} />}
      {estadoCuenta && (
        <Modal abierto titulo={`Estado de cuenta · ${estadoCuenta.razonSocial}`} onCerrar={() => setEstadoCuenta(null)} ancho="max-w-5xl">
          <EstadoCuenta clienteId={estadoCuenta.id} nombre={estadoCuenta.razonSocial} />
        </Modal>
      )}
      {cita && <FormCita clienteId={cita.id} onCerrar={() => setCita(null)} />}
    </>
  )
}

type PestanaCliente = 'general' | 'contactos' | 'direcciones' | 'pagos'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const contactoVacio = () => ({ nombre: '', puesto: '', tipoContactoId: '', telefono: '', extension: '', celular: '', correo: '', principal: false })
const direccionVacia = () => ({
  nombre: '', calle: '', numeroExterior: '', numeroInterior: '', colonia: '', codigoPostal: '', municipio: '', estado: '',
  pais: 'México', instrucciones: '', principal: false,
})
type FilaContacto = ReturnType<typeof contactoVacio>
type FilaDireccion = ReturnType<typeof direccionVacia>

const texto = (v: string | null | undefined) => v ?? ''
/** "09:00:00" → "09:00" para el control de hora, y de vuelta con segundos para la API. */
const hora = (v: string | null) => (v ? v.slice(0, 5) : '')
const horaApi = (v: string) => (v ? `${v}:00` : null)

function Seccion({ titulo, acciones }: { titulo: string; acciones?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-1 sm:col-span-2">
      <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{titulo}</p>
      {acciones}
    </div>
  )
}

function FormCliente({ cliente: c, onCerrar }: { cliente?: Cliente; onCerrar: () => void }) {
  const guardar = useGuardarCliente()
  const { puede } = useSesion()
  const listas = useListasPrecios(false, puede('listas-precios.ver')).data ?? []
  const tipos = useCatalogo('tipos-contacto').data ?? []
  const condiciones = useCatalogo('condiciones-pago').data ?? []
  const instrumentos = useCatalogo('instrumentos-pago').data ?? []
  const [pestana, setPestana] = useState<PestanaCliente>('general')

  const [f, setF] = useState({
    razonSocial: texto(c?.razonSocial), nombreComercial: texto(c?.nombreComercial), rfc: texto(c?.rfc),
    tipoPersona: c?.tipoPersona ?? ('Moral' as TipoPersona),
    telefono: texto(c?.telefono), correo: texto(c?.correo), direccion: texto(c?.direccion), zona: texto(c?.zona),
    listaPreciosId: c?.listaPreciosId?.toString() ?? '', tasaIva: c?.tasaIva?.toString() ?? '',
    condicionPagoId: c?.condicionPagoId?.toString() ?? '', instrumentoPagoId: c?.instrumentoPagoId?.toString() ?? '',
    banco: texto(c?.banco), numeroCuenta: texto(c?.numeroCuenta), clabe: texto(c?.clabe),
    diasRevision: c?.diasRevision ? c.diasRevision.split(',') : [] as string[],
    horaRevisionDesde: hora(c?.horaRevisionDesde ?? null), horaRevisionHasta: hora(c?.horaRevisionHasta ?? null),
    instruccionesContrarecibo: texto(c?.instruccionesContrarecibo), notas: texto(c?.notas), activo: c?.activo ?? true,
  })
  // Un cliente anterior con "contacto principal" escrito a mano pasa a ser su primer contacto.
  const [contactos, setContactos] = useState<FilaContacto[]>(() =>
    c?.contactos.length
      ? c.contactos.map((x) => ({
        nombre: x.nombre, puesto: texto(x.puesto), tipoContactoId: x.tipoContactoId?.toString() ?? '', telefono: texto(x.telefono),
        extension: texto(x.extension), celular: texto(x.celular), correo: texto(x.correo), principal: x.principal,
      }))
      : c?.contactoPrincipal ? [{ ...contactoVacio(), nombre: c.contactoPrincipal, telefono: texto(c.telefono), correo: texto(c.correo), principal: true }] : [])
  const [direcciones, setDirecciones] = useState<FilaDireccion[]>(() =>
    (c?.direcciones ?? []).map((x) => ({
      nombre: x.nombre, calle: x.calle, numeroExterior: texto(x.numeroExterior), numeroInterior: texto(x.numeroInterior),
      colonia: texto(x.colonia), codigoPostal: texto(x.codigoPostal), municipio: texto(x.municipio), estado: texto(x.estado),
      pais: x.pais, instrucciones: texto(x.instrucciones), principal: x.principal,
    })))

  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (campo: string) => errorDeCampo(guardar.error, campo)

  const cambiarContacto = (i: number, cambios: Partial<FilaContacto>) =>
    setContactos(contactos.map((x, j) => (j === i ? { ...x, ...cambios } : cambios.principal ? { ...x, principal: false } : x)))
  const cambiarDireccion = (i: number, cambios: Partial<FilaDireccion>) =>
    setDirecciones(direcciones.map((x, j) => (j === i ? { ...x, ...cambios } : cambios.principal ? { ...x, principal: false } : x)))

  const alternarDia = (dia: string) =>
    setF({ ...f, diasRevision: f.diasRevision.includes(dia) ? f.diasRevision.filter((d) => d !== dia) : [...f.diasRevision, dia] })

  // Pestañas con errores de validación, para señalarlas.
  const conError = (prefijo: string) =>
    guardar.error instanceof ApiError && Object.keys(guardar.error.errores).some((k) => k.toLowerCase().startsWith(prefijo))

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({
      id: c?.id,
      datos: {
        razonSocial: f.razonSocial, nombreComercial: nulo(f.nombreComercial), rfc: nulo(f.rfc.toUpperCase()),
        tipoPersona: f.tipoPersona, telefono: nulo(f.telefono), correo: nulo(f.correo), direccion: nulo(f.direccion),
        zona: nulo(f.zona), listaPreciosId: numeroONulo(f.listaPreciosId), tasaIva: numeroONulo(f.tasaIva),
        condicionPagoId: numeroONulo(f.condicionPagoId), instrumentoPagoId: numeroONulo(f.instrumentoPagoId),
        banco: nulo(f.banco), numeroCuenta: nulo(f.numeroCuenta), clabe: nulo(f.clabe),
        diasRevision: f.diasRevision, horaRevisionDesde: horaApi(f.horaRevisionDesde), horaRevisionHasta: horaApi(f.horaRevisionHasta),
        instruccionesContrarecibo: nulo(f.instruccionesContrarecibo), notas: nulo(f.notas), activo: f.activo,
        contactoPrincipal: null,
        contactos: contactos.map((x) => ({
          nombre: x.nombre, puesto: nulo(x.puesto), tipoContactoId: numeroONulo(x.tipoContactoId), telefono: nulo(x.telefono),
          extension: nulo(x.extension), celular: nulo(x.celular), correo: nulo(x.correo), principal: x.principal,
        })),
        direcciones: direcciones.map((x) => ({
          nombre: x.nombre, calle: x.calle, numeroExterior: nulo(x.numeroExterior), numeroInterior: nulo(x.numeroInterior),
          colonia: nulo(x.colonia), codigoPostal: nulo(x.codigoPostal), municipio: nulo(x.municipio), estado: nulo(x.estado),
          pais: nulo(x.pais), instrucciones: nulo(x.instrucciones), principal: x.principal,
        })),
      },
    }, { onSuccess: onCerrar })
  }

  const pestanas: { valor: PestanaCliente; texto: string }[] = [
    { valor: 'general', texto: conError('razonsocial') || conError('rfc') || conError('correo') || conError('telefono') ? 'General •' : 'General' },
    { valor: 'contactos', texto: `Contactos (${contactos.length})${conError('contactos') ? ' •' : ''}` },
    { valor: 'direcciones', texto: `Entregas (${direcciones.length})${conError('direcciones') ? ' •' : ''}` },
    { valor: 'pagos', texto: `Pagos y contrarecibo${conError('clabe') || conError('banco') ? ' •' : ''}` },
  ]

  return (
    <Modal abierto titulo={c ? `Editar ${c.razonSocial}` : 'Nuevo cliente'} onCerrar={onCerrar} ancho="max-w-4xl">
      <form onSubmit={enviar} className="space-y-5"
        onInvalidCapture={(e) => { const p = (e.target as HTMLElement).closest('[data-pestana]')?.getAttribute('data-pestana'); if (p) setPestana(p as PestanaCliente) }}>
        <div className="overflow-x-auto"><Segmentos etiqueta="Secciones del cliente" valor={pestana} onCambiar={setPestana} opciones={pestanas} /></div>

        {/* Las pestañas ocultas siguen montadas para conservar lo capturado y validar campos requeridos. */}
        <div data-pestana="general" className={cn('grid gap-4 sm:grid-cols-2', pestana !== 'general' && 'hidden')}>
          <Campo etiqueta="Razón social *" className="sm:col-span-2" error={err('razonSocial')}>
            <Input value={f.razonSocial} onChange={cambiar('razonSocial')} required autoFocus />
          </Campo>
          <Campo etiqueta="Nombre comercial"><Input value={f.nombreComercial} onChange={cambiar('nombreComercial')} /></Campo>
          <div className="grid grid-cols-2 gap-4">
            <Campo etiqueta="RFC" error={err('rfc')}>
              <Input className="font-mono uppercase" maxLength={13} value={f.rfc} onChange={cambiar('rfc')} />
            </Campo>
            <Campo etiqueta="Persona">
              <Select value={f.tipoPersona} onChange={cambiar('tipoPersona')}>
                <option value="Moral">Moral</option>
                <option value="Fisica">Física</option>
              </Select>
            </Campo>
          </div>
          <Campo etiqueta="Teléfono general" error={err('telefono')}><Input type="tel" value={f.telefono} onChange={cambiar('telefono')} /></Campo>
          <Campo etiqueta="Correo general" error={err('correo')}><Input type="email" value={f.correo} onChange={cambiar('correo')} /></Campo>
          <Campo etiqueta="Domicilio fiscal" className="sm:col-span-2"><Textarea rows={2} value={f.direccion} onChange={cambiar('direccion')} /></Campo>
          <Campo etiqueta="Zona" ayuda="Región comercial o de reparto."><Input value={f.zona} onChange={cambiar('zona')} placeholder="Norte, Bajío, Centro…" /></Campo>
          <Campo etiqueta="Lista de precios" ayuda="Sin lista, se cotiza con los precios generales.">
            <Select value={f.listaPreciosId} onChange={cambiar('listaPreciosId')}>
              <option value="">Precios generales</option>
              {c?.listaPreciosId && !listas.some((l) => l.id === c.listaPreciosId) && <option value={c.listaPreciosId}>{c.listaPrecios}</option>}
              {listas.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="IVA" ayuda="Elige una tasa solo si a este cliente se le factura distinto (p. ej. 0 % en exportación).">
            <Select value={f.tasaIva} onChange={cambiar('tasaIva')}>
              <option value="">Según cada producto</option>
              {TASAS_IVA.map((t) => <option key={t} value={t}>{etiquetaTasa(t)} en todo</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="Notas" className="sm:col-span-2"><Textarea rows={2} value={f.notas} onChange={cambiar('notas')} /></Campo>
          {c && <Checkbox className="sm:col-span-2" etiqueta="Activo" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />}
        </div>

        <div data-pestana="contactos" className={cn('space-y-3', pestana !== 'contactos' && 'hidden')}>
          {contactos.length === 0 && <Vacio mensaje="Sin contactos. Agrega a las personas con las que tratas: compras, pagos, dirección…" className="py-6" />}
          {contactos.map((x, i) => (
            <div key={i} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-6">
              <Campo etiqueta="Nombre *" className="sm:col-span-2" error={err(`contactos[${i}].nombre`)}>
                <Input value={x.nombre} onChange={(e) => cambiarContacto(i, { nombre: e.target.value })} required />
              </Campo>
              <Campo etiqueta="Puesto" className="sm:col-span-2"><Input value={x.puesto} onChange={(e) => cambiarContacto(i, { puesto: e.target.value })} /></Campo>
              <Campo etiqueta="Tipo" className="sm:col-span-2">
                <Select value={x.tipoContactoId} onChange={(e) => cambiarContacto(i, { tipoContactoId: e.target.value })}>
                  <option value="">—</option>
                  {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </Select>
              </Campo>
              <Campo etiqueta="Teléfono" className="sm:col-span-2" error={err(`contactos[${i}].telefono`)}>
                <Input type="tel" value={x.telefono} onChange={(e) => cambiarContacto(i, { telefono: e.target.value })} />
              </Campo>
              <Campo etiqueta="Ext."><Input value={x.extension} maxLength={10} onChange={(e) => cambiarContacto(i, { extension: e.target.value })} /></Campo>
              <Campo etiqueta="Celular" className="sm:col-span-3" error={err(`contactos[${i}].celular`)}>
                <Input type="tel" value={x.celular} onChange={(e) => cambiarContacto(i, { celular: e.target.value })} />
              </Campo>
              <Campo etiqueta="Correo" className="sm:col-span-4" error={err(`contactos[${i}].correo`)}>
                <Input type="email" value={x.correo} onChange={(e) => cambiarContacto(i, { correo: e.target.value })} />
              </Campo>
              <div className="flex items-end justify-between gap-2 sm:col-span-2">
                <Checkbox etiqueta="Principal" checked={x.principal} onChange={(e) => cambiarContacto(i, { principal: e.target.checked })} />
                <BotonIcono icono="basura" etiqueta="Quitar contacto" peligro onClick={() => setContactos(contactos.filter((_, j) => j !== i))} />
              </div>
            </div>
          ))}
          <Boton icono="mas" onClick={() => setContactos([...contactos, { ...contactoVacio(), principal: contactos.length === 0 }])}>Agregar contacto</Boton>
        </div>

        <div data-pestana="direcciones" className={cn('space-y-3', pestana !== 'direcciones' && 'hidden')}>
          {direcciones.length === 0 && <Vacio mensaje="Sin direcciones de entrega. El domicilio fiscal está en la pestaña General." className="py-6" />}
          {direcciones.map((x, i) => (
            <div key={i} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-6">
              <Campo etiqueta="Nombre *" className="sm:col-span-2" error={err(`direcciones[${i}].nombre`)}>
                <Input value={x.nombre} onChange={(e) => cambiarDireccion(i, { nombre: e.target.value })} placeholder="Matriz, Bodega…" required />
              </Campo>
              <Campo etiqueta="Calle *" className="sm:col-span-2" error={err(`direcciones[${i}].calle`)}>
                <Input value={x.calle} onChange={(e) => cambiarDireccion(i, { calle: e.target.value })} required />
              </Campo>
              <Campo etiqueta="No. ext."><Input value={x.numeroExterior} onChange={(e) => cambiarDireccion(i, { numeroExterior: e.target.value })} /></Campo>
              <Campo etiqueta="No. int."><Input value={x.numeroInterior} onChange={(e) => cambiarDireccion(i, { numeroInterior: e.target.value })} /></Campo>
              <Campo etiqueta="Colonia" className="sm:col-span-2"><Input value={x.colonia} onChange={(e) => cambiarDireccion(i, { colonia: e.target.value })} /></Campo>
              <Campo etiqueta="C.P." error={err(`direcciones[${i}].codigoPostal`)}>
                <Input inputMode="numeric" maxLength={5} value={x.codigoPostal} onChange={(e) => cambiarDireccion(i, { codigoPostal: e.target.value })} />
              </Campo>
              <Campo etiqueta="Municipio" className="sm:col-span-3"><Input value={x.municipio} onChange={(e) => cambiarDireccion(i, { municipio: e.target.value })} /></Campo>
              <Campo etiqueta="Estado" className="sm:col-span-3"><Input value={x.estado} onChange={(e) => cambiarDireccion(i, { estado: e.target.value })} /></Campo>
              <Campo etiqueta="País" className="sm:col-span-3"><Input value={x.pais} onChange={(e) => cambiarDireccion(i, { pais: e.target.value })} /></Campo>
              <Campo etiqueta="Instrucciones de entrega" className="sm:col-span-6">
                <Input value={x.instrucciones} onChange={(e) => cambiarDireccion(i, { instrucciones: e.target.value })} placeholder="Horario de recepción, referencias, andén…" />
              </Campo>
              <div className="flex items-center justify-between sm:col-span-6">
                <Checkbox etiqueta="Dirección principal de entrega" checked={x.principal} onChange={(e) => cambiarDireccion(i, { principal: e.target.checked })} />
                <BotonIcono icono="basura" etiqueta="Quitar dirección" peligro onClick={() => setDirecciones(direcciones.filter((_, j) => j !== i))} />
              </div>
            </div>
          ))}
          <Boton icono="mas" onClick={() => setDirecciones([...direcciones, { ...direccionVacia(), principal: direcciones.length === 0 }])}>Agregar dirección</Boton>
        </div>

        <div data-pestana="pagos" className={cn('grid gap-4 sm:grid-cols-2', pestana !== 'pagos' && 'hidden')}>
          <Seccion titulo="Datos para pagos" />
          <Campo etiqueta="Condición de pago">
            <Select value={f.condicionPagoId} onChange={cambiar('condicionPagoId')}>
              <option value="">—</option>
              {condiciones.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="Instrumento de pago">
            <Select value={f.instrumentoPagoId} onChange={cambiar('instrumentoPagoId')}>
              <option value="">—</option>
              {instrumentos.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="Banco"><Input value={f.banco} onChange={cambiar('banco')} /></Campo>
          <Campo etiqueta="Cuenta" ayuda="Basta con los últimos 4 dígitos." error={err('numeroCuenta')}>
            <Input className="font-mono" value={f.numeroCuenta} onChange={cambiar('numeroCuenta')} />
          </Campo>
          <Campo etiqueta="CLABE" className="sm:col-span-2" error={err('clabe')}>
            <Input className="font-mono" inputMode="numeric" maxLength={18} value={f.clabe} onChange={cambiar('clabe')} />
          </Campo>

          <Seccion titulo="Contrarecibo (revisión de facturas)" />
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-medium text-slate-700">Días de revisión</p>
            <div className="flex flex-wrap gap-2">
              {DIAS.map((d) => (
                <button key={d} type="button" aria-pressed={f.diasRevision.includes(d)} onClick={() => alternarDia(d)}
                  className={cn('rounded-full px-3 py-1 text-sm font-medium transition-colors',
                    f.diasRevision.includes(d) ? 'bg-marca-600 text-white' : 'bg-superficie text-slate-600 ring-1 ring-slate-200 hover:bg-marca-50')}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <Campo etiqueta="De las"><Input type="time" value={f.horaRevisionDesde} onChange={cambiar('horaRevisionDesde')} /></Campo>
          <Campo etiqueta="A las"><Input type="time" value={f.horaRevisionHasta} onChange={cambiar('horaRevisionHasta')} /></Campo>
          <Campo etiqueta="Instrucciones" className="sm:col-span-2">
            <Textarea rows={2} value={f.instruccionesContrarecibo} onChange={cambiar('instruccionesContrarecibo')}
              placeholder="Documentos que piden, dónde se entregan, a quién…" />
          </Campo>
        </div>

        <PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} />
      </form>
    </Modal>
  )
}
