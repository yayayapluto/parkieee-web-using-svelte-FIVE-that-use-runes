<script lang="ts">
  import { formatCurrency, formatDurationMinutes } from '$lib/utils/format'
  import { CircleCheckBig, BadgeCheck } from 'lucide-svelte'
  import type { Transaction } from '$lib/types/domain'

  let {
    tx,
    durationMinutes,
    isGracePeriod,
    gracePeriod,
    onSelectCash,
    onSelectQRIS,
  }: {
    tx:             Transaction
    durationMinutes: number
    isGracePeriod:  boolean
    gracePeriod:    number
    onSelectCash:   () => void
    onSelectQRIS:   () => void
  } = $props()
</script>

<div class="w-full max-w-[700px] flex flex-col gap-6">

  <!-- Info transaksi -->
  <div class="border border-gray-200 grid grid-cols-2">
    <!-- Durasi -->
    <div class="p-8 border-r border-gray-200 flex flex-col gap-2 justify-center">
      <p class="text-[13px] text-gray-400 uppercase tracking-[0.12em]">Durasi Parkir</p>
      <p class="text-[36px] font-bold text-[#1a56db] leading-none">{formatDurationMinutes(durationMinutes)}</p>
      {#if isGracePeriod}
        <div class="inline-flex items-center gap-1.5 bg-green-100 border border-green-300 px-2 py-1 w-fit mt-1">
          <CircleCheckBig size={12} class="text-green-700 shrink-0" />
          <span class="text-[11px] font-bold text-green-700 uppercase tracking-[0.1em]">
            GRATIS — Masih dalam grace period ({gracePeriod} mnt)
          </span>
        </div>
      {/if}
    </div>
    <!-- Fee -->
    <div class="p-8 flex flex-col gap-2 justify-center">
      <p class="text-[13px] text-gray-400 uppercase tracking-[0.12em]">Total Bayar</p>
      {#if isGracePeriod}
        <p class="text-[36px] font-bold text-[#15803d] leading-none">Rp 0</p>
        <p class="text-xs text-gray-500 line-through">{formatCurrency(tx.calculated_fee ?? 0)}</p>
      {:else}
        <p class="text-[36px] font-bold text-gray-900 leading-none">{formatCurrency(tx.calculated_fee ?? 0)}</p>
      {/if}
    </div>
  </div>

  <!-- Label -->
  <p class="text-center text-[13px] text-gray-500 uppercase tracking-[0.1em]">
    {isGracePeriod ? 'Pilih konfirmasi untuk melanjutkan' : 'Pilih metode pembayaran'}
  </p>

  <!-- Tombol metode -->
  <div class="grid grid-cols-2 gap-4">
    <!-- Tunai -->
    <button
      onclick={onSelectCash}
      class="flex flex-col items-center justify-center gap-4 py-10 px-4 border-2 border-gray-200 bg-white cursor-pointer transition-colors hover:border-[#1a56db] hover:bg-blue-50 active:scale-[0.98]"
    >
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <rect x="4" y="14" width="44" height="24" rx="3" stroke="#1a56db" stroke-width="2.5"/>
        <circle cx="26" cy="26" r="6" stroke="#1a56db" stroke-width="2.5"/>
        <line x1="4" y1="20" x2="12" y2="20" stroke="#1a56db" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="40" y1="20" x2="48" y2="20" stroke="#1a56db" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="4" y1="32" x2="12" y2="32" stroke="#1a56db" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="40" y1="32" x2="48" y2="32" stroke="#1a56db" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <span class="text-base font-bold text-gray-900 uppercase tracking-[0.08em]">TUNAI</span>
    </button>

    <!-- QRIS -->
    <button
      onclick={onSelectQRIS}
      class="flex flex-col items-center justify-center gap-4 py-10 px-4 border-2 border-gray-200 bg-white cursor-pointer transition-colors hover:border-[#1a56db] hover:bg-blue-50 active:scale-[0.98]"
    >
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <rect x="4" y="4" width="18" height="18" rx="2" stroke="#1a56db" stroke-width="2.5"/>
        <rect x="9" y="9" width="8" height="8" fill="#1a56db"/>
        <rect x="30" y="4" width="18" height="18" rx="2" stroke="#1a56db" stroke-width="2.5"/>
        <rect x="35" y="9" width="8" height="8" fill="#1a56db"/>
        <rect x="4" y="30" width="18" height="18" rx="2" stroke="#1a56db" stroke-width="2.5"/>
        <rect x="9" y="35" width="8" height="8" fill="#1a56db"/>
        <line x1="30" y1="30" x2="38" y2="30" stroke="#1a56db" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="30" y1="38" x2="48" y2="38" stroke="#1a56db" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="38" y1="30" x2="38" y2="48" stroke="#1a56db" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="48" y1="30" x2="48" y2="38" stroke="#1a56db" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <span class="text-base font-bold text-gray-900 uppercase tracking-[0.08em]">QRIS</span>
    </button>
  </div>

</div>
