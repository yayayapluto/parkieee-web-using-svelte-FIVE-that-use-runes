<script lang="ts">
  import type { Snippet } from 'svelte'

  const { children } = $props<{ children: Snippet }>()
</script>

<div class="flex h-screen w-screen items-center justify-center overflow-hidden bg-slate-950">
  {@render children()}
</div>
