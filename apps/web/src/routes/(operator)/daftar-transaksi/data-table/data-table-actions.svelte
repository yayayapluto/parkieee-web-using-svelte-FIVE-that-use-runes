<script lang="ts">
  import { MoreHorizontal } from 'lucide-svelte'
  import { Button } from '$lib/components/ui/button'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import type { Transaction } from '$lib/types/domain'
  import { can } from '$lib/utils/auth'
  import { getContext } from 'svelte'
  import type { TableContext } from './data-table.svelte'

  let { transaction } = $props<{ transaction: Transaction }>()

  const ctx = getContext<TableContext>('tableActions')
  const canOverride = can('gate.override')
  const canCancel = transaction.status === 'open' || transaction.status === 'awaiting_payment'
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" class="h-7 w-7 p-0">
        <MoreHorizontal size={15} class="text-gray-500" />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="w-40">
    <DropdownMenu.Item onclick={() => ctx.openDetail(transaction)}>
      Detail
    </DropdownMenu.Item>
    {#if canOverride}
      <DropdownMenu.Item onclick={() => ctx.openOverride(transaction)}>
        Override
      </DropdownMenu.Item>
    {/if}
    {#if canCancel}
      <DropdownMenu.Item
        onclick={() => ctx.openCancel(transaction.id)}
        class="text-red-500 focus:text-red-600"
      >
        Batalkan
      </DropdownMenu.Item>
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>
