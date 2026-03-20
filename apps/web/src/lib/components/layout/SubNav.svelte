<script lang="ts">
    import {page} from '$app/stores'
    import type {Component} from 'svelte'
    import {getUserName} from '$lib/utils/auth'
    import {logout} from '$lib/api/auth'
    import {LogOut, ChevronLeft, ChevronRight} from 'lucide-svelte'
    import * as AlertDialog from '$lib/components/ui/alert-dialog'

    interface NavItem {
        href: string
        label: string
        icon: Component<any>
    }

    const {title, navItems, collapsed, onToggle} = $props<{
        title: string
        navItems: NavItem[]
        collapsed: boolean
        onToggle: () => void
    }>()

    const rawName = getUserName()
    const role = $derived($page.data.user?.role ?? null)

    const roleLabel: Record<string, string> = {
        operator: 'Operator',
        admin: 'Admin',
        owner: 'Pemilik',
        engineer: 'Engineer',
        cashier: 'Kasir',
    }

    const name = rawName && rawName !== '—' ? rawName : 'Pengguna'
    const roleDisplay = role ? (roleLabel[role] ?? role) : '—'

    // Ambil dua huruf pertama dari kata-kata yang valid
    const initials = name
        .split(' ')
        .filter(w => w.length > 0 && w !== '—')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'P'

    let confirmOpen = $state(false)

    const toggleLeft = $derived(collapsed ? '56px' : 'calc(56px + 220px)')

    function isActive(href: string): boolean {
        return $page.url.pathname.startsWith(href)
    }

    async function handleLogout() {
        await logout()
    }
</script>

<aside
        class="relative flex h-[100dvh] flex-shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200
    {collapsed ? 'w-0 overflow-hidden border-r-0' : 'w-[220px]'}"
        inert={collapsed}
>
    <div class="flex h-11 flex-shrink-0 items-center border-b border-gray-100 px-4">
        <span class="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{title}</span>
    </div>

    <nav aria-label="Navigasi {title}" class="flex-1 overflow-y-auto py-2">
        {#each navItems as item}
            <a
                    href={item.href}
                    class="flex items-center gap-2 px-4 py-2 text-[13px] transition-colors
          {isActive(item.href)
            ? 'bg-[#e11d48] font-medium text-white'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
            >
                <item.icon
                        size={14}
                        strokeWidth={1.75}
                        class="flex-shrink-0 {isActive(item.href) ? 'text-white' : 'opacity-50'}"
                />
                {item.label}
            </a>
        {/each}
    </nav>

    <div class="border-t border-gray-100 px-4 py-3">
        <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#e11d48] text-[10px] font-bold text-white">
                {initials}
            </div>
            <div class="min-w-0 flex-1">
                <p class="truncate text-[12px] font-semibold text-gray-900">{name}</p>
                <p class="truncate text-[11px] text-gray-400">{roleDisplay}</p>
            </div>
            <button
                    aria-label="Keluar"
                    class="flex-shrink-0 text-gray-300 transition-colors hover:text-gray-500 focus:outline-none"
                    onclick={() => (confirmOpen = true)}
                    title="Keluar"
            >
                <LogOut size={14}/>
            </button>
        </div>
    </div>
</aside>

<button
        aria-label={collapsed ? 'Buka menu navigasi' : 'Tutup menu navigasi'}
        class="absolute z-10 flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 focus:outline-none"
        onclick={onToggle}
        style="top: 28px; left: {toggleLeft}; transform: translateX(-50%);"
        title={collapsed ? 'Buka menu' : 'Tutup menu'}
>
    {#if collapsed}
        <ChevronRight size={10} class="text-gray-400"/>
    {:else}
        <ChevronLeft size={10} class="text-gray-400"/>
    {/if}
</button>

<AlertDialog.Root bind:open={confirmOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Keluar dari Parkiye?</AlertDialog.Title>
            <AlertDialog.Description>
                Sesi kamu akan berakhir. Pastikan semua pekerjaan sudah tersimpan.
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
