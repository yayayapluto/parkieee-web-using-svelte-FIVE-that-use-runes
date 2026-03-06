<script lang="ts">
  import { Loader2 } from 'lucide-svelte'

  let {
    step,
    errorMsg,
    panelState,
    ticketCode,
    ticketPlate,
    ticketMethod,
    translateError,
  }: {
    step:           string
    errorMsg:       string
    panelState:     'idle' | 'success'
    ticketCode:     string
    ticketPlate:    string | null
    ticketMethod:   'qr' | 'rfid'
    translateError: (msg: string) => string
  } = $props()
</script>

<div class="w-[42%] flex flex-col bg-gray-50">
  <!-- Plate label -->
  <div class="border-b border-gray-300 px-4 py-3 text-center min-h-[48px] flex items-center justify-center shrink-0">
    {#if panelState === 'success'}
      <span class="text-gray-700 text-xl font-semibold tracking-[0.2em] uppercase font-mono">
        {ticketPlate ?? '—'}
      </span>
    {:else}
      <span class="text-gray-300 text-xl font-semibold tracking-[0.2em]">—</span>
    {/if}
  </div>

  <!-- Main content -->
  <div class="flex-1 flex flex-col items-center justify-center px-6 gap-2 text-center">
    {#if step === 'loading'}
      <Loader2 size={40} class="animate-spin text-gray-400" />
      <span class="text-gray-500 text-lg mt-2">Memproses...</span>
    {:else if step === 'error'}
      <span class="text-red-400 text-lg font-medium leading-snug">{translateError(errorMsg)}</span>
    {:else if panelState === 'success'}
      <span class="text-gray-900 text-[40px] font-black tracking-[0.05em] leading-tight">{ticketCode || '—'}</span>
      <span class="text-gray-500 text-lg">
        {ticketMethod === 'rfid' ? 'Kartu terdeteksi' : 'Tiket tercetak'}
      </span>
    {:else}
      <span class="text-gray-200 text-5xl font-black tracking-[0.05em]">—</span>
      <span class="text-gray-300 text-lg">menunggu...</span>
    {/if}
  </div>

  <!-- Action label -->
  <div class="border-t border-gray-300 bg-gray-100 px-4 py-4 text-center shrink-0">
    {#if panelState === 'success'}
      <span class="text-gray-700 text-xl font-semibold tracking-[0.2em] uppercase">SILAKAN MASUK</span>
    {:else}
      <span class="text-gray-300 text-xl font-semibold tracking-[0.2em]">Silakan ambil tiket atau tempel kartu</span>
    {/if}
  </div>
</div>
