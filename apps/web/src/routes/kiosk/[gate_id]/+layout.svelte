<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { getGateToken, getGateInfo } from '$lib/utils/auth'

  const { children } = $props()

  onMount(() => {
    const token = getGateToken()
    const info  = getGateInfo()

    if (!token || !info) {
      goto('/kiosk/setup', { replaceState: true })
      return
    }

    // Pastikan gate_id di URL cocok dengan yang di localStorage.
    // Kalau tidak cocok, mungkin URL disalin ke device lain.
    const gateId = $page.params.gate_id
    if (info.id !== gateId) {
      goto('/kiosk/setup', { replaceState: true })
    }
  })
</script>

{@render children()}
