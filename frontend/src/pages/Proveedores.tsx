import { useState, type FormEvent } from 'react'
import { useCatalogo, useDesactivarProveedor, useGuardarProveedor, useProveedores } from '../api/hooks'
import type { Proveedor, TipoPersona } from '../api/tipos'
import {
  BarraFiltros, Boton, BotonIcono, Buscador, Campo, Cargando, Celda, CeldaAcciones, Checkbox, Doble, Encabezado,
  errorDeCampo, Fila, Input, Insignia, MensajeError, Modal, nulo, numeroONulo, PieFormulario, Select, Tabla, Tarjeta,
  Textarea, useConfirmar, Vacio,
} from '../components/ui'
import { SiPuede } from '../sesion/Sesion'

export default function Proveedores() {
  const confirmar = useConfirmar()
  const [buscar, setBuscar] = useState('')
  const [inactivos, setInactivos] = useState(false)
  const [editando, setEditando] = useState<Proveedor | 'nuevo' | null>(null)
  const { data, isLoading, error } = useProveedores(buscar, inactivos)
  const desactivar = useDesactivarProveedor()

  const darDeBaja = async (p: Proveedor) => {
    if (await confirmar({ titulo: 'Dar de baja proveedor', mensaje: <>¿Dar de baja a <b>{p.razonSocial}</b>?</>, textoConfirmar: 'Dar de baja', peligro: true }))
      desactivar.mutate(p.id)
  }

  return (
    <>
      <Encabezado titulo="Proveedores" descripcion="Empresas y personas a las que se les compra."
        acciones={<SiPuede permiso="proveedores.editar"><Boton variante="primario" icono="mas" onClick={() => setEditando('nuevo')}>Nuevo proveedor</Boton></SiPuede>} />

      <BarraFiltros>
        <Buscador placeholder="Buscar por razón social, RFC o contacto…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <Checkbox etiqueta="Mostrar inactivos" checked={inactivos} onChange={(e) => setInactivos(e.target.checked)} />
      </BarraFiltros>

      <MensajeError error={error} />
      {isLoading ? <Cargando /> : !data?.length ? <Tarjeta><Vacio mensaje="No hay proveedores." /></Tarjeta> : (
        <Tabla columnas={[{ titulo: 'Razón social' }, { titulo: 'RFC' }, { titulo: 'Contacto' }, { titulo: 'Condiciones' }, { titulo: '' }]}>
          {data.map((p) => (
            <Fila key={p.id} inactiva={!p.activo}>
              <Celda>
                <Doble principal={p.razonSocial} secundario={p.nombreComercial} />
                {!p.activo && <Insignia className="mt-1">Inactivo</Insignia>}
              </Celda>
              <Celda className="font-mono text-xs">{p.rfc ?? '—'}</Celda>
              <Celda className="text-slate-600">
                <p>{p.contactoNombre ?? '—'}</p>
                <p className="text-xs text-slate-500">{p.contactoCorreo ?? p.correo}</p>
              </Celda>
              <Celda className="text-slate-600">
                <p>{p.condicionPago ?? '—'}</p>
                <p className="text-xs text-slate-500">{p.instrumentoPago}</p>
              </Celda>
              <CeldaAcciones>
                <SiPuede permiso="proveedores.editar"><BotonIcono icono="editar" etiqueta="Editar" onClick={() => setEditando(p)} /></SiPuede>
                {p.activo && <SiPuede permiso="proveedores.eliminar"><BotonIcono icono="basura" etiqueta="Dar de baja" peligro onClick={() => darDeBaja(p)} /></SiPuede>}
              </CeldaAcciones>
            </Fila>
          ))}
        </Tabla>
      )}

      {editando && <FormProveedor proveedor={editando === 'nuevo' ? undefined : editando} onCerrar={() => setEditando(null)} />}
    </>
  )
}

function Seccion({ titulo }: { titulo: string }) {
  return <p className="border-b border-slate-200 pb-1 text-xs font-semibold tracking-wider text-slate-500 uppercase sm:col-span-2">{titulo}</p>
}

function FormProveedor({ proveedor: p, onCerrar }: { proveedor?: Proveedor; onCerrar: () => void }) {
  const guardar = useGuardarProveedor()
  const tipos = useCatalogo('tipos-contacto').data ?? []
  const condiciones = useCatalogo('condiciones-pago').data ?? []
  const instrumentos = useCatalogo('instrumentos-pago').data ?? []
  const [f, setF] = useState({
    razonSocial: p?.razonSocial ?? '', nombreComercial: p?.nombreComercial ?? '', rfc: p?.rfc ?? '',
    tipoPersona: p?.tipoPersona ?? ('Moral' as TipoPersona),
    telefono: p?.telefono ?? '', correo: p?.correo ?? '', direccion: p?.direccion ?? '',
    contactoNombre: p?.contactoNombre ?? '', contactoTelefono: p?.contactoTelefono ?? '', contactoCorreo: p?.contactoCorreo ?? '',
    tipoContactoId: p?.tipoContactoId?.toString() ?? '', condicionPagoId: p?.condicionPagoId?.toString() ?? '',
    instrumentoPagoId: p?.instrumentoPagoId?.toString() ?? '',
    banco: p?.banco ?? '', numeroCuenta: p?.numeroCuenta ?? '', clabe: p?.clabe ?? '', notas: p?.notas ?? '',
    activo: p?.activo ?? true,
  })
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (c: string) => errorDeCampo(guardar.error, c)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({
      id: p?.id,
      datos: {
        razonSocial: f.razonSocial, nombreComercial: nulo(f.nombreComercial), rfc: nulo(f.rfc.toUpperCase()),
        tipoPersona: f.tipoPersona, telefono: nulo(f.telefono), correo: nulo(f.correo), direccion: nulo(f.direccion),
        contactoNombre: nulo(f.contactoNombre), contactoTelefono: nulo(f.contactoTelefono), contactoCorreo: nulo(f.contactoCorreo),
        tipoContactoId: numeroONulo(f.tipoContactoId), condicionPagoId: numeroONulo(f.condicionPagoId),
        instrumentoPagoId: numeroONulo(f.instrumentoPagoId),
        banco: nulo(f.banco), numeroCuenta: nulo(f.numeroCuenta), clabe: nulo(f.clabe), notas: nulo(f.notas),
        activo: f.activo,
      },
    }, { onSuccess: onCerrar })
  }

  return (
    <Modal abierto titulo={p ? 'Editar proveedor' : 'Nuevo proveedor'} onCerrar={onCerrar} ancho="max-w-3xl">
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
        <Seccion titulo="Datos generales" />
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
        <Campo etiqueta="Teléfono" error={err('telefono')}><Input type="tel" value={f.telefono} onChange={cambiar('telefono')} /></Campo>
        <Campo etiqueta="Correo" error={err('correo')}><Input type="email" value={f.correo} onChange={cambiar('correo')} /></Campo>
        <Campo etiqueta="Dirección" className="sm:col-span-2"><Textarea rows={2} value={f.direccion} onChange={cambiar('direccion')} /></Campo>

        <Seccion titulo="Contacto" />
        <Campo etiqueta="Nombre"><Input value={f.contactoNombre} onChange={cambiar('contactoNombre')} /></Campo>
        <Campo etiqueta="Tipo de contacto">
          <Select value={f.tipoContactoId} onChange={cambiar('tipoContactoId')}>
            <option value="">—</option>
            {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Teléfono" error={err('contactoTelefono')}><Input type="tel" value={f.contactoTelefono} onChange={cambiar('contactoTelefono')} /></Campo>
        <Campo etiqueta="Correo" error={err('contactoCorreo')}><Input type="email" value={f.contactoCorreo} onChange={cambiar('contactoCorreo')} /></Campo>

        <Seccion titulo="Condiciones y datos bancarios" />
        <Campo etiqueta="Condición de pago">
          <Select value={f.condicionPagoId} onChange={cambiar('condicionPagoId')}>
            <option value="">—</option>
            {condiciones.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Instrumento de pago">
          <Select value={f.instrumentoPagoId} onChange={cambiar('instrumentoPagoId')}>
            <option value="">—</option>
            {instrumentos.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Banco"><Input value={f.banco} onChange={cambiar('banco')} /></Campo>
        <Campo etiqueta="Número de cuenta" error={err('numeroCuenta')}><Input className="font-mono" value={f.numeroCuenta} onChange={cambiar('numeroCuenta')} /></Campo>
        <Campo etiqueta="CLABE" className="sm:col-span-2" error={err('clabe')}>
          <Input className="font-mono" inputMode="numeric" maxLength={18} value={f.clabe} onChange={cambiar('clabe')} />
        </Campo>
        <Campo etiqueta="Notas" className="sm:col-span-2"><Textarea rows={2} value={f.notas} onChange={cambiar('notas')} /></Campo>

        {p && <Checkbox className="sm:col-span-2" etiqueta="Activo" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />}
        <div className="sm:col-span-2"><PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} /></div>
      </form>
    </Modal>
  )
}
