<script lang="ts">
  import { formatCurrency } from '$lib/utils/format'
  let { value } = $props<{ value: number | null | undefined }>()
</script>
<div class="text-right">
  {#if value != null}
    <span class="font-bold text-[#e11d48]">{formatCurrency(value)}</span>
  {:else}
    <span class="text-gray-300">—</span>
  {/if}
</div>
