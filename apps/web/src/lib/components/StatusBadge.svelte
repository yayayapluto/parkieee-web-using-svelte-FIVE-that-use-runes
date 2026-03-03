<script lang="ts">
  type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

  const variantClass: Record<Variant, string> = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger:  'bg-red-100 text-red-700',
    info:    'bg-blue-100 text-blue-700',
    neutral: 'bg-slate-100 text-slate-600',
  }

  const statusMap: Record<string, { label: string; variant: Variant }> = {
    // TransactionStatus
    open:              { label: 'Aktif',             variant: 'info' },
    awaiting_payment:  { label: 'Menunggu Bayar',    variant: 'warning' },
    paid:              { label: 'Lunas',              variant: 'success' },
    exited:            { label: 'Selesai',            variant: 'neutral' },
    overridden:        { label: 'Override',           variant: 'warning' },
    cancelled:         { label: 'Dibatalkan',         variant: 'danger' },
    // PaymentStatus
    pending:           { label: 'Pending',            variant: 'warning' },
    completed:         { label: 'Selesai',            variant: 'success' },
    failed:            { label: 'Gagal',              variant: 'danger' },
    expired:           { label: 'Kedaluwarsa',        variant: 'danger' },
    refunded:          { label: 'Dikembalikan',       variant: 'info' },
    // RefundStatus
    approved:          { label: 'Disetujui',          variant: 'success' },
    processed:         { label: 'Diproses',           variant: 'info' },
    rejected:          { label: 'Ditolak',            variant: 'danger' },
    // OCRJobStatus
    queued:            { label: 'Antrian',            variant: 'neutral' },
    processing:        { label: 'Diproses',           variant: 'info' },
    skipped:           { label: 'Dilewati',           variant: 'neutral' },
    // DeviceStatus
    online:            { label: 'Online',             variant: 'success' },
    offline:           { label: 'Offline',            variant: 'neutral' },
    error:             { label: 'Error',              variant: 'danger' },
    // GateType
    entry:             { label: 'Masuk',              variant: 'info' },
    exit:              { label: 'Keluar',             variant: 'neutral' },
    // Boolean-like
    active:            { label: 'Aktif',              variant: 'success' },
    inactive:          { label: 'Nonaktif',           variant: 'neutral' },
  }

  const { status, label: labelOverride } = $props<{
    status: string
    label?: string
  }>()

  const resolved = statusMap[status] ?? { label: status, variant: 'neutral' as Variant }
  const label = labelOverride ?? resolved.label
  const cls = variantClass[resolved.variant]
</script>

<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {cls}">
  {label}
</span>
