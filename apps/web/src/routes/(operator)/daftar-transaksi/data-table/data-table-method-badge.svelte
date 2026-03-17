<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  let { method } = $props<{ method: string }>()
</script>

<Badge class={method === 'rfid'
  ? 'bg-[#fff1f2] text-[#e11d48] hover:bg-[#fff1f2]'
  : 'bg-gray-100 text-gray-600 hover:bg-gray-100'}>
  {method.toUpperCase()}
</Badge>
