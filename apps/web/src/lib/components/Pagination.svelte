<script lang="ts">
  const { page, totalPages, onPageChange } = $props<{
    page: number
    totalPages: number
    onPageChange: (page: number) => void
  }>()

  function getPages(current: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

    if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]

    return [1, '...', current - 1, current, current + 1, '...', total]
  }

  const pages = $derived(getPages(page, totalPages))
</script>

{#if totalPages > 1}
  <div class="flex items-center gap-1">
    <button
      onclick={() => onPageChange(page - 1)}
      disabled={page === 1}
      class="flex h-7 w-7 items-center justify-center rounded border border-surface-border text-xs text-slate-600
        hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
    >
      ‹
    </button>

    {#each pages as p}
      {#if p === '...'}
        <span class="flex h-7 w-7 items-center justify-center text-xs text-slate-400">…</span>
      {:else}
        <button
          onclick={() => onPageChange(p as number)}
          class="flex h-7 w-7 items-center justify-center rounded border text-xs transition-colors
            {page === p
              ? 'border-brand-500 bg-brand-500 text-white'
              : 'border-surface-border text-slate-600 hover:bg-surface-muted'}"
        >
          {p}
        </button>
      {/if}
    {/each}

    <button
      onclick={() => onPageChange(page + 1)}
      disabled={page === totalPages}
      class="flex h-7 w-7 items-center justify-center rounded border border-surface-border text-xs text-slate-600
        hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
    >
      ›
    </button>
  </div>
{/if}
