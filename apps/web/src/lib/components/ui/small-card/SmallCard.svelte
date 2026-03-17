<script lang="ts">
  import type { Snippet } from 'svelte'

  const { left, right } = $props<{
    left: Snippet
    right?: Snippet
  }>()
</script>

<div class="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2">
  <div class="flex-1 min-w-0">
    {@render left()}
  </div>
  {#if right}
    <div class="flex-shrink-0">
      {@render right()}
    </div>
  {/if}
</div>
