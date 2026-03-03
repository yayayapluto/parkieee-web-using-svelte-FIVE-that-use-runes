<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { getToken, getRole } from '$lib/utils/auth'
  import { hasRole } from '$lib/utils/role'
  import AppShell from '$lib/components/layout/AppShell.svelte'
  import { ArrowLeftRight, DoorOpen, Wrench } from 'lucide-svelte'

  const { children } = $props()

  const navItems = [
    { href: '/operator/transactions', label: 'Transaksi', icon: ArrowLeftRight },
    { href: '/operator/gates',        label: 'Gerbang',   icon: DoorOpen },
    { href: '/operator/overrides',    label: 'Override',  icon: Wrench },
  ]

  onMount(() => {
    if (!getToken() || !hasRole(['operator', 'admin'], getRole())) {
      goto('/login')
    }
  })
</script>

<AppShell {navItems} title="Operator">
  {@render children()}
</AppShell>
