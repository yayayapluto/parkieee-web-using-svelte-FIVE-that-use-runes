<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { getToken, getRole } from '$lib/utils/auth'
  import { hasRole } from '$lib/utils/role'
  import AppShell from '$lib/components/layout/AppShell.svelte'
  import { LayoutDashboard, TrendingUp, SquareParking, ClipboardList } from 'lucide-svelte'

  const { children } = $props()

  const navItems = [
    { href: '/monitoring/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
    { href: '/monitoring/revenue',   label: 'Pendapatan', icon: TrendingUp },
    { href: '/monitoring/occupancy', label: 'Okupansi',   icon: SquareParking },
    { href: '/monitoring/audit',     label: 'Audit Log',  icon: ClipboardList },
  ]

  onMount(() => {
    if (!getToken() || !hasRole(['owner', 'admin'], getRole())) {
      goto('/login')
    }
  })
</script>

<AppShell {navItems} title="Monitoring">
  {@render children()}
</AppShell>
