<script lang="ts">
  import { goto } from '$app/navigation'
  import { z } from 'zod'
  import { login } from '$lib/api/auth'
  import { getToken, getRole } from '$lib/utils/auth'
  import { ROLE_REDIRECT } from '$lib/utils/role'
  import { onMount } from 'svelte'

  const schema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
  })

  let values = $state({ email: '', password: '' })
  let errors = $state<Record<string, string>>({})
  let serverError = $state('')
  let loading = $state(false)

  onMount(() => {
    if (getToken()) {
      const role = getRole()
      goto(role ? (ROLE_REDIRECT[role] ?? '/') : '/')
    }
  })

  async function handleSubmit() {
    const result = schema.safeParse(values)
    if (!result.success) {
      errors = Object.fromEntries(result.error.issues.map(i => [i.path[0], i.message]))
      return
    }
    errors = {}
    serverError = ''
    loading = true
    try {
      const data = await login(result.data.email, result.data.password)
      const role = data.user.role.name
      goto(ROLE_REDIRECT[role] ?? '/')
    } catch (err) {
      serverError = err instanceof Error ? err.message : 'Login gagal'
    } finally {
      loading = false
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-surface-muted">
  <div class="w-full max-w-sm rounded border border-surface-border bg-surface p-8 shadow-sm">
    <h1 class="mb-6 text-sm font-semibold text-slate-900">Masuk ke Parkiye</h1>

    <div class="space-y-4">
      <div>
        <label for="email" class="mb-1 block text-xs font-medium text-slate-700">Email</label>
        <input
          id="email"
          type="email"
          autocomplete="email"
          bind:value={values.email}
          class="w-full rounded border px-3 py-2 text-sm text-slate-900 outline-none transition-colors
            {errors.email
              ? 'border-red-400 focus:border-red-500'
              : 'border-surface-border focus:border-brand-500'}"
        />
        {#if errors.email}
          <p class="mt-1 text-xs text-red-500">{errors.email}</p>
        {/if}
      </div>

      <div>
        <label for="password" class="mb-1 block text-xs font-medium text-slate-700">Password</label>
        <input
          id="password"
          type="password"
          autocomplete="current-password"
          bind:value={values.password}
          class="w-full rounded border px-3 py-2 text-sm text-slate-900 outline-none transition-colors
            {errors.password
              ? 'border-red-400 focus:border-red-500'
              : 'border-surface-border focus:border-brand-500'}"
        />
        {#if errors.password}
          <p class="mt-1 text-xs text-red-500">{errors.password}</p>
        {/if}
      </div>

      {#if serverError}
        <p class="text-xs text-red-500">{serverError}</p>
      {/if}

      <button
        onclick={handleSubmit}
        disabled={loading}
        class="w-full rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors
          hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Memuat...' : 'Masuk'}
      </button>
    </div>
  </div>
</div>
