<script lang="ts">
  import type { Snippet } from 'svelte'
  import * as Dialog from '$lib/components/ui/dialog/index.js'

  let {
    show,
    title,
    countdown  = null,
    footerLabel = 'TUTUP',
    lockClose   = false,
    onClose,
    children,
  }: {
    show:         boolean
    title:        string
    countdown?:   number | null
    footerLabel?: string
    lockClose?:   boolean
    onClose:      () => void
    children:     Snippet
  } = $props()
</script>

<Dialog.Root
  open={show}
  onOpenChange={(o) => { if (!o && !lockClose) onClose() }}
  closeOnEscape={!lockClose}
  closeOnOutsideClick={!lockClose}
>
  <Dialog.Content
    class="p-0 gap-0 w-[480px] max-w-[95vw] max-h-[85vh] flex flex-col rounded-none border-0 shadow-[0_30px_80px_rgba(0,0,0,0.35)] overflow-hidden"
    onEscapeKeyDown={(e) => { if (lockClose) e.preventDefault() }}
    onInteractOutside={(e) => { if (lockClose) e.preventDefault() }}
    onPointerDownOutside={(e) => { if (lockClose) e.preventDefault() }}
  >
    <Dialog.Header
      class="px-5 py-3.5 border-b border-gray-200 flex-row items-center justify-between shrink-0 gap-0"
    >
      <Dialog.Title class="text-xs font-bold tracking-[0.2em] uppercase text-gray-900">
        {title}
      </Dialog.Title>
      {#if countdown != null}
        <span class="text-gray-400 text-[10px] tracking-[0.15em] uppercase">
          Menutup dalam {countdown}d
        </span>
      {/if}
    </Dialog.Header>

    <div class="flex-1 overflow-auto min-h-0">
      {@render children()}
    </div>

    {#if footerLabel}
      <Dialog.Footer class="border-t border-gray-200 px-5 py-3 shrink-0">
        <Dialog.Close
          onclick={onClose}
          class="text-[11px] font-bold tracking-[0.2em] uppercase px-8 py-2.5 bg-gray-900 text-white cursor-pointer hover:bg-gray-800 transition-colors rounded-none"
        >
          {footerLabel}
        </Dialog.Close>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
