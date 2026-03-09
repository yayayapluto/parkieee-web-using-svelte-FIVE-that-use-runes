import { format, intervalToDuration } from 'date-fns'
import { id } from 'date-fns/locale'
export { formatCurrency, formatDurationMinutes } from '@parkieee/utils'

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy', { locale: id })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: id })
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm', { locale: id })
}
