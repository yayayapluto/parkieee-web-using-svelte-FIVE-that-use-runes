<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { authenticateGate } from '$lib/api/gates'
  import { setGateToken, setGateInfo } from '$lib/utils/auth'
  import { Loader, AlertCircle } from 'lucide-svelte'

  let status   = $state<'loading' | 'error'>('loading')
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
      window.location.href = `/kiosk/${res.gate.id}`
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Autentikasi gagal.'
      status = 'error'
    }
  })
</script>

<div class="flex h-screen flex-col items-center justify-center gap-5 bg-white text-slate-800 select-none">

  {#if status === 'loading'}
    <Loader size={32} strokeWidth={1.5} class="animate-spin text-brand-500" />
    <div class="text-center space-y-1">
      <p class="text-sm font-semibold text-slate-700">Menghubungkan ke gerbang...</p>
      <p class="text-xs text-slate-400">Mohon tunggu sebentar</p>
    </div>
  {:else}
    <AlertCircle size={40} strokeWidth={1.25} class="text-red-500" />
    <div class="text-center space-y-1">
      <p class="text-base font-semibold text-slate-800">Setup Gagal</p>
      <p class="text-sm text-slate-500">{errorMsg}</p>
    </div>
    <p class="text-xs text-slate-400 text-center max-w-xs">
      Pastikan URL mengandung parameter <span class="font-mono text-slate-600">?token=...</span>
    </p>
  {/if}

</div>
