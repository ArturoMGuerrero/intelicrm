import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useEmpresa, useGuardarEmpresa } from '../api/hooks'
import type { ConfiguracionEmpresa, CuentaBancaria } from '../api/tipos'
import {
  Boton, BotonIcono, Campo, Cargando, Encabezado, errorDeCampo, Input, MensajeError, notificar, nulo, Tarjeta, Textarea,
} from '../components/ui'
import { useSesion } from '../sesion/Sesion'

const TAMANO_MAXIMO_LOGO = 300 * 1024

/** Datos de la empresa (antes "Mi empresa"): fiscales, contacto, logo y cuentas bancarias. */
export default function MiEmpresa() {
  const { data, isLoading, error } = useEmpresa()
  if (isLoading) return <Cargando />
  if (error || !data) return <MensajeError error={error} />
  return <Formulario empresa={data} />
}

function Formulario({ empresa }: { empresa: ConfiguracionEmpresa }) {
  const { puede } = useSesion()
  const guardar = useGuardarEmpresa()
  const editable = puede('empresa.editar')
  const [f, setF] = useState({
    razonSocial: empresa.razonSocial, nombreComercial: empresa.nombreComercial ?? '', rfc: empresa.rfc ?? '',
    regimenFiscal: empresa.regimenFiscal ?? '', codigoPostal: empresa.codigoPostal ?? '', direccion: empresa.direccion ?? '',
    telefono: empresa.telefono ?? '', correo: empresa.correo ?? '', sitioWeb: empresa.sitioWeb ?? '',
    serieFactura: empresa.serieFactura ?? '', pieDocumentos: empresa.pieDocumentos ?? '', logo: empresa.logo ?? '',
  })
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>(empresa.cuentasBancarias)
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (c: string) => errorDeCampo(guardar.error, c)

  const elegirLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    if (!['image/png', 'image/jpeg'].includes(archivo.type)) return notificar.error('El logo debe ser PNG o JPG.')
    if (archivo.size > TAMANO_MAXIMO_LOGO) return notificar.error('El logo pesa más de 300 KB.')
    const lector = new FileReader()
    lector.onload = () => setF((actual) => ({ ...actual, logo: String(lector.result) }))
    lector.readAsDataURL(archivo)
  }

  const cambiarCuenta = (i: number, cambios: Partial<CuentaBancaria>) =>
    setCuentas((cs) => cs.map((c, j) => (j === i ? { ...c, ...cambios } : c)))

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate({
      razonSocial: f.razonSocial, nombreComercial: nulo(f.nombreComercial), rfc: nulo(f.rfc.toUpperCase()),
      regimenFiscal: nulo(f.regimenFiscal), codigoPostal: nulo(f.codigoPostal), direccion: nulo(f.direccion),
      telefono: nulo(f.telefono), correo: nulo(f.correo), sitioWeb: nulo(f.sitioWeb), serieFactura: nulo(f.serieFactura),
      pieDocumentos: nulo(f.pieDocumentos), logo: nulo(f.logo),
      cuentasBancarias: cuentas.filter((c) => c.banco.trim()).map((c) => ({
        banco: c.banco, numeroCuenta: nulo(c.numeroCuenta ?? ''), clabe: nulo(c.clabe ?? ''), descripcion: nulo(c.descripcion ?? ''),
      })),
    })
  }

  return (
    <form onSubmit={enviar}>
      <Encabezado titulo="Mi empresa" descripcion="Datos que aparecen en cotizaciones, cargos y, más adelante, en las facturas."
        acciones={editable && <Boton type="submit" variante="primario" cargando={guardar.isPending}>Guardar cambios</Boton>} />

      <fieldset disabled={!editable} className="space-y-6">
        <MensajeError error={guardar.error} />
        <div className="grid gap-6 lg:grid-cols-3">
          <Tarjeta titulo="Datos fiscales" className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <Campo etiqueta="Razón social *" className="sm:col-span-2" error={err('razonSocial')}>
              <Input value={f.razonSocial} onChange={cambiar('razonSocial')} required />
            </Campo>
            <Campo etiqueta="Nombre comercial"><Input value={f.nombreComercial} onChange={cambiar('nombreComercial')} /></Campo>
            <Campo etiqueta="RFC" error={err('rfc')}>
              <Input className="font-mono uppercase" maxLength={13} value={f.rfc} onChange={cambiar('rfc')} />
            </Campo>
            <Campo etiqueta="Régimen fiscal (clave SAT)" ayuda="Ej. 601 General de Ley Personas Morales, 612 Personas Físicas con Actividades Empresariales."
              error={err('regimenFiscal')}>
              <Input inputMode="numeric" maxLength={3} value={f.regimenFiscal} onChange={cambiar('regimenFiscal')} />
            </Campo>
            <Campo etiqueta="Código postal fiscal" error={err('codigoPostal')}>
              <Input inputMode="numeric" maxLength={5} value={f.codigoPostal} onChange={cambiar('codigoPostal')} />
            </Campo>
            <Campo etiqueta="Domicilio" className="sm:col-span-2"><Textarea rows={2} value={f.direccion} onChange={cambiar('direccion')} /></Campo>
            <Campo etiqueta="Serie de facturas" ayuda="Se usará al timbrar facturas electrónicas." error={err('serieFactura')}>
              <Input className="w-28 font-mono uppercase" maxLength={10} value={f.serieFactura} onChange={cambiar('serieFactura')} />
            </Campo>
          </Tarjeta>

          <Tarjeta titulo="Logo">
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
              {f.logo ? <img src={f.logo} alt="Logo de la empresa" className="max-h-36 max-w-full object-contain" />
                : <span className="text-sm text-slate-400">Sin logo</span>}
            </div>
            {editable && (
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-marca-200 hover:bg-marca-50 hover:text-marca-700">
                  Elegir imagen
                  <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={elegirLogo} />
                </label>
                {f.logo && <Boton variante="fantasma" onClick={() => setF({ ...f, logo: '' })}>Quitar</Boton>}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">PNG o JPG de máximo 300 KB.</p>
          </Tarjeta>
        </div>

        <Tarjeta titulo="Contacto" className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Teléfono" error={err('telefono')}><Input type="tel" value={f.telefono} onChange={cambiar('telefono')} /></Campo>
          <Campo etiqueta="Correo" error={err('correo')}><Input type="email" value={f.correo} onChange={cambiar('correo')} /></Campo>
          <Campo etiqueta="Sitio web"><Input value={f.sitioWeb} onChange={cambiar('sitioWeb')} /></Campo>
          <Campo etiqueta="Leyenda al pie de los documentos" className="sm:col-span-3">
            <Textarea rows={2} value={f.pieDocumentos} onChange={cambiar('pieDocumentos')} placeholder="Condiciones, datos para depósito…" />
          </Campo>
        </Tarjeta>

        <Tarjeta titulo="Cuentas bancarias" acciones={editable && (
          <Boton tamano="sm" icono="mas" onClick={() => setCuentas([...cuentas, { banco: '', numeroCuenta: '', clabe: '', descripcion: '' }])}>Agregar</Boton>
        )}>
          {cuentas.length === 0 ? <p className="text-sm text-slate-500">Sin cuentas registradas.</p> : (
            <div className="space-y-3">
              {cuentas.map((c, i) => (
                <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1.3fr_1.3fr_auto]">
                  <Campo etiqueta="Banco"><Input value={c.banco} onChange={(e) => cambiarCuenta(i, { banco: e.target.value })} required /></Campo>
                  <Campo etiqueta="Número de cuenta">
                    <Input className="font-mono" value={c.numeroCuenta ?? ''} onChange={(e) => cambiarCuenta(i, { numeroCuenta: e.target.value })} />
                  </Campo>
                  <Campo etiqueta="CLABE" error={err(`cuentasBancarias[${i}].clabe`)}>
                    <Input className="font-mono" inputMode="numeric" maxLength={18} value={c.clabe ?? ''} onChange={(e) => cambiarCuenta(i, { clabe: e.target.value })} />
                  </Campo>
                  <Campo etiqueta="Descripción">
                    <Input value={c.descripcion ?? ''} onChange={(e) => cambiarCuenta(i, { descripcion: e.target.value })} />
                  </Campo>
                  {editable && <BotonIcono icono="basura" etiqueta="Quitar cuenta" peligro className="mb-1.5" onClick={() => setCuentas(cuentas.filter((_, j) => j !== i))} />}
                </div>
              ))}
            </div>
          )}
        </Tarjeta>
      </fieldset>
    </form>
  )
}
