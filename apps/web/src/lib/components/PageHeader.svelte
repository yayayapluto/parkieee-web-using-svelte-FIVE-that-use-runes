<script lang="ts">
  import type { Snippet } from 'svelte'

  const { title, description, actions } = $props<{
    title: string
    description?: string
    actions?: Snippet
  }>()
</script>

<div class="mb-4 flex items-start justify-between">
  <div>
    <h1 class="text-sm font-semibold text-slate-900">{title}</h1>
    {#if description}
      <p class="mt-0.5 text-xs text-slate-500">{description}</p>
    {/if}
  </div>
  {#if actions}
    <div class="flex items-center gap-2">
      {@render actions()}
    </div>
  {/if}
</div>
