<script lang="ts">
  import { formatCurrency } from '$lib/utils/format'
  import { Loader2, QrCode } from 'lucide-svelte'
  import type { Payment } from '$lib/types/domain'

  let {
    payment,
    onBack,
  }: {
    payment: Payment
    onBack:  () => void
  } = $props()
</script>

<div class="flex flex-col items-center gap-6 w-full max-w-[400px]">
  <p class="text-[13px] font-semibold text-gray-700 uppercase tracking-[0.1em]">Scan QRIS untuk membayar</p>

  {#if payment.qris_image_url}
    <img
      src={payment.qris_image_url}
      alt="QRIS"
      class="w-[220px] h-[220px] border border-gray-200 p-3 bg-white"
    />
  {:else}
    <div class="w-[220px] h-[220px] border border-gray-200 flex items-center justify-center bg-gray-50">
      <QrCode size={64} strokeWidth={1} class="text-gray-300" />
    </div>
  {/if}

  <p class="text-[32px] font-bold text-[#15803d]">{formatCurrency(payment.amount)}</p>

  <div class="flex items-center gap-2 text-gray-400">
    <Loader2 size={13} class="animate-spin" />
    <p class="text-xs">Menunggu konfirmasi pembayaran...</p>
  </div>

  <button
    onclick={onBack}
    class="border border-gray-300 bg-white px-6 py-2 text-[13px] text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
  >
    Kembali
  </button>
</div>
