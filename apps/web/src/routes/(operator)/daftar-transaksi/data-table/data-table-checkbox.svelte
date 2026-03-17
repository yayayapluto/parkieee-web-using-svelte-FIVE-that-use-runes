<script lang="ts">
  import { Checkbox } from '$lib/components/ui/checkbox'

  let {
    checked,
    indeterminate = false,
    onCheckedChange,
    'aria-label': ariaLabel,
  } = $props<{
    checked: boolean
    indeterminate?: boolean
    onCheckedChange: (v: boolean) => void
    'aria-label'?: string
  }>()
</script>

<Checkbox
  {checked}
  {indeterminate}
  {onCheckedChange}
  aria-label={ariaLabel}
  class="data-[state=checked]:border-[#e11d48] data-[state=checked]:bg-[#e11d48]"
/>
