<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import type { Component } from 'svelte'
  import { getUserName, getRole, clearToken } from '$lib/utils/auth'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import * as AlertDialog from '$lib/components/ui/alert-dialog'
  import { LogOut } from 'lucide-svelte'

  interface NavItem {
    href: string
    label: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Component<any>
  }

  const { navItems } = $props<{ navItems: NavItem[] }>()

  const roleLabel: Record<string, string> = {
    operator: 'Operator',
    admin: 'Admin',
    owner: 'Pemilik',
    engineer: 'Engineer',
  }

  const name = getUserName() ?? '—'
  const role = getRole()
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  let confirmOpen = $state(false)

  function isActive(href: string): boolean {
    return $page.url.pathname.startsWith(href)
  }

  function handleLogout() {
    clearToken()
    goto('/masuk')
  }
</script>

<Sidebar.Root collapsible="icon" class="border-r border-sidebar-border">

  <Sidebar.Header class="h-12 justify-center border-b border-sidebar-border px-3">
    <div class="flex items-center gap-2">
      <div class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[#e11d48]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div class="group-data-[collapsible=icon]:hidden">
        <div class="text-[13px] font-bold leading-tight text-gray-900">Parkiye</div>
        <div class="text-[11px] leading-tight text-gray-400">ERP Parkir</div>
      </div>
    </div>
  </Sidebar.Header>

  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel class="text-[11px] font-semibold uppercase tracking-widest">
        Menu
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each navItems as item}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                isActive={isActive(item.href)}
                class="text-[13.5px]"
              >
                {#snippet child({ props })}
                  <a href={item.href} {...props}>
                    <item.icon size={15} strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>

  <Sidebar.Footer class="border-t border-sidebar-border p-3">
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton onclick={() => confirmOpen = true} class="h-auto py-1.5">
          {#snippet child({ props })}
            <button {...props} class={props.class}>
              <div class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#e11d48] text-[10px] font-bold text-white">
                {initials}
              </div>
              <div class="min-w-0 flex-1 group-data-[collapsible=icon]:hidden text-left">
                <div class="truncate text-[12px] font-semibold leading-tight">{name}</div>
                <div class="text-[11px] leading-tight text-sidebar-foreground/50">{role ? (roleLabel[role] ?? role) : '—'}</div>
              </div>
              <LogOut size={14} class="flex-shrink-0 group-data-[collapsible=icon]:hidden opacity-50" />
            </button>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>

</Sidebar.Root>

<AlertDialog.Root bind:open={confirmOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Keluar dari Parkiye?</AlertDialog.Title>
      <AlertDialog.Description>
        Kamu akan keluar dari sesi ini. Pastikan semua pekerjaan sudah tersimpan.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
      <AlertDialog.Action
        onclick={handleLogout}
        class="bg-[#e11d48] text-white hover:bg-[#be123c]"
      >
        Ya, Keluar
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
