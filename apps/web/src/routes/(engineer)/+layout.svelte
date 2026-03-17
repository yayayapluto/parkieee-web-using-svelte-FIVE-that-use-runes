<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { getToken, getRole } from '$lib/utils/auth'
  import { hasRole } from '$lib/utils/role'
  import AppShell from '$lib/components/layout/AppShell.svelte'
  import { MonitorCheck, ScanLine, Wifi, ScrollText } from 'lucide-svelte'

  const { children } = $props()

  const navItems = [
    { href: '/engineer/devices', label: 'Perangkat',  icon: MonitorCheck },
    { href: '/engineer/ocr',     label: 'OCR',        icon: ScanLine },
    { href: '/engineer/rfid',    label: 'RFID',       icon: Wifi },
    { href: '/engineer/logs',    label: 'Log Sistem', icon: ScrollText },
  ]

  onMount(() => {
    if (!getToken() || !hasRole(['engineer', 'admin'], getRole())) {
      goto('/masuk')
    }
  })
</script>

<AppShell {navItems} title="Engineer">
  {@render children()}
</AppShell>
