<script lang="ts">
  import { normalizePlate } from '$lib/utils/plate'

  const { plate, size = 'md', mismatch } = $props<{
    plate: string | null | undefined
    size?: 'sm' | 'md' | 'lg'
    mismatch?: boolean
  }>()

  const sizeClass = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }
</script>

{#if plate}
  <span
    class="inline-flex items-center rounded border font-mono font-medium tracking-widest
      {sizeClass[size]}
      {mismatch
        ? 'border-red-300 bg-red-50 text-red-700'
        : 'border-slate-300 bg-slate-50 text-slate-900'}"
  >
    {normalizePlate(plate)}
  </span>
{:else}
  <span class="font-mono text-xs text-slate-400">—</span>
{/if}
