<script lang="ts">
  import { onMount } from 'svelte'
  import { getGateInfo } from '$lib/utils/auth'

  onMount(() => {
    const gate = getGateInfo()
    if (gate) {
      window.location.href = `/gate/${gate.id}`
    } else {
      window.location.href = '/setup'
    }
  })
</script>
