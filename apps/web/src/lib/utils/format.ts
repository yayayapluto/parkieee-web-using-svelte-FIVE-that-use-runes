import { format, formatDuration, intervalToDuration } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy', { locale: id })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: id })
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm', { locale: id })
}

export function formatDurationMinutes(minutes: number): string {
  const duration = intervalToDuration({ start: 0, end: minutes * 60 * 1000 })
  const parts: string[] = []
  if (duration.hours) parts.push(`${duration.hours}j`)
  if (duration.minutes) parts.push(`${duration.minutes}m`)
  return parts.length > 0 ? parts.join(' ') : '0m'
}
