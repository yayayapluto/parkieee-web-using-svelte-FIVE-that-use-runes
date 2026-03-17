<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { getToken, getRole } from '$lib/utils/auth'
  import { hasRole } from '$lib/utils/role'
  import AppShell from '$lib/components/layout/AppShell.svelte'
  import { ArrowLeftRight, DoorOpen, Wrench } from 'lucide-svelte'

  const { children } = $props()

  const navItems = [
    { href: '/daftar-transaksi', label: 'Transaksi', icon: ArrowLeftRight },
    { href: '/atur-gerbang',     label: 'Gerbang',   icon: DoorOpen },
    { href: '/tindakan',         label: 'Tindakan',  icon: Wrench },
  ]


  onMount(() => {
    if (!getToken() || !hasRole(['operator', 'admin'], getRole())) {
      goto('/masuk')
    }
  })
</script>

<AppShell {navItems} title="Operator">
  {@render children()}
</AppShell>
