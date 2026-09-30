import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Une clases de Tailwind resolviendo conflictos: cn('px-2', 'px-4') → 'px-4'.
 * Permite que quien usa un componente sobrescriba sus estilos con `className`.
 */
export const cn = (...clases: ClassValue[]) => twMerge(clsx(clases))
