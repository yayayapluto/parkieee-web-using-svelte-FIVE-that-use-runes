<script lang="ts">
  import type { Column } from '@tanstack/table-core'
  import { Button } from '$lib/components/ui/button'
  import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-svelte'
  import type { Transaction } from '$lib/types/domain'

  let { column, label, align = 'left' } = $props<{
    column: Column<Transaction>
    label: string
    align?: 'left' | 'right'
  }>()
</script>

<Button
  variant="ghost"
  onclick={column.getToggleSortingHandler()}
  class="h-auto p-0 text-[11.5px] font-semibold uppercase tracking-wide text-gray-500 hover:bg-transparent hover:text-gray-800 {align === 'right' ? 'w-full justify-end' : ''}"
>
  {label}
  {#if column.getIsSorted() === 'asc'}
    <ArrowUp size={12} class="ml-1" />
  {:else if column.getIsSorted() === 'desc'}
    <ArrowDown size={12} class="ml-1" />
  {:else}
    <ArrowUpDown size={12} class="ml-1 text-gray-300" />
  {/if}
</Button>
