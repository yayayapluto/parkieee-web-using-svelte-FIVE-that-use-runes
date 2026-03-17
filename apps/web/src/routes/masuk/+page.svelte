<script lang="ts">
  import { goto } from '$app/navigation'
  import { z } from 'zod'
  import { login } from '$lib/api/auth'
  import { getToken, getRole } from '$lib/utils/auth'
  import { ROLE_REDIRECT } from '$lib/utils/role'
  import { onMount } from 'svelte'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Label } from '$lib/components/ui/label'
  import { Eye, EyeOff, Loader2 } from 'lucide-svelte'

  const REMEMBER_KEY = 'parkiye_remember_email'
  let rememberMe = $state(false)

  let showPassword = $state(false)

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
      return
    }
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) { values.email = saved; rememberMe = true }
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
      if (rememberMe) localStorage.setItem(REMEMBER_KEY, result.data.email)
      else localStorage.removeItem(REMEMBER_KEY)
      await goto(ROLE_REDIRECT[data.user.role.name] ?? '/')
    } catch (err) {
      serverError = err instanceof Error ? err.message : 'Login gagal'
      loading = false
    }
  }
</script>

<div class="flex min-h-[100dvh] items-center justify-center bg-[#f4f4f5] px-4">
  <div class="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8">

    <h1 class="mb-6 text-[15px] font-semibold text-gray-900">Masuk ke Parkiye</h1>

    <div class="space-y-4">

      <div class="space-y-1.5">
        <label for="email" class="block text-[13px] font-medium text-gray-700">Email</label>
        <Input
          id="email"
          type="email"
          autocomplete="email"
          placeholder="nama@email.com"
          bind:value={values.email}
          class={errors.email ? 'border-red-400 focus-visible:ring-red-200' : ''}
        />
        {#if errors.email}
          <p class="text-[11px] text-red-500">{errors.email}</p>
        {/if}
      </div>

      <div class="space-y-1.5">
        <label for="password" class="block text-[13px] font-medium text-gray-700">Password</label>
        <div class="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autocomplete="current-password"
            placeholder="••••••••"
            bind:value={values.password}
            class="pr-10 {errors.password ? 'border-red-400 focus-visible:ring-red-200' : ''}"
          />
          <button
            type="button"
            onclick={() => showPassword = !showPassword}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabindex="-1"
          >
            {#if showPassword}
              <EyeOff size={15} />
            {:else}
              <Eye size={15} />
            {/if}
          </button>
        </div>
        {#if errors.password}
          <p class="text-[11px] text-red-500">{errors.password}</p>
        {/if}
      </div>

      <div class="flex items-center gap-2">
        <Checkbox
          id="remember"
          bind:checked={rememberMe}
          class="data-[state=checked]:border-[#e11d48] data-[state=checked]:bg-[#e11d48]"
        />
        <Label for="remember" class="cursor-pointer text-[13px] font-normal text-gray-600">Ingat saya</Label>
      </div>

      {#if serverError}
        <p class="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-600">{serverError}</p>
      {/if}

      <Button
        onclick={handleSubmit}
        disabled={loading}
        class="w-full !bg-[#e11d48] !text-white hover:!bg-[#be123c] disabled:opacity-60"
      >
        {#if loading}
          <Loader2 size={15} class="animate-spin" />
          Memuat...
        {:else}
          Masuk
        {/if}
      </Button>

    </div>
  </div>
</div>
