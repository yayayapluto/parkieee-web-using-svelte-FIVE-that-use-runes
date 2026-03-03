<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { getGateInfo } from '$lib/utils/auth'
  import { ScanLine, CreditCard, Car, Wifi, WifiOff } from 'lucide-svelte'

  const gateId = $page.params.gate_id
  const gate   = getGateInfo()

  let time   = $state(new Date())
  let online = $state(navigator.onLine)

  onMount(() => {
    const clockTimer = setInterval(() => time = new Date(), 1000)
    const handleOnline  = () => online = true
    const handleOffline = () => online = false
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      clearInterval(clockTimer)
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  })

  const timeStr = $derived(
    time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  )
  const dateStr = $derived(
    time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  )
</script>

<div class="flex h-screen flex-col bg-slate-950 text-white select-none">
  <div class="flex items-center justify-between px-8 py-4">
    <div>
      <p class="text-xs font-medium uppercase tracking-widest text-slate-500">
        {gate?.zone_name ?? '—'}
      </p>
      <p class="text-sm font-semibold text-slate-300">{gate?.name ?? '—'}</p>
    </div>
    <div class="flex items-center gap-3">
      {#if online}
        <Wifi size={16} class="text-emerald-400" />
      {:else}
        <WifiOff size={16} class="text-red-400" />
      {/if}
      <div class="text-right">
        <p class="font-mono text-lg font-semibold tabular-nums">{timeStr}</p>
        <p class="text-xs text-slate-500">{dateStr}</p>
      </div>
    </div>
  </div>

  <div class="flex flex-1 flex-col items-center justify-center gap-8 px-8">
    {#if gate?.gate_type === 'entry'}
      <p class="text-2xl font-light text-slate-300">Selamat datang</p>
      <p class="text-sm text-slate-500">Pilih metode masuk</p>

      <div class="flex gap-6">
        <button
          onclick={() => goto(`/kiosk/${gateId}/entry`)}
          class="flex h-44 w-44 flex-col items-center justify-center gap-4 rounded-xl
            border-2 border-slate-700 bg-slate-900 text-slate-400 transition-all
            hover:border-brand-500 hover:bg-slate-800 hover:text-white active:scale-95"
        >
          <ScanLine size={48} strokeWidth={1.25} />
          <span class="text-sm font-semibold">Scan QR</span>
        </button>

        <button
          onclick={() => goto(`/kiosk/${gateId}/entry`)}
          class="flex h-44 w-44 flex-col items-center justify-center gap-4 rounded-xl
            border-2 border-slate-700 bg-slate-900 text-slate-400 transition-all
            hover:border-brand-500 hover:bg-slate-800 hover:text-white active:scale-95"
        >
          <CreditCard size={48} strokeWidth={1.25} />
          <span class="text-sm font-semibold">Tap RFID</span>
        </button>
      </div>
    {:else}
      <Car size={56} strokeWidth={1} class="text-slate-700" />
      <p class="text-2xl font-light text-slate-300">Silakan proses keluar</p>
      <p class="text-sm text-slate-500">Tap kartu RFID atau masukkan kode tiket</p>

      <button
        onclick={() => goto(`/kiosk/${gateId}/exit`)}
        class="flex h-44 w-64 flex-col items-center justify-center gap-4 rounded-xl
          border-2 border-slate-700 bg-slate-900 text-slate-400 transition-all
          hover:border-brand-500 hover:bg-slate-800 hover:text-white active:scale-95"
      >
        <Car size={48} strokeWidth={1.25} />
        <span class="text-sm font-semibold">Mulai Proses Keluar</span>
      </button>
    {/if}
  </div>

  <div class="px-8 py-4 text-center">
    <p class="text-xs text-slate-700">
      {gate?.gate_type === 'entry' ? 'Gerbang Masuk' : 'Gerbang Keluar'}
    </p>
  </div>
</div>
