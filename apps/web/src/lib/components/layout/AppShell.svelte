<script lang="ts">
  import type { Snippet, Component } from 'svelte'
  import Sidebar from './Sidebar.svelte'
  import TopBar from './TopBar.svelte'

  export interface NavItem {
    href: string
    label: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Component<any>
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

<div class="flex h-screen overflow-hidden bg-surface-muted">
  <Sidebar {navItems} />
  <div class="flex flex-1 flex-col overflow-hidden">
    <TopBar {title} />
    <main class="flex-1 overflow-y-auto px-6 py-4">
      {@render children()}
    </main>
  </div>
</div>
