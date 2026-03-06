<script lang="ts">
  import { Loader2 } from 'lucide-svelte'

  let {
    step,
    rfidInput,
    onCetakTiket,
  }: {
    step:         string
    rfidInput:    string
    onCetakTiket: () => void
  } = $props()
</script>

<div class="flex shrink-0 border-b border-gray-200 h-[220px]">
  <!-- Tombol -->
  <div class="flex-1 border-r border-gray-200 flex items-center justify-center gap-20 px-8">
    <div class="flex flex-col items-center gap-2">
      <button
        onclick={onCetakTiket}
        disabled={step === 'loading'}
        class="w-40 h-40 rounded-full bg-green-500 border-[5px] border-green-900 cursor-pointer active:scale-[0.93] transition-transform disabled:opacity-50"
      ></button>
      <span class="text-gray-400 text-sm tracking-[0.2em] uppercase">Tiket</span>
    </div>
    <div class="flex flex-col items-center gap-2">
      <button class="w-40 h-40 rounded-full bg-red-500 border-[5px] border-red-900 cursor-pointer active:scale-[0.93] transition-transform"></button>
      <span class="text-gray-400 text-sm tracking-[0.2em] uppercase">Bantuan</span>
    </div>
  </div>

  <!-- RFID -->
  <div class="flex-1 flex flex-col justify-center px-6 gap-1">
    <span class="text-gray-400 text-sm tracking-[0.25em] uppercase">Tempel Kartu</span>
    {#if rfidInput}
      <span class="text-gray-900 text-xl font-medium font-mono tracking-[0.1em]">{rfidInput}</span>
    {:else}
      <span class="text-gray-300 text-lg">menunggu kartu...</span>
    {/if}
  </div>
</div>
