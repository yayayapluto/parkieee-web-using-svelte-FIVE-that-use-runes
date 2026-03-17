<script lang="ts">
  import { page } from '$app/stores'
  import * as Breadcrumb from '$lib/components/ui/breadcrumb'
  import * as Popover from '$lib/components/ui/popover'
  import { Button } from '$lib/components/ui/button'
  import { Bell } from 'lucide-svelte'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import { Separator } from '$lib/components/ui/separator'

  const { title } = $props<{ title: string }>()

  const LABELS: Record<string, string> = {
    transactions: 'Transaksi',
    gates: 'Gerbang',
    overrides: 'Override',
    users: 'Pengguna',
    zones: 'Zona',
    fees: 'Tarif',
    rfid: 'RFID',
    permissions: 'Izin',
    dashboard: 'Dashboard',
    revenue: 'Pendapatan',
    occupancy: 'Okupansi',
    audit: 'Audit',
    devices: 'Perangkat',
    ocr: 'OCR',
    logs: 'Log',
  }

  const crumbs = $derived(() => {
    const parts = $page.url.pathname.split('/').filter(Boolean)
    return parts.map((p, i) => ({
      label: LABELS[p] ?? (p.charAt(0).toUpperCase() + p.slice(1)),
      href: '/' + parts.slice(0, i + 1).join('/'),
      isLast: i === parts.length - 1,
    }))
  })

  // Notifikasi — static untuk MVP, nanti connect ke API
  let notifOpen = $state(false)
  let hasUnread = $state(true)

  const notifications = [
    { id: '1', title: 'Override diminta', desc: 'PKR-20260316-00012 menunggu persetujuan', time: '2 menit lalu', unread: true },
    { id: '2', title: 'Gate A error', desc: 'Gate tidak merespons sejak 07:15', time: '18 menit lalu', unread: true },
    { id: '3', title: 'Transaksi dibatalkan', desc: 'PKR-20260315-00036 dibatalkan operator', time: '1 jam lalu', unread: false },
  ]

  function markAllRead() {
    hasUnread = false
  }

</script>

<header class="flex h-12 flex-shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4">
  <Sidebar.Trigger class="-ms-1 h-8 w-8" />
  <Separator orientation="vertical" class="mr-1 h-4" />
  <Breadcrumb.Root>
    <Breadcrumb.List>
      {#each crumbs() as crumb, i}
        <Breadcrumb.Item>
          {#if crumb.isLast}
            <Breadcrumb.Page class="text-[13px] font-medium text-gray-800">
              {crumb.label}
            </Breadcrumb.Page>
          {:else}
            <Breadcrumb.Link href={crumb.href} class="text-[13px] text-gray-400 hover:text-gray-700">
              {crumb.label}
            </Breadcrumb.Link>
          {/if}
        </Breadcrumb.Item>
        {#if !crumb.isLast}
          <Breadcrumb.Separator />
        {/if}
      {/each}
    </Breadcrumb.List>
  </Breadcrumb.Root>

  <div class="ml-auto flex items-center gap-2">
    <Popover.Root bind:open={notifOpen}>
      <Popover.Trigger>
        {#snippet child({ props })}
          <button
            {...props}
            class="relative cursor-pointer rounded-md p-1 hover:bg-gray-100"
            onclick={() => { notifOpen = !notifOpen; markAllRead() }}
          >
            <Bell size={18} stroke="#9ca3af" stroke-width={1.8} />
            {#if hasUnread}
              <span class="absolute right-0.5 top-0.5 h-[7px] w-[7px] rounded-full border-2 border-white bg-[#e11d48]"></span>
            {/if}
          </button>
        {/snippet}
      </Popover.Trigger>
      <Popover.Content align="end" class="w-80 p-0">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span class="text-[13px] font-semibold text-gray-900">Notifikasi</span>
          <Button
            variant="ghost"
            class="h-auto p-0 text-[12px] text-gray-400 hover:text-gray-700"
            onclick={markAllRead}
          >
            Tandai semua dibaca
          </Button>
        </div>
        <!-- List -->
        <div class="max-h-72 overflow-y-auto">
          {#each notifications as notif (notif.id)}
            <div class="flex items-start gap-3 border-b border-gray-100 px-4 py-3 last:border-0 {notif.unread ? 'bg-[#fff9f9]' : ''} hover:bg-gray-50 cursor-pointer">
              <div class="mt-1 flex-shrink-0">
                {#if notif.unread}
                  <span class="block h-2 w-2 rounded-full bg-[#e11d48]"></span>
                {:else}
                  <span class="block h-2 w-2 rounded-full bg-gray-200"></span>
                {/if}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-medium text-gray-800">{notif.title}</p>
                <p class="text-[12px] text-gray-500 truncate">{notif.desc}</p>
                <p class="mt-0.5 text-[11px] text-gray-400">{notif.time}</p>
              </div>
            </div>
          {/each}
        </div>
        <!-- Footer -->
        <div class="border-t border-gray-100 px-4 py-2.5">
          <Button variant="ghost" class="h-auto w-full p-0 text-[12px] text-[#e11d48] hover:text-[#be123c]">
            Lihat semua notifikasi →
          </Button>
        </div>
      </Popover.Content>
    </Popover.Root>
  </div>
</header>
