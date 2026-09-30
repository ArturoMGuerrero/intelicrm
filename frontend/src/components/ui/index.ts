// Kit de componentes de InteliCRM. Todas las pantallas deben armarse con estas piezas
// (estilizadas solo con Tailwind) para mantener una UI consistente.
export { cn } from './cn'
export { Icono, type NombreIcono } from './Icono'
export { Boton, BotonEnlace, BotonIcono, clasesBoton } from './Boton'
export {
  Buscador, Campo, Checkbox, errorDeCampo, Input, nulo, numeroONulo, PieFormulario, Select, Textarea,
} from './Formulario'
export {
  Aviso, BarraFiltros, Cargando, Encabezado, FiltroChips, Insignia, ListaDatos, MensajeError, Segmentos,
  Tarjeta, tonos, Vacio, type Tono,
} from './Estructura'
export { Celda, CeldaAcciones, Doble, Fila, Tabla, type Columna } from './Tabla'
export { Modal, ProveedorConfirmacion, useConfirmar } from './Modal'
export { notificar } from './notificar'
