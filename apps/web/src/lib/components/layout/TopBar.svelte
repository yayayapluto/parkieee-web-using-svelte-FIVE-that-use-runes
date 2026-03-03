<script lang="ts">
  import { goto } from '$app/navigation'
  import { clearToken, getRole, getUserName } from '$lib/utils/auth'

  const { title } = $props<{ title: string }>()

  const role = getRole()

  const roleLabel: Record<string, string> = {
    operator: 'Operator',
    admin: 'Admin',
    owner: 'Pemilik',
    engineer: 'Engineer',
  }

  function handleLogout() {
    clearToken()
    goto('/login')
  }
</script>

<header class="flex h-12 flex-shrink-0 items-center justify-between border-b border-surface-border bg-surface px-6">
  <span class="text-sm font-semibold text-slate-900">{title}</span>

  <div class="flex items-center gap-4">
    <div class="text-right">
      <span class="block text-xs font-medium text-slate-900">{getUserName() ?? '—'}</span>
      <span class="block text-xs text-slate-500">{role ? (roleLabel[role] ?? role) : '—'}</span>
    </div>
    <button
      onclick={handleLogout}
      class="rounded px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-surface-muted hover:text-slate-900"
    >
      Keluar
    </button>
  </div>
</header>
