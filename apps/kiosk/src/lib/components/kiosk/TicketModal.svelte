<script lang="ts">
  import { Loader2 } from 'lucide-svelte'
  import * as Dialog from '$lib/components/ui/dialog/index.js'

  let {
    showModal,
    ticketImg,
    ticketCode,
    modalCountdown,
    onCloseModal,
  }: {
    showModal:      boolean
    ticketImg:      string
    ticketCode:     string
    modalCountdown: number
    onCloseModal:   () => void
  } = $props()
</script>

<Dialog.Root open={showModal} onOpenChange={(o) => { if (!o) onCloseModal() }}>
  <Dialog.Content
    class="p-0 gap-0 w-[480px] max-w-[95vw] max-h-[85vh] flex flex-col rounded-none border-0 shadow-[0_30px_80px_rgba(0,0,0,0.35)] overflow-hidden"
  >
    <Dialog.Header
      class="px-5 py-3.5 border-b border-gray-200 flex-row items-center justify-between shrink-0 gap-0"
    >
      <Dialog.Title class="text-xs font-bold tracking-[0.2em] uppercase text-gray-900">
        Tiket Parkir
      </Dialog.Title>
      <span class="text-gray-400 text-[10px] tracking-[0.15em] uppercase">
        Menutup dalam {modalCountdown}d
      </span>
    </Dialog.Header>

    <div class="flex-1 overflow-auto min-h-0">
      <div class="bg-white relative min-h-[200px]">
        {#if ticketImg}
          <img
            src={ticketImg}
            alt="Tiket Parkir"
            class="w-full h-auto block opacity-0 transition-opacity duration-300"
            onload={(e) => { (e.currentTarget as HTMLImageElement).classList.replace('opacity-0', 'opacity-100') }}
          />
        {/if}
        <div
          class="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
          class:opacity-0={!!ticketImg}
          class:opacity-100={!ticketImg}
        >
          <Loader2 size={36} class="animate-spin text-gray-300" />
        </div>
      </div>
    </div>

    <Dialog.Footer class="border-t border-gray-200 px-5 py-3 shrink-0">
      <Dialog.Close
        onclick={onCloseModal}
        class="text-[11px] font-bold tracking-[0.2em] uppercase px-8 py-2.5 bg-gray-900 text-white cursor-pointer hover:bg-gray-800 transition-colors rounded-none"
      >
        TUTUP
      </Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
