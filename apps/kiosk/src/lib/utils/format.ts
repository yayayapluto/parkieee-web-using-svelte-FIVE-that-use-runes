export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 1) return '0 mnt'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const s_h = h > 0 ? `${h} jam ` : ''
  const s_m = m > 0 ? `${m} mnt` : ''
  return (s_h + s_m).trim()
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
