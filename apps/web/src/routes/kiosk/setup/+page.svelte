<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { authenticateGate } from '$lib/api/gates'
  import { setGateToken, setGateInfo } from '$lib/utils/auth'

  let status = $state<'loading' | 'error'>('loading')
  let errorMsg = $state('')

  onMount(async () => {
    const token = $page.url.searchParams.get('token')
    if (!token) {
      errorMsg = 'Parameter token tidak ditemukan di URL.'
      status = 'error'
      return
    }

    try {
      const res = await authenticateGate(token)
      setGateToken(res.token)
      setGateInfo(res.gate)
      goto(`/kiosk/${res.gate.id}`, { replaceState: true })
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Autentikasi gagal.'
      status = 'error'
    }
  })
</script>

<div class="flex h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
  {#if status === 'loading'}
    <div class="h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-white"></div>
    <p class="text-sm text-slate-400">Menghubungkan ke gerbang...</p>
  {:else}
    <p class="text-4xl">⚠️</p>
    <p class="text-base font-semibold">Setup Gagal</p>
    <p class="text-sm text-slate-400">{errorMsg}</p>
    <p class="mt-4 text-xs text-slate-600">Pastikan URL mengandung parameter <code class="text-slate-400">?token=...</code></p>
  {/if}
</div>
