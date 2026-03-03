<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { CheckCircle } from 'lucide-svelte'

  const gateId = $page.params.gate_id
  const type   = $page.url.searchParams.get('type') ?? 'entry'
  const code   = $page.url.searchParams.get('code') ?? ''

  let countdown = $state(7)
  let timer: ReturnType<typeof setInterval> | null = null

  onMount(() => {
    timer = setInterval(() => {
      countdown -= 1
      if (countdown <= 0) goto(`/kiosk/${gateId}`, { replaceState: true })
    }, 1_000)
  })

  onDestroy(() => { if (timer) clearInterval(timer) })
</script>

<div class="flex h-screen flex-col items-center justify-center gap-8 bg-slate-950 text-white select-none">
  <CheckCircle size={72} strokeWidth={1} class="text-emerald-400" />

  <div class="text-center space-y-2">
    <p class="text-3xl font-light text-white">
      {type === 'entry' ? 'Selamat Datang!' : 'Terima Kasih!'}
    </p>
    <p class="text-sm text-slate-400">
      {type === 'entry'
        ? 'Kendaraan berhasil tercatat masuk.'
        : 'Pembayaran berhasil. Selamat jalan.'}
    </p>
    {#if code}
      <p class="font-mono text-xs text-slate-600 pt-2">Kode: {code}</p>
    {/if}
  </div>

  <p class="text-xs text-slate-600">Kembali ke layar utama dalam {countdown} detik...</p>
</div>
