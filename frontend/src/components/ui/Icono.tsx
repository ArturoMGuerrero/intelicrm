import { cn } from './cn'

// Íconos en SVG en línea (estilo "outline"), sin dependencias.
const rutas = {
  inicio: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10',
  prospectos: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0',
  citas: 'M8 3v4M16 3v4M4 9h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  cotizaciones: 'M9 12h6M9 16h6M7 3h7l5 5v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z',
  clientes: 'M3 21V7l9-4 9 4v14M9 21v-6h6v6',
  productos: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  empleados: 'M17 20h5v-2a3 3 0 00-5.4-1.8M17 20H7m10 0v-2c0-.7-.1-1.3-.4-1.8M7 20H2v-2a3 3 0 015.4-1.8M7 20v-2c0-.7.1-1.3.4-1.8m0 0a5 5 0 019.2 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  catalogo: 'M4 6h16M4 12h16M4 18h10',
  usuarios: 'M12 11a4 4 0 100-8 4 4 0 000 8zm-7 10v-1a7 7 0 0114 0v1',
  escudo: 'M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z',
  llave: 'M15 7a4 4 0 11-3.9 5H7v3H4v-3H3v-2h8.1A4 4 0 0115 7z',
  salir: 'M15 17l5-5-5-5M20 12H9M11 21H5a2 2 0 01-2-2V5a2 2 0 012-2h6',
  mas: 'M12 5v14M5 12h14',
  editar: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.6a2 2 0 112.8 2.8L11.8 15H9v-2.8l8.6-8.6z',
  basura: 'M19 7l-.9 12.1A2 2 0 0116.1 21H7.9a2 2 0 01-2-1.9L5 7m5 4v6m4-6v6M15 7V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  izquierda: 'M15 19l-7-7 7-7',
  derecha: 'M9 5l7 7-7 7',
  abajo: 'M19 9l-7 7-7-7',
  cerrar: 'M6 18L18 6M6 6l12 12',
  menu: 'M4 6h16M4 12h16M4 18h16',
  buscar: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  check: 'M5 13l4 4L19 7',
  candado: 'M7 11V7a5 5 0 0110 0v4M5 11h14v10H5z',
  alerta: 'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  proveedores: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  sucursales: 'M3 9l1.5-5h15L21 9M3 9h18M3 9v1a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0V9M5 13v8h14v-8M10 21v-4h4v4',
  pago: 'M3 7h18v10H3zM3 11h18M7 15h3',
  rayo: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  brillo: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z',
  maletin: 'M9 6V5a2 2 0 012-2h2a2 2 0 012 2v1M4 6h16a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1zM3 12h18',
  cuadricula: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  reloj: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  telefono: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
  tendencia: 'M3 17l6-6 4 4 8-8M15 7h6v6',
} as const

export type NombreIcono = keyof typeof rutas

export function Icono({ nombre, className }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg className={cn('h-5 w-5 shrink-0', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={rutas[nombre]} />
    </svg>
  )
}
