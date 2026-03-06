<script lang="ts">
  import { Loader2 } from 'lucide-svelte'
  import { CheckCircle2 } from 'lucide-svelte'

  let {
    step,
    rfidInput,
  }: {
    step:      string
    rfidInput: string
  } = $props()
</script>

<div class="flex shrink-0 border-b border-gray-200 h-[220px]">

  <!-- Status area -->
  <div class="flex-1 border-r border-gray-200 flex items-center justify-center px-8">
    <div class="flex flex-col items-center justify-center gap-3">
      {#if step === 'loading'}
        <Loader2 size={40} class="animate-spin text-gray-300" />
        <span class="text-gray-300 text-sm tracking-[0.2em] uppercase">Memproses...</span>
      {:else if step === 'success'}
        <CheckCircle2 size={72} class="text-green-500" strokeWidth={1.5} />
        <span class="text-gray-700 text-xl font-bold tracking-[0.15em] uppercase">SILAKAN KELUAR</span>
      {:else}
        <span class="text-gray-200 text-[56px] font-black leading-none">—</span>
        <span class="text-gray-300 text-sm tracking-[0.2em] uppercase">Menunggu scan...</span>
      {/if}
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
