<script lang="ts">
  import { getContext } from 'svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import { Button } from '$lib/components/ui/button'
  import { MoreHorizontal, Info, PowerOff, Power, QrCode } from 'lucide-svelte'
  import type { TableContext } from './data-table.svelte'
  import type { GateRow } from './columns'

  let { gate, canManage, canPairing } = $props<{ gate: GateRow; canManage: boolean; canPairing: boolean }>()
  const ctx = getContext<TableContext>('gateTableActions')
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" class="h-8 w-8 p-0">
        <MoreHorizontal size={15} />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="w-44">
    <DropdownMenu.Item class="gap-2 text-[13px]" onclick={() => ctx.openDetail(gate)}>
      <Info size={13} />
      Detail
    </DropdownMenu.Item>
    {#if canPairing}
      <DropdownMenu.Item class="gap-2 text-[13px]" onclick={() => ctx.openPairing(gate)}>
        <QrCode size={13} />
        Pairing Device
      </DropdownMenu.Item>
    {/if}
    {#if canManage}
      <DropdownMenu.Separator />
      {#if gate.is_active}
        <DropdownMenu.Item
          class="gap-2 text-[13px] text-red-600 focus:text-red-600"
          onclick={() => ctx.openToggle(gate)}
        >
          <PowerOff size={13} />
          Nonaktifkan
        </DropdownMenu.Item>
      {:else}
        <DropdownMenu.Item
          class="gap-2 text-[13px] text-emerald-600 focus:text-emerald-600"
          onclick={() => ctx.openToggle(gate)}
        >
          <Power size={13} />
          Aktifkan
        </DropdownMenu.Item>
      {/if}
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>
