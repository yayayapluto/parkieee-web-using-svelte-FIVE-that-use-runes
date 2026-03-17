<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import type { TransactionStatus } from '$lib/types/domain'

  const CONFIG: Record<TransactionStatus, { label: string; class: string }> = {
    open:             { label: 'Open',       class: 'bg-green-100 text-green-700 hover:bg-green-100' },
    awaiting_payment: { label: 'Awaiting',   class: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
    paid:             { label: 'Paid',       class: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
    exited:           { label: 'Exited',     class: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
    overridden:       { label: 'Overridden', class: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
    cancelled:        { label: 'Cancelled',  class: 'bg-gray-100 text-gray-500 hover:bg-gray-100' },
  }

  let { status } = $props<{ status: TransactionStatus }>()
  const cfg = $derived(CONFIG[status as TransactionStatus] ?? { label: status, class: 'bg-gray-100 text-gray-500' })
</script>

<Badge class={cfg.class}>{cfg.label}</Badge>
