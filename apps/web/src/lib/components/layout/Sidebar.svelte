<script lang="ts">
  import {page} from '$app/stores'
  import type {Component} from 'svelte'
  import {getUserName} from '$lib/utils/auth'
  import {logout} from '$lib/api/auth'
  import {LogOut} from 'lucide-svelte'

  interface NavItem {
    href: string
    label: string
    icon: Component<any>
  }

  const { navItems } = $props<{ navItems: NavItem[] }>()

  const roleLabel: Record<string, string> = {
    operator: 'Operator',
    admin: 'Admin',
    owner: 'Pemilik',
    engineer: 'Engineer',
    cashier: 'Kasir',
  }

  const name = getUserName() ?? '—'
  const role = $derived($page.data.user?.role ?? null)
  const initials = name.split(' ').filter((w: string) => w.length > 0).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'P'

  let confirmOpen = $state(false)

  function isActive(href: string): boolean {
    return $page.url.pathname.startsWith(href)
  }

  async function handleLogout() {
    await logout()
  }
</script>

<Sidebar.Root collapsible="icon">

  <!-- Header: logo — pakai MenuButton size=lg agar collapse behavior sama dengan nav items -->
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton class="pointer-events-none data-[state=open]:bg-transparent hover:bg-transparent active:bg-transparent"
                            size="lg">
          <div class="flex h-8 w-8 items-center justify-center rounded-md bg-[#e11d48] shrink-0">
            <svg fill="none" height="14" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"
                 viewBox="0 0 24 24" width="14">
              <rect height="11" rx="2" width="18" x="3" y="11"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-bold">Parkiye</span>
            <span class="truncate text-xs text-muted-foreground">ERP Parkir</span>
          </div>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>

  <!-- Nav items -->
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Menu</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each navItems as item (item.href)}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                isActive={isActive(item.href)}
                tooltipContent={item.label}
              >
                {#snippet child({ props })}
                  <a href={item.href} {...props}>
                    <item.icon/>
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

  <!-- Footer: user — pakai MenuButton size=lg, persis seperti nav-user.svelte shadcn -->
  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton
                onclick={() => (confirmOpen = true)}
                size="lg"
                tooltipContent={name}
        >
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-[#e11d48] text-[11px] font-bold text-white shrink-0">
            {initials}
          </div>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-medium">{name}</span>
            <span class="truncate text-xs text-muted-foreground">{role ? (roleLabel[role] ?? role) : '—'}</span>
          </div>
          <LogOut class="ml-auto size-4 opacity-50"/>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>

  <Sidebar.Rail/>
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
      <AlertDialog.Action class="bg-[#e11d48] text-white hover:bg-[#be123c]" onclick={handleLogout}>
        Ya, Keluar
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
