<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { CheckCircle } from 'lucide-svelte'

  const gateId = $page.params.gate_id
  const type   = $page.url.searchParams.get('type') ?? 'entry'
  const code   = $page.url.searchParams.get('code') ?? ''
  const img    = $page.url.searchParams.get('img') ?? ''

  let countdown = $state(15)
  let timer: ReturnType<typeof setInterval> | null = null

  onMount(() => {
    timer = setInterval(() => {
      countdown -= 1
      if (countdown <= 0) goto(`/kiosk/${gateId}`, { replaceState: true })
    }, 1_000)
  })

  onDestroy(() => { if (timer) clearInterval(timer) })
</script>

<div class="flex h-screen flex-col bg-white text-slate-900 select-none">

  <!-- Header -->
  <div class="border-b border-slate-200 px-8 py-3">
    <p class="text-sm font-semibold text-slate-700">
      {type === 'entry' ? 'Gerbang Masuk' : 'Gerbang Keluar'}
    </p>
  </div>

  <!-- Main -->
  <div class="flex flex-1 flex-col items-center justify-center gap-6 px-8">
    <CheckCircle size={56} strokeWidth={1.25} class="text-emerald-500" />

    <div class="text-center space-y-1">
      <p class="text-2xl font-light text-slate-800">
        {type === 'entry' ? 'Selamat Datang!' : 'Terima Kasih!'}
      </p>
      <p class="text-sm text-slate-400">
        {type === 'entry'
          ? 'Kendaraan berhasil tercatat masuk.'
          : 'Pembayaran berhasil. Selamat jalan.'}
      </p>
    </div>

    {#if img}
      <div class="flex flex-col items-center gap-2">
        <img
          src={img}
          alt="QR Tiket"
          class="h-48 w-48 rounded border border-slate-200 bg-white p-2 shadow-sm"
        />
        <p class="text-xs text-slate-400">Simpan atau foto tiket ini untuk keluar</p>
      </div>
    {/if}

    {#if code}
      <div class="rounded border border-slate-200 bg-slate-50 px-8 py-4 text-center">
        <p class="text-xs text-slate-400 mb-1">Kode Tiket</p>
        <p class="font-mono text-xl font-bold tracking-widest text-slate-800">{code}</p>
      </div>
    {/if}
  </div>

  <!-- Footer countdown -->
  <div class="border-t border-slate-200 bg-slate-50 px-8 py-3">
    <p class="text-center text-xs text-slate-400">
      Kembali ke layar utama dalam {countdown} detik...
    </p>
  </div>

</div>
