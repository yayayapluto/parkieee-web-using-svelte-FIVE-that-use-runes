<script lang="ts">
  import { formatDateTime } from '$lib/utils/format'

  let { value } = $props<{ value: string }>()

  const display = (() => {
    if (!value) return '—'
    try {
      const d = new Date(value)
      return isNaN(d.getTime()) ? value : formatDateTime(d)
    } catch {
      return value
    }
  })()
</script>
<span class="whitespace-nowrap text-[13px] text-gray-700">{display}</span>
