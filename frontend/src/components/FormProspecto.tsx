import { useState, type FormEvent } from 'react'
import { useCatalogo, useEmpleados, useGuardarProspecto } from '../api/hooks'
import type { EtapaProspecto, Prospecto } from '../api/tipos'
import { ETAPAS, etiquetaEtapa } from '../lib/etiquetas'
import { Campo, errorDeCampo, Input, Modal, nulo, numeroONulo, PieFormulario, Select, Textarea } from './ui'

const ORIGENES = ['Sitio web', 'Recomendación', 'Redes sociales', 'Evento', 'Llamada en frío', 'Otro']

export default function FormProspecto({ prospecto, onCerrar }: { prospecto?: Prospecto; onCerrar: () => void }) {
  const guardar = useGuardarProspecto()
  const empleados = useEmpleados()
  const unidades = useCatalogo('unidades-negocio')

  const [f, setF] = useState({
    nombre: prospecto?.nombre ?? '',
    apellidos: prospecto?.apellidos ?? '',
    empresa: prospecto?.empresa ?? '',
    cargo: prospecto?.cargo ?? '',
    telefono: prospecto?.telefono ?? '',
    correo: prospecto?.correo ?? '',
    origen: prospecto?.origen ?? '',
    rfc: prospecto?.rfc ?? '',
    fechaNacimiento: prospecto?.fechaNacimiento ?? '',
    calle: prospecto?.calle ?? '',
    colonia: prospecto?.colonia ?? '',
    codigoPostal: prospecto?.codigoPostal ?? '',
    ciudad: prospecto?.ciudad ?? '',
    estado: prospecto?.estado ?? '',
    etapa: prospecto?.etapa ?? ('Nuevo' as EtapaProspecto),
    valorEstimado: prospecto?.valorEstimado?.toString() ?? '',
    empleadoResponsableId: prospecto?.empleadoResponsableId?.toString() ?? '',
    unidadNegocioId: prospecto?.unidadNegocioId?.toString() ?? '',
    notas: prospecto?.notas ?? '',
  })
  const cambiar = (campo: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [campo]: e.target.value })
  const err = (campo: string) => errorDeCampo(guardar.error, campo)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate(
      {
        id: prospecto?.id,
        datos: {
          nombre: f.nombre, apellidos: f.apellidos, empresa: nulo(f.empresa), cargo: nulo(f.cargo),
          telefono: nulo(f.telefono), correo: nulo(f.correo), origen: nulo(f.origen), etapa: f.etapa,
          rfc: nulo(f.rfc.toUpperCase()), fechaNacimiento: nulo(f.fechaNacimiento), calle: nulo(f.calle), colonia: nulo(f.colonia),
          codigoPostal: nulo(f.codigoPostal), ciudad: nulo(f.ciudad), estado: nulo(f.estado),
          valorEstimado: numeroONulo(f.valorEstimado),
          empleadoResponsableId: numeroONulo(f.empleadoResponsableId),
          unidadNegocioId: numeroONulo(f.unidadNegocioId),
          notas: nulo(f.notas), activo: prospecto?.activo ?? true,
        },
      },
      { onSuccess: onCerrar },
    )
  }

  return (
    <Modal abierto titulo={prospecto ? 'Editar prospecto' : 'Nuevo prospecto'} onCerrar={onCerrar} ancho="max-w-2xl">
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre *" error={err('nombre')}>
          <Input value={f.nombre} onChange={cambiar('nombre')} required autoFocus />
        </Campo>
        <Campo etiqueta="Apellidos *" error={err('apellidos')}>
          <Input value={f.apellidos} onChange={cambiar('apellidos')} required />
        </Campo>
        <Campo etiqueta="Empresa"><Input value={f.empresa} onChange={cambiar('empresa')} /></Campo>
        <Campo etiqueta="Cargo"><Input value={f.cargo} onChange={cambiar('cargo')} /></Campo>
        <Campo etiqueta="Teléfono" error={err('telefono')}>
          <Input type="tel" value={f.telefono} onChange={cambiar('telefono')} />
        </Campo>
        <Campo etiqueta="Correo" error={err('correo')}>
          <Input type="email" value={f.correo} onChange={cambiar('correo')} />
        </Campo>
        <Campo etiqueta="Etapa">
          <Select value={f.etapa} onChange={cambiar('etapa')}>
            {ETAPAS.map((e) => <option key={e} value={e}>{etiquetaEtapa[e]}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Valor estimado (MXN)" error={err('valorEstimado')}>
          <Input type="number" min="0" step="0.01" value={f.valorEstimado} onChange={cambiar('valorEstimado')} />
        </Campo>
        <Campo etiqueta="Responsable">
          <Select value={f.empleadoResponsableId} onChange={cambiar('empleadoResponsableId')}>
            <option value="">Sin asignar</option>
            {empleados.data?.map((e) => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Unidad de negocio">
          <Select value={f.unidadNegocioId} onChange={cambiar('unidadNegocioId')}>
            <option value="">—</option>
            {unidades.data?.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Origen" className="sm:col-span-2">
          <Select value={f.origen} onChange={cambiar('origen')}>
            <option value="">—</option>
            {ORIGENES.map((o) => <option key={o} value={o}>{o}</option>)}
            {f.origen && !ORIGENES.includes(f.origen) && <option value={f.origen}>{f.origen}</option>}
          </Select>
        </Campo>
        <details className="group rounded-lg border border-slate-200 sm:col-span-2" open={!!(f.rfc || f.fechaNacimiento || f.calle || f.ciudad)}>
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700 select-none">Datos personales y domicilio</summary>
          <div className="grid gap-4 border-t border-slate-200 p-3 sm:grid-cols-2">
            <Campo etiqueta="RFC" error={err('rfc')}>
              <Input className="font-mono uppercase" maxLength={13} value={f.rfc} onChange={cambiar('rfc')} />
            </Campo>
            <Campo etiqueta="Fecha de nacimiento" error={err('fechaNacimiento')}>
              <Input type="date" max={new Date().toISOString().slice(0, 10)} value={f.fechaNacimiento} onChange={cambiar('fechaNacimiento')} />
            </Campo>
            <Campo etiqueta="Calle y número" className="sm:col-span-2"><Input value={f.calle} onChange={cambiar('calle')} /></Campo>
            <Campo etiqueta="Colonia"><Input value={f.colonia} onChange={cambiar('colonia')} /></Campo>
            <Campo etiqueta="Código postal" error={err('codigoPostal')}>
              <Input inputMode="numeric" maxLength={5} value={f.codigoPostal} onChange={cambiar('codigoPostal')} />
            </Campo>
            <Campo etiqueta="Ciudad"><Input value={f.ciudad} onChange={cambiar('ciudad')} /></Campo>
            <Campo etiqueta="Estado"><Input value={f.estado} onChange={cambiar('estado')} /></Campo>
          </div>
        </details>
        <Campo etiqueta="Notas" className="sm:col-span-2">
          <Textarea value={f.notas} onChange={cambiar('notas')} />
        </Campo>
        <div className="sm:col-span-2">
          <PieFormulario error={guardar.error} guardando={guardar.isPending} onCancelar={onCerrar} />
        </div>
      </form>
    </Modal>
  )
}
