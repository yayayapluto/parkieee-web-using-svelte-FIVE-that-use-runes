<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-svelte'

  let { type } = $props<{ type: 'entry' | 'exit' }>()
</script>

{#if type === 'entry'}
  <Badge class="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
    <ArrowDownToLine size={10} />
    Entry
  </Badge>
{:else}
  <Badge class="gap-1 bg-orange-100 text-orange-700 hover:bg-orange-100">
    <ArrowUpFromLine size={10} />
    Exit
  </Badge>
{/if}
