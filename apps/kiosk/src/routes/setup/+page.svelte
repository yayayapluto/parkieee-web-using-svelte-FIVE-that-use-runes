<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { requestPairing } from '$lib/api/gates'
  import { setGateToken, setGateInfo } from '$lib/utils/auth'
  import { Loader, AlertCircle, RefreshCw, CheckCircle } from 'lucide-svelte'
  import type { PairingResponse } from '$lib/types/domain'
  import { PUBLIC_API_BASE_URL } from '$env/static/public'

  type Status = 'loading' | 'ready' | 'confirmed' | 'expired' | 'error'

  let status   = $state<Status>('loading')
  let errorMsg = $state('')
  let pairing  = $state<PairingResponse | null>(null)
  let qrDataUrl = $state('')
  let secondsLeft = $state(0)

  let countdownInterval: ReturnType<typeof setInterval> | null = null
  let sseSource: EventSource | null = null

  async function init() {
    status = 'loading'
    errorMsg = ''
    qrDataUrl = ''
    pairing = null
    cleanup()

    try {
      pairing = await requestPairing()
      await generateQR(pairing.qr_content)
      startCountdown()
      startSSE(pairing.code)
      status = 'ready'
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : 'Gagal memulai pairing.'
      status = 'error'
    }
  }

  async function generateQR(content: string) {
    const QRCode = (await import('qrcode')).default
    qrDataUrl = await QRCode.toDataURL(content, {
      width: 320,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' },
    })
  }

  function startCountdown() {
    if (!pairing) return
    const expiresAt = new Date(pairing.expires_at).getTime()
    function tick() {
      secondsLeft = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      if (secondsLeft === 0) {
        clearInterval(countdownInterval!)
        if (status === 'ready') status = 'expired'
      }
    }
    tick()
    countdownInterval = setInterval(tick, 1000)
  }

  function startSSE(code: string) {
    sseSource = new EventSource(`${PUBLIC_API_BASE_URL}/api/v1/gate/pairing/${code}/listen`)
    sseSource.addEventListener('confirmed', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      handleConfirmed(data.token)
    })
    sseSource.addEventListener('kicked', () => sseSource?.close())
    sseSource.onerror = () => sseSource?.close()
  }

  function handleConfirmed(gateJwt: string) {
    status = 'confirmed'
    cleanup()
    try {
      const [, payloadB64] = gateJwt.split('.')
      const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
      setGateToken(gateJwt)
      setGateInfo({
        id: payload.gate_id,
        name: payload.gate_name,
        gate_type: payload.gate_type,
        zone_id: payload.zone_id,
        zone_name: '',
      })
      setTimeout(() => { window.location.href = `/gate/${payload.gate_id}` }, 1500)
    } catch {
      errorMsg = 'Pairing berhasil tapi gagal membaca token. Coba ulangi.'
      status = 'error'
    }
  }

  function cleanup() {
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null }
    if (sseSource) { sseSource.close(); sseSource = null }
  }

  const minutesLeft  = $derived(Math.floor(secondsLeft / 60))
  const secsDisplay  = $derived(String(secondsLeft % 60).padStart(2, '0'))
  const expiringSoon = $derived(secondsLeft > 0 && secondsLeft <= 60)

  onMount(init)
  onDestroy(cleanup)
</script>

<div class="flex h-screen flex-col bg-white select-none">

  <!-- Header — sama dengan KioskHeader -->
  <div class="flex items-center border-b border-gray-300 shrink-0">
    <div class="bg-[#1a56db] px-5 py-3 flex items-center gap-2 shrink-0" style="background:#1a56db">
      <div class="w-3 h-3 rounded-full bg-white/80"></div>
      <span class="text-white text-sm font-bold tracking-[0.2em] uppercase">parkieee</span>
    </div>
    <div class="flex-1 text-center">
      <span class="text-gray-900 text-xl font-bold tracking-[0.15em] uppercase">SMK Taruna Bhakti</span>
    </div>
    <div class="px-5 py-3 shrink-0">
      <span class="text-gray-400 text-[13px]">Setup Device</span>
    </div>
  </div>

  <!-- Body -->
  <div class="flex flex-1 flex-col items-center justify-center gap-8 px-8">

    {#if status === 'loading'}
      <Loader size={40} strokeWidth={1.5} class="animate-spin text-[#1a56db]" />
      <div class="text-center space-y-1">
        <p class="text-lg font-semibold text-gray-800">Mempersiapkan QR Code...</p>
        <p class="text-sm text-gray-400">Mohon tunggu sebentar</p>
      </div>

    {:else if status === 'confirmed'}
      <div class="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle size={40} strokeWidth={1.5} class="text-green-600" />
      </div>
      <div class="text-center space-y-2">
        <p class="text-2xl font-bold text-gray-800">Terhubung!</p>
        <p class="text-base text-gray-500">Mengarahkan ke halaman gerbang...</p>
      </div>

    {:else if status === 'error'}
      <AlertCircle size={48} strokeWidth={1.25} class="text-red-500" />
      <div class="text-center space-y-2">
        <p class="text-xl font-semibold text-gray-800">Setup Gagal</p>
        <p class="text-base text-gray-500 max-w-sm text-center">{errorMsg}</p>
      </div>
      <button
        onclick={init}
        class="flex items-center gap-2 rounded-lg bg-red-500 border-4 border-red-900 px-8 py-3 text-base font-bold text-white tracking-widest uppercase active:scale-[0.97] transition-transform"
      >
        <RefreshCw size={16} />
        Coba Lagi
      </button>

    {:else if status === 'expired'}
      <AlertCircle size={48} strokeWidth={1.25} class="text-amber-500" />
      <div class="text-center space-y-2">
        <p class="text-xl font-semibold text-gray-800">QR Kadaluarsa</p>
        <p class="text-base text-gray-500">QR code sudah tidak valid.</p>
      </div>
      <button
        onclick={init}
        class="flex items-center gap-2 rounded-lg bg-[#1a56db] border-4 border-blue-900 px-8 py-3 text-base font-bold text-white tracking-widest uppercase active:scale-[0.97] transition-transform"
      >
        <RefreshCw size={16} />
        Generate QR Baru
      </button>

    {:else}
      <!-- QR Ready -->
      <div class="text-center space-y-1">
        <p class="text-2xl font-bold text-gray-800">Hubungkan Device Ini</p>
        <p class="text-base text-gray-500">Scan QR code berikut dari dashboard operator</p>
      </div>

      <!-- QR Code -->
      <div class="relative rounded-2xl border-2 border-gray-200 p-4 shadow-sm bg-white">
        {#if qrDataUrl}
          <img src={qrDataUrl} alt="QR Pairing" class="h-72 w-72 rounded-lg" />
        {:else}
          <div class="flex h-72 w-72 items-center justify-center">
            <Loader size={28} class="animate-spin text-gray-300" />
          </div>
        {/if}

        {#if status === 'expired'}
          <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90">
            <AlertCircle size={32} class="text-amber-500" />
            <p class="text-sm font-medium text-gray-600">QR Kadaluarsa</p>
          </div>
        {/if}
      </div>

      <!-- Kode teks -->
      <div class="flex flex-col items-center gap-1">
        <p class="font-mono text-3xl font-bold tracking-[0.4em] text-gray-800">
          {pairing?.code ?? '------'}
        </p>
        <p class="text-sm text-gray-400">Kode pairing</p>
      </div>

      <!-- Countdown -->
      <p class="text-sm {expiringSoon ? 'text-amber-500 font-medium' : 'text-gray-400'}">
        Berlaku {minutesLeft}:{secsDisplay}{expiringSoon ? ' — segera kadaluarsa' : ''}
      </p>

      <button
        onclick={init}
        class="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 tracking-widest uppercase"
      >
        <RefreshCw size={13} />
        Generate ulang
      </button>
    {/if}

  </div>

  <!-- Footer -->
  <div class="border-t border-gray-200 px-6 py-3 text-center shrink-0">
    <p class="text-xs text-gray-400">Hubungi administrator jika setup tidak berhasil</p>
  </div>

</div>
