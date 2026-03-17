<script lang="ts">
  import { formatDateTime } from '$lib/utils/format'

  let { value } = $props<{ value: string | null }>()
</script>

<span class="text-[13px] text-gray-400">
  {value ? formatDateTime(value) : '—'}
</span>
