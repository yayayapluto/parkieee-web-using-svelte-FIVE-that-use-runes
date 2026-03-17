<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { getToken, can } from '$lib/utils/auth'

  const { children } = $props()

  onMount(() => {
    if (!getToken() || !can('cashier.ability')) {
      goto('/masuk')
    }
  })
</script>

{@render children()}
