<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { getGateInfo } from '$lib/utils/auth'

  onMount(() => {
    const gate = getGateInfo()
    if (gate) {
      goto(`/gate/${gate.id}`)
    } else {
      goto('/setup')
    }
  })
</script>
