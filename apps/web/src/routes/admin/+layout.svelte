<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { getToken, getRole } from '$lib/utils/auth'
  import { hasRole } from '$lib/utils/role'
  import AppShell from '$lib/components/layout/AppShell.svelte'
  import { Users, Map, DoorOpen, CreditCard, Coins, ShieldCheck } from 'lucide-svelte'

  const { children } = $props()

  const navItems = [
    { href: '/admin/users',       label: 'Pengguna',   icon: Users },
    { href: '/admin/zones',       label: 'Zona',       icon: Map },
    { href: '/admin/gates',       label: 'Gerbang',    icon: DoorOpen },
    { href: '/admin/rfid',        label: 'Kartu RFID', icon: CreditCard },
    { href: '/admin/fees',        label: 'Tarif',      icon: Coins },
    { href: '/admin/permissions', label: 'Izin Akses', icon: ShieldCheck },
  ]

  onMount(() => {
    if (!getToken() || !hasRole(['admin'], getRole())) {
      goto('/login')
    }
  })
</script>

<AppShell {navItems} title="Admin">
  {@render children()}
</AppShell>
