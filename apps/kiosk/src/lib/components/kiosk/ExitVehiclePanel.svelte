<script lang="ts">
  import { formatCurrency } from '$lib/utils/format'
  import type { Transaction } from '$lib/types/domain'

  let {
    tx,
    hasResult,
    entryPlate,
    showingPayModal = false,
  }: {
    tx:         Transaction | null
    hasResult:  boolean
    entryPlate: string | null
    showingPayModal?: boolean
  } = $props()

  const showData = $derived(hasResult || (showingPayModal && tx !== null))
</script>

<div class="w-[42%] flex flex-col bg-gray-50">

  <!-- Label header -->
  <div class="border-b border-gray-300 px-4 py-3 text-center h-14 flex items-center justify-center shrink-0">
    {#if showData && entryPlate}
      <span class="text-gray-700 text-base font-semibold tracking-[0.2em] uppercase">PLAT TERDETEKSI</span>
    {:else if showData}
      <span class="text-gray-700 text-base font-semibold tracking-[0.2em] uppercase">KENDARAAN</span>
    {:else}
      <span class="text-gray-300 text-base font-semibold tracking-[0.2em]">—</span>
    {/if}
  </div>

  <!-- Plat -->
  <div class="flex-1 flex items-center justify-center px-6">
    {#if showData && entryPlate}
      <span class="text-gray-900 text-[44px] font-black tracking-[0.08em] text-center leading-tight font-mono">
        {entryPlate}
      </span>
    {:else if showData}
      <span class="text-gray-300 text-[44px] font-black tracking-[0.08em]">—</span>
    {:else}
      <span class="text-gray-200 text-[44px] font-black">—</span>
    {/if}
  </div>

  <!-- Konfirmasi fee -->
  <div class="border-t border-gray-300 bg-gray-100 px-4 py-3 text-center shrink-0">
    {#if showData && tx}
      <span class="text-gray-700 text-base font-semibold tracking-[0.15em] uppercase block">
        KONFIRMASI PEMBAYARAN
      </span>
      <span class="text-gray-900 text-[40px] font-black block leading-tight mt-1">
        {tx.calculated_fee != null ? formatCurrency(tx.calculated_fee) : '—'}
      </span>
    {:else}
      <span class="text-gray-300 text-base font-semibold tracking-[0.15em] block">——</span>
      <span class="text-gray-200 text-[40px] font-black block leading-tight mt-1">—</span>
    {/if}
  </div>

</div>
