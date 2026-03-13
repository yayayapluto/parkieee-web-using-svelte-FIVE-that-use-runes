<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    show,
    title,
    countdown  = null,
    footerLabel = 'TUTUP',
    onClose,
    children,
  }: {
    show:        boolean
    title:       string
    countdown?:  number | null
    footerLabel?: string
    onClose:     () => void
    children:    Snippet
  } = $props()
</script>

{#if show}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div class="bg-white w-[480px] max-h-[85vh] flex flex-col shadow-[0_30px_80px_rgba(0,0,0,0.35)] animate-[modal-in_0.2s_ease_forwards]">

      <!-- Header -->
      <div class="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between shrink-0">
        <span class="text-xs font-bold tracking-[0.2em] uppercase text-gray-900">{title}</span>
        {#if countdown != null}
          <span class="text-gray-400 text-[10px] tracking-[0.15em] uppercase">Menutup dalam {countdown}d</span>
        {/if}
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto min-h-0">
        {@render children()}
      </div>

      <!-- Footer -->
      {#if footerLabel}
        <div class="border-t border-gray-200 px-5 py-3 flex justify-end shrink-0">
          <button
            onclick={onClose}
            class="text-[11px] font-bold tracking-[0.2em] uppercase px-8 py-2.5 bg-gray-900 text-white cursor-pointer hover:bg-gray-800 transition-colors"
          >
            {footerLabel}
          </button>
        </div>
      {/if}

    </div>
  </div>
{/if}

<style>
  @keyframes modal-in {
    from { opacity: 0; transform: scale(0.96) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
</style>
