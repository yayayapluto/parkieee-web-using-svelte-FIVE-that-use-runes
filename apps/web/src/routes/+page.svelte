<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { ROLE_REDIRECT } from '$lib/utils/role'
  import { getToken, getRole } from '$lib/utils/auth'
  import { onMount } from 'svelte'

  onMount(() => {
    const token = getToken()
    if (token) {
      const role = getRole()
      const redirect = role ? (ROLE_REDIRECT[role] ?? '/masuk') : '/masuk'
      goto(redirect)
    } else {
      goto('/masuk')
    }
  })
</script>
