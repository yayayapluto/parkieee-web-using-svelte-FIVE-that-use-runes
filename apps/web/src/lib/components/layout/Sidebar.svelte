<script lang="ts">
  import { page } from '$app/stores'
  import type { Component } from 'svelte'

  interface NavItem {
    href: string
    label: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Component<any>
  }

  const { navItems } = $props<{ navItems: NavItem[] }>()

  function isActive(href: string): boolean {
    return $page.url.pathname.startsWith(href)
  }
</script>

<aside class="flex h-full w-56 flex-shrink-0 flex-col bg-brand-600">
  <div class="flex h-12 items-center px-5">
    <span class="font-mono text-sm font-semibold tracking-widest text-white">PARKIYE</span>
  </div>

  <nav class="flex-1 overflow-y-auto px-3 py-2">
    <ul class="space-y-0.5">
      {#each navItems as item}
        <li>
          <a
            href={item.href}
            class="flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors
              {isActive(item.href)
                ? 'bg-brand-500 text-white'
                : 'text-brand-100 hover:bg-brand-500/50 hover:text-white'}"
          >
            <item.icon size={16} strokeWidth={1.75} />
            <span>{item.label}</span>
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</aside>
