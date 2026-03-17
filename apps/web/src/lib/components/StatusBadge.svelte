<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'

  type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

  const CLASS: Record<Variant, string> = {
    success: 'bg-green-100 text-green-700 hover:bg-green-100',
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    danger:  'bg-red-100 text-red-600 hover:bg-red-100',
    info:    'bg-blue-100 text-blue-700 hover:bg-blue-100',
    neutral: 'bg-gray-100 text-gray-500 hover:bg-gray-100',
  }

  const STATUS_MAP: Record<string, { label: string; variant: Variant }> = {
    open:             { label: 'Open',            variant: 'success' },
    awaiting_payment: { label: 'Awaiting',        variant: 'warning' },
    paid:             { label: 'Paid',            variant: 'info' },
    exited:           { label: 'Exited',          variant: 'info' },
    overridden:       { label: 'Overridden',      variant: 'warning' },
    cancelled:        { label: 'Cancelled',       variant: 'neutral' },
    pending:          { label: 'Pending',         variant: 'warning' },
    completed:        { label: 'Completed',       variant: 'success' },
    failed:           { label: 'Failed',          variant: 'danger' },
    expired:          { label: 'Expired',         variant: 'danger' },
    refunded:         { label: 'Refunded',        variant: 'info' },
    approved:         { label: 'Approved',        variant: 'success' },
    processed:        { label: 'Processed',       variant: 'info' },
    rejected:         { label: 'Rejected',        variant: 'danger' },
    queued:           { label: 'Queued',          variant: 'neutral' },
    processing:       { label: 'Processing',      variant: 'info' },
    skipped:          { label: 'Skipped',         variant: 'neutral' },
    online:           { label: 'Online',          variant: 'success' },
    offline:          { label: 'Offline',         variant: 'neutral' },
    error:            { label: 'Error',           variant: 'danger' },
    entry:            { label: 'Masuk',           variant: 'info' },
    exit:             { label: 'Keluar',          variant: 'neutral' },
    active:           { label: 'Aktif',           variant: 'success' },
    inactive:         { label: 'Nonaktif',        variant: 'neutral' },
    rfid:             { label: 'RFID',            variant: 'danger' },
    qr:               { label: 'QR',              variant: 'neutral' },
  }

  const { status, label: labelOverride } = $props<{ status: string; label?: string }>()

  const resolved = $derived(STATUS_MAP[status] ?? { label: status, variant: 'neutral' as Variant })
  const label = $derived(labelOverride ?? resolved.label)
  const cls = $derived(CLASS[resolved.variant])
</script>

<Badge class={cls}>{label}</Badge>
