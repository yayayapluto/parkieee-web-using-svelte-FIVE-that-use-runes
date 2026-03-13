<script lang="ts">
  import { Loader2 } from 'lucide-svelte'
  import { formatCurrency, formatDurationMinutes } from '$lib/utils/format'
  import type { Transaction } from '$lib/types/domain'

  let {
    tx,
    step,
    errorMsg,
    hasResult,
    durationMinutes,
    entryPlate,
    translateError,
    formatDT,
    showingPayModal = false,
  }: {
    tx:             Transaction | null
    step:           string
    errorMsg:       string
    hasResult:      boolean
    durationMinutes: number
    entryPlate:     string | null
    translateError: (msg: string) => string
    formatDT:       (iso: string) => string
    showingPayModal?: boolean
  } = $props()

  // Panel menampilkan data jika transaksi sudah sukses ATAU sedang di modal payment
  const showData = $derived(hasResult || (showingPayModal && tx !== null))
</script>

<div class="flex-1 border-r border-gray-300 flex flex-col">

  <!-- Waktu masuk/keluar -->
  <div class="border-b border-gray-200 px-6 h-14 flex flex-col justify-center shrink-0">
    <span class="text-gray-400 text-[11px] tracking-[0.25em] uppercase block mb-0.5">Waktu Masuk — Keluar</span>
    {#if showData && tx}
      <span class="text-gray-600 text-sm">{formatDT(tx.entry_at)} — {tx.exit_at ? formatDT(tx.exit_at) : 'sekarang'}</span>
    {:else}
      <span class="text-gray-200 text-sm">—</span>
    {/if}
  </div>

  <!-- Durasi -->
  <div class="border-b border-gray-200 h-[52px] flex items-center justify-center shrink-0">
    {#if showData}
      <span class="text-[#1a56db] text-xl font-semibold">{formatDurationMinutes(durationMinutes)}</span>
    {:else}
      <span class="text-gray-200 text-xl font-semibold">—</span>
    {/if}
  </div>

  <!-- Tipe -->
  <div class="border-b border-gray-200 h-[52px] flex items-center justify-center shrink-0">
    {#if showData && tx}
      <span class="text-gray-600 text-xl font-semibold tracking-[0.2em] uppercase">
        {tx.entry_method === 'rfid' ? 'MEMBER' : 'CASUAL'}
      </span>
    {:else}
      <span class="text-gray-200 text-xl tracking-[0.2em]">—</span>
    {/if}
  </div>

  <!-- Kode transaksi -->
  <div class="border-b border-gray-200 h-12 flex items-center justify-center shrink-0">
    {#if showData && tx}
      <span class="text-gray-500 text-[15px] font-mono tracking-[0.05em]">{tx.transaction_code}</span>
    {:else}
      <span class="text-gray-200 text-[15px] font-mono">—</span>
    {/if}
  </div>

  <!-- Fee besar -->
  <div class="flex-1 flex items-center justify-center px-6 py-4">
    {#if step === 'loading'}
      <Loader2 size={36} class="animate-spin text-gray-300" />
    {:else if step === 'error'}
      <span class="text-red-400 text-xl font-medium text-center leading-snug">{translateError(errorMsg)}</span>
    {:else if showData && tx}
      <span class="text-gray-900 text-[52px] font-black leading-none">
        {tx.calculated_fee != null ? formatCurrency(tx.calculated_fee) : '—'}
      </span>
    {:else}
      <span class="text-gray-200 text-[52px] font-black">—</span>
    {/if}
  </div>

  <!-- Footer scan -->
  <div class="border-t border-gray-200 px-6 h-12 flex items-center gap-3 shrink-0">
    {#if hasResult}
      <span class="text-gray-400 text-[13px] tracking-[0.15em] uppercase">TERIMA KASIH — SELAMAT JALAN</span>
    {:else if showData}
      <span class="text-gray-400 text-[13px] tracking-[0.1em] uppercase">Proses pembayaran — pilih metode</span>
    {:else}
      <span class="text-gray-400 text-[13px] tracking-[0.1em] uppercase">Arahkan QR tiket ke kamera</span>
    {/if}
  </div>

</div>
