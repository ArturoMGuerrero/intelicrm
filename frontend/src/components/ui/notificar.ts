import { toast } from 'sonner'

/**
 * Mensajes flotantes (toasts). Úsalos para confirmar acciones ("Cliente guardado")
 * y para errores de acciones sin formulario (cambiar estatus, eliminar...).
 * Los errores de validación de un formulario se muestran dentro del formulario.
 */
export const notificar = {
  exito: (mensaje: string) => toast.success(mensaje),
  error: (error: unknown, respaldo = 'Ocurrió un error.') =>
    toast.error(error instanceof Error ? error.message : respaldo),
  info: (mensaje: string) => toast(mensaje),
}
