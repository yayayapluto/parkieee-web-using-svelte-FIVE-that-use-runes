<script lang="ts">
  let { value } = $props<{ value: string }>()
  const short = $derived(value ? value.slice(0, 8) + '…' : '—')
</script>
<span class="font-mono text-[11px] text-gray-400" title={value}>{short}</span>
