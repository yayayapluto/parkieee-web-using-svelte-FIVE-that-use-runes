<script lang="ts">
  import { Loader2 } from 'lucide-svelte'
  import KioskModal from './KioskModal.svelte'

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

<KioskModal show={showModal} title="Tiket Parkir" countdown={modalCountdown} onClose={onCloseModal}>
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
</KioskModal>
