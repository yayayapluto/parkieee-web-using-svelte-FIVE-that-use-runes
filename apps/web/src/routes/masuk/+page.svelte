<script lang="ts">
  import {goto, invalidateAll} from '$app/navigation'
  import {z} from 'zod'
  import {login} from '$lib/api/auth'
  import {ROLE_REDIRECT} from '$lib/utils/role'
  import {Button} from '$lib/components/ui/button'
  import {Input} from '$lib/components/ui/input'
  import {Label} from '$lib/components/ui/label'
  import {Checkbox} from '$lib/components/ui/checkbox'
  import {Eye, EyeOff, Loader2} from 'lucide-svelte'

  const REMEMBER_KEY = 'parkiye_remember_email'

  let rememberMe = $state(false)
  let showPassword = $state(false)
  let values = $state({ email: '', password: '' })
  let errors = $state<Record<string, string>>({})
  let serverError = $state('')
  let loading = $state(false)

  const schema = z.object({
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
  })

  // redirect jika sudah login ditangani +page.server.ts — tidak perlu onMount
  $effect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) {
      values.email = saved;
      rememberMe = true
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
      if (rememberMe) localStorage.setItem(REMEMBER_KEY, result.data.email)
      else localStorage.removeItem(REMEMBER_KEY)
      await invalidateAll()
      await goto(ROLE_REDIRECT[data.user.role?.name ?? ''] ?? '/')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      serverError = msg || 'Tidak dapat terhubung ke server. Coba beberapa saat lagi.'
      loading = false
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !loading) handleSubmit()
  }
</script>

<div class="flex min-h-[100dvh] items-center justify-center bg-[#f4f4f5] px-4">
  <div class="w-full max-w-sm">

    <Card.Root class="border-gray-200 shadow-sm">
      <Card.Header class="pb-4">
        <Card.Title class="text-[17px] font-semibold text-gray-900">Masuk</Card.Title>
        <Card.Description class="text-[13px] text-gray-400">
          Masuk untuk melanjutkan ke dashboard
        </Card.Description>
      </Card.Header>

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <Card.Content onkeydown={handleKeydown}>
        <div class="space-y-4">

          <div class="space-y-1.5">
            <Label class="text-[13px] font-medium text-gray-700" for="email">Email</Label>
            <Input
                    autocomplete="email"
                    bind:value={values.email}
                    class={errors.email ? 'border-red-400 focus-visible:ring-red-200' : ''}
                    disabled={loading}
                    id="email"
                    placeholder="nama@email.com"
                    type="email"
            />
            {#if errors.email}
              <p class="text-[11px] text-red-500" role="alert">{errors.email}</p>
            {/if}
          </div>

          <div class="space-y-1.5">
            <Label class="text-[13px] font-medium text-gray-700" for="password">Password</Label>
            <div class="relative">
              <Input
                      autocomplete="current-password"
                      bind:value={values.password}
                      class="pr-10 {errors.password ? 'border-red-400 focus-visible:ring-red-200' : ''}"
                      disabled={loading}
                      id="password"
                      placeholder="Minimal 8 karakter"
                      type={showPassword ? 'text' : 'password'}
              />
              <button
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      onclick={() => (showPassword = !showPassword)}
                      tabindex="-1"
                      type="button"
              >
                {#if showPassword}
                  <EyeOff size={14}/>
                {:else}
                  <Eye size={14}/>
                {/if}
              </button>
            </div>
            {#if errors.password}
              <p class="text-[11px] text-red-500" role="alert">{errors.password}</p>
            {/if}
          </div>

          <div class="flex items-center gap-2">
            <Checkbox
                    bind:checked={rememberMe}
                    class="data-[state=checked]:border-[#e11d48] data-[state=checked]:bg-[#e11d48]"
                    disabled={loading}
                    id="remember"
            />
            <Label class="cursor-pointer text-[13px] font-normal text-gray-600" for="remember">
              Ingat email saya
            </Label>
          </div>

          {#if serverError}
            <div
                    class="rounded-md border border-red-200 bg-red-50 px-3 py-2.5"
                    role="alert"
                    aria-live="polite"
            >
              <p class="text-[12px] text-red-600">{serverError}</p>
            </div>
          {/if}

          <Button
                  class="h-9 w-full !bg-[#e11d48] !text-white hover:!bg-[#be123c] disabled:!opacity-60"
                  disabled={loading}
                  onclick={handleSubmit}
          >
            {#if loading}
              <Loader2 size={14} class="animate-spin"/>
              <span>Masuk...</span>
            {:else}
              <span>Masuk</span>
            {/if}
          </Button>

        </div>
      </Card.Content>
    </Card.Root>

    <p class="mt-4 text-center text-[11px] text-gray-400">
      Hubungi administrator jika tidak dapat masuk
    </p>

  </div>
</div>
