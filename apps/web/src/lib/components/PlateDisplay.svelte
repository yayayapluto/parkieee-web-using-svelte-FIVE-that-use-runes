<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { normalizePlate } from '$lib/utils/plate'

  const { plate, size = 'md', mismatch } = $props<{
    plate: string | null | undefined
    size?: 'sm' | 'md' | 'lg'
    mismatch?: boolean
  }>()

  const sizeClass = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-[13px]',
    lg: 'px-4 py-1.5 text-[14px]',
  }
</script>

{#if plate}
  <Badge
    class="font-mono font-medium tracking-widest {sizeClass[size]} {mismatch
      ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-50'
      : 'border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-50'}"
  >
    {normalizePlate(plate)}
  </Badge>
{:else}
  <span class="font-mono text-[12px] text-gray-400">—</span>
{/if}
