<script lang="ts">
  import type { Snippet } from 'svelte'
  import Sidebar from './Sidebar.svelte'
  import TopBar from './TopBar.svelte'
  import { Provider as SidebarProvider, Inset as SidebarInset } from '$lib/components/ui/sidebar'
  import { Toaster } from '$lib/components/ui/toast'

  export interface NavItem {
    href: string
    label: string
    icon: any
  }

  const {
    children,
    navItems,
    title,
  } = $props<{
    children: Snippet
    navItems: NavItem[]
    title: string
  }>()
</script>

<SidebarProvider
  style="--sidebar-width: 14rem; --sidebar-width-icon: 3rem;"
  class="!h-[100dvh] !min-h-0 !w-full overflow-hidden !bg-[#f4f4f5]"
>
  <Sidebar {navItems} />
  <SidebarInset class="!flex !min-w-0 flex-1 flex-col !overflow-hidden !bg-[#f4f4f5]" style="height: 100dvh;">
    <TopBar {title} />
    <main class="flex flex-1 flex-col overflow-hidden p-6">
      {@render children()}
    </main>
  </SidebarInset>
</SidebarProvider>
<Toaster />
