<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { getGateToken, getGateInfo } from '$lib/utils/auth'

  const { children } = $props()

  onMount(() => {
    const token  = getGateToken()
    const info   = getGateInfo()
    const gateId = $page.params.gate_id
    if (!token || !info || info.id !== gateId) {
      window.location.href = '/setup'
    }
  })
</script>

{@render children()}
