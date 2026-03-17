<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { DoorOpen, DoorClosed } from 'lucide-svelte'

  let { active } = $props<{ active: boolean }>()
</script>

{#if active}
  <Badge class="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
    <DoorOpen size={10} />
    Aktif
  </Badge>
{:else}
  <Badge class="gap-1 bg-gray-100 text-gray-500 hover:bg-gray-100">
    <DoorClosed size={10} />
    Nonaktif
  </Badge>
{/if}
