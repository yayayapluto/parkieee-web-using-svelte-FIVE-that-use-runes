<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Transaction } from '$lib/types/domain'

  import { Loader2, QrCode, Banknote, CheckCircle2, Camera } from 'lucide-svelte'
  import KioskHeader     from '$lib/components/kiosk/KioskHeader.svelte'
  import KioskSubHeader  from '$lib/components/kiosk/KioskSubHeader.svelte'
  import KioskStatusBar  from '$lib/components/kiosk/KioskStatusBar.svelte'
  import ExitInfoPanel   from '$lib/components/kiosk/ExitInfoPanel.svelte'
  import ExitVehiclePanel from '$lib/components/kiosk/ExitVehiclePanel.svelte'
  import ExitActionRow   from '$lib/components/kiosk/ExitActionRow.svelte'
  import KioskModal      from '$lib/components/kiosk/KioskModal.svelte'
  import { formatCurrency } from '$lib/utils/format'
  import type { Payment } from '$lib/types/domain.d'

  type Step = 'idle' | 'loading' | 'success' | 'error'

  type PayModal = 'none' | 'select' | 'qris' | 'cash'

  let {
    rfidInput      = $bindable(''),
    step           = $bindable<Step>('idle'),
    errorMsg       = $bindable(''),
    tx             = null as Transaction | null,
    gateLabel      = 'GATE KELUAR',
    payModal       = 'none' as PayModal,
    qrisPayment    = null as Payment | null,
    qrisLoading    = false,
    qrisError      = '',
    cashCountdown        = 0,
    qrisExpireCountdown  = 0,
    onScanSubmit,
    onRFIDSubmit,
    onSelectQRIS,
    onSelectCash,
    onClosePayModal,
    onCancelPayModal,
  }: {
    rfidInput:       string
    step:            Step
    errorMsg:        string
    tx:              Transaction | null
    gateLabel:       string
    payModal:        PayModal
    qrisPayment:     Payment | null
    qrisLoading:     boolean
    qrisError:       string
    cashCountdown:      number
    qrisExpireCountdown: number
    onScanSubmit:    (code: string) => void
    onRFIDSubmit:    (uid: string) => void
    onSelectQRIS:    () => void
    onSelectCash:    () => void
    onClosePayModal: () => void
    onCancelPayModal: () => void
  } = $props()

  // ── RFID global keyboard capture ─────────────────────────────────────────
  // RFID reader mengirim karakter satu per satu lalu Enter — tidak perlu focus
  // pada elemen tertentu, cukup intercept di document level.
  let rfidBuffer = ''
  let rfidFlushTimer: ReturnType<typeof setTimeout> | null = null

  function handleGlobalKey(e: KeyboardEvent) {
    // Abaikan kalau user sedang ketik di input/textarea lain (bukan RFID)
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    if (e.key === 'Enter') {
      const uid = rfidBuffer.trim()
      rfidBuffer = ''
      if (rfidFlushTimer) { clearTimeout(rfidFlushTimer); rfidFlushTimer = null }
      if (uid && step !== 'loading' && payModal === 'none') {
        rfidInput = uid          // update bindable supaya UI bisa lihat
        onRFIDSubmit(uid)
        // Reset display setelah sebentar
        setTimeout(() => { rfidInput = '' }, 1500)
      }
      return
    }

    // Karakter printable — buffer
    if (e.key.length === 1) {
      rfidBuffer += e.key
      // Auto-flush kalau tidak ada Enter dalam 500ms (kartu error / partial)
      if (rfidFlushTimer) clearTimeout(rfidFlushTimer)
      rfidFlushTimer = setTimeout(() => {
        rfidBuffer = ''
        rfidFlushTimer = null
      }, 500)
    }
  }

  onMount(() => document.addEventListener('keydown', handleGlobalKey))
  onDestroy(() => document.removeEventListener('keydown', handleGlobalKey))

  let videoEl: HTMLVideoElement
  let canvasEl: HTMLCanvasElement
  let scanCooldown  = false
  let scanInterval: ReturnType<typeof setInterval> | null = null
  let showCamPreview  = $state(false)
  let worker:       Worker | null = null

  function buildWorkerBlob(): Worker {
    const src = `
      importScripts('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js');
      self.onmessage = function(e) {
        var d = e.data;
        var result = jsQR(d.data, d.width, d.height);
        self.postMessage(result ? result.data : null);
      };
    `
    const blob = new Blob([src], { type: 'application/javascript' })
    return new Worker(URL.createObjectURL(blob))
  }

  async function startCamera() {
    try {
      worker = buildWorkerBlob()
      worker.onmessage = (e: MessageEvent<string | null>) => {
        if (e.data && !scanCooldown) {
          scanCooldown = true
          onScanSubmit(e.data.trim())
          setTimeout(() => { scanCooldown = false }, 3000)
        }
      }
      worker.onerror = () => { cameraError = 'QR scanner gagal load' }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      videoEl.srcObject = stream
      await videoEl.play()
      scanInterval = setInterval(scanFrame, 250)
    } catch {
      cameraError = 'Kamera tidak dapat diakses'
    }
  }

  function scanFrame() {
    if (!worker || !canvasEl || scanCooldown || step === 'loading') return
    if (videoEl.readyState < videoEl.HAVE_ENOUGH_DATA) return
    const w = videoEl.videoWidth
    const h = videoEl.videoHeight
    if (!w || !h) return
    canvasEl.width  = w
    canvasEl.height = h
    const ctx = canvasEl.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(videoEl, 0, 0, w, h)
    const imageData = ctx.getImageData(0, 0, w, h)
    worker.postMessage({ data: imageData.data, width: w, height: h }, [imageData.data.buffer])
  }

  function stopCamera() {
    if (scanInterval) clearInterval(scanInterval)
    worker?.terminate()
    const stream = videoEl?.srcObject as MediaStream | null
    stream?.getTracks().forEach(t => t.stop())
  }

  onMount(() => startCamera())
  onDestroy(() => stopCamera())

  let clockStr  = $state('')
  let clockTimer: ReturnType<typeof setInterval>

  function updateClock() {
    clockStr = new Date().toLocaleString('id-ID', {
      weekday: 'short', day: '2-digit', month: 'short',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }
  onMount(() => { updateClock(); clockTimer = setInterval(updateClock, 1000) })
  onDestroy(() => clearInterval(clockTimer))

  const durationMinutes = $derived(
    tx?.entry_at ? Math.ceil((Date.now() - new Date(tx.entry_at).getTime()) / 60_000) : 0
  )
  const entryPlate = $derived(tx?.ocr?.find(o => o.photo_type === 'entry')?.actual_plate ?? null)
  const hasResult  = $derived(step === 'success' && tx !== null)

  function formatDT(iso: string) {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  function translateError(msg: string): string {
    if (!msg) return 'Terjadi kesalahan'
    const m = msg.toLowerCase()
    if (m.includes('not found') || m.includes('record not found'))  return 'Tiket tidak ditemukan'
    if (m.includes('not open'))                                      return 'Transaksi sudah selesai atau dibatalkan'
    if (m.includes('rfid card does not match'))                      return 'Kartu RFID tidak sesuai dengan kartu masuk'
    if (m.includes('rfid card not found'))                           return 'Kartu RFID tidak ditemukan'
    if (m.includes('rfid card is inactive'))                         return 'Kartu RFID tidak aktif'
    if (m.includes('gate is not an exit gate'))                      return 'Gate ini bukan gate keluar'
    if (m.includes('exit gate is inactive'))                         return 'Gate keluar tidak aktif'
    if (m.includes('does not belong to the same zone'))              return 'Gate keluar berbeda zona dengan gate masuk'
    if (m.includes('failed to record exit'))                         return 'Gagal memproses keluar, hubungi petugas'
    if (m.includes('network') || m.includes('fetch') || m.includes('timeout')) return 'Koneksi bermasalah, hubungi petugas'
    return msg
  }

  const subTitle = $derived(
    step === 'loading' ? 'Memproses — Mohon Tunggu' :
    step === 'error'   ? 'Terjadi Kesalahan' :
    hasResult          ? 'Transaksi Selesai — Silakan Keluar' :
                         'Arahkan QR Tiket ke Kamera atau Tempel Kartu'
  )
  const statusText = $derived(
    step === 'loading' ? 'MEMPROSES — MOHON TUNGGU' :
    step === 'error'   ? 'ERROR — HUBUNGI PETUGAS' :
    hasResult          ? 'TRANSAKSI SELESAI — SILAKAN KELUAR' :
                         'SCAN QR TIKET ATAU TEMPEL KARTU'
  )
  const cameraStatus      = $derived('● Kamera Aktif')
  const cameraStatusColor = $derived('#16a34a')
</script>

<!-- Video tersembunyi untuk QR scan — preview ditampilkan via objek yang sama -->
<video bind:this={videoEl} playsinline muted class="fixed opacity-0 pointer-events-none w-px h-px top-0 left-0"></video>
<canvas bind:this={canvasEl} class="fixed opacity-0 pointer-events-none w-px h-px top-0 left-0"></canvas>

<!-- Camera Preview -->
{#if showCamPreview}
  <div class="fixed z-50 bottom-20 right-4 w-80 h-60 border border-gray-300 bg-black rounded shadow-lg overflow-hidden">
    <video
      srcObject={videoEl?.srcObject ?? null}
      autoplay
      playsinline
      muted
      class="w-full h-full object-cover"
      style="transform: scaleX(-1)"
    ></video>
  </div>
{/if}

<!-- Toggle camera preview -->
<button
  onclick={() => showCamPreview = !showCamPreview}
  title="Toggle preview kamera"
  class="fixed z-50 bottom-8 right-4 w-9 h-9 flex items-center justify-center rounded-full shadow-lg cursor-pointer bg-gray-800 hover:bg-gray-900 text-gray-400 transition-colors"
>
  <Camera size={16} />
</button>

<!-- RFID dibaca via global keydown listener, tidak perlu hidden input -->

<div class="w-screen h-screen bg-white flex flex-col select-none overflow-hidden font-[family-name:var(--font-family-kiosk)]">

  <KioskHeader {clockStr} gateLabel={gateLabel} />
  <KioskSubHeader text={subTitle} />

  <div class="flex flex-1 border-b border-gray-200 min-h-0">
    <ExitInfoPanel
      {tx}
      {step}
      {errorMsg}
      {hasResult}
      {durationMinutes}
      {entryPlate}
      {translateError}
      {formatDT}
      showingPayModal={payModal !== 'none'}
    />
    <ExitVehiclePanel {tx} {hasResult} {entryPlate} />
  </div>

  <ExitActionRow {step} rfidInput={rfidInput} />

  <KioskStatusBar
    statusText={statusText}
    rightText={cameraStatus}
    rightColor={cameraStatusColor}
  />

</div>

<!-- Modal: Pilih Metode Pembayaran -->
<KioskModal
  show={payModal === 'select'}
  title="Pilih Metode Pembayaran"
  onClose={() => {}}
  footerLabel=""
>
  {#snippet children()}
    <div class="px-6 py-5 flex flex-col gap-4">
      <!-- Info fee -->
      {#if tx}
        <div class="bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
          <span class="text-xs tracking-[0.2em] uppercase text-gray-400">Total Tagihan</span>
          <span class="text-2xl font-black text-gray-900">{formatCurrency(tx.calculated_fee ?? 0)}</span>
        </div>
      {/if}

      {#if qrisError}
        <p class="text-red-500 text-sm text-center">{qrisError}</p>
      {/if}

      <!-- 2 tombol besar -->
      <div class="grid grid-cols-2 gap-3">
        <!-- QRIS -->
        <button
          onclick={onSelectQRIS}
          disabled={qrisLoading}
          class="flex flex-col items-center justify-center gap-3 py-8 border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if qrisLoading}
            <Loader2 size={48} class="animate-spin text-gray-900" />
          {:else}
            <QrCode size={48} class="text-gray-900" strokeWidth={1.5} />
          {/if}
          <span class="text-sm font-bold tracking-[0.2em] uppercase text-gray-900">QRIS</span>
        </button>

        <!-- Tunai -->
        <button
          onclick={onSelectCash}
          class="flex flex-col items-center justify-center gap-3 py-8 border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Banknote size={48} class="text-gray-900" strokeWidth={1.5} />
          <span class="text-sm font-bold tracking-[0.2em] uppercase text-gray-900">TUNAI</span>
        </button>
      </div>
    </div>
  {/snippet}
</KioskModal>

<!-- Modal: QRIS — tidak ada tombol manual, webhook yang trigger close -->
<KioskModal
  show={payModal === 'qris'}
  title="Bayar dengan QRIS"
  onClose={onCancelPayModal}
  footerLabel={qrisExpireCountdown > 0 ? `Batalkan (${qrisExpireCountdown}d)` : 'Batalkan'}
>
  {#snippet children()}
    <div class="px-6 py-5 flex flex-col items-center gap-4">
      {#if tx}
        <div class="w-full bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
          <span class="text-xs tracking-[0.2em] uppercase text-gray-400">Total Tagihan</span>
          <span class="text-2xl font-black text-gray-900">{formatCurrency(tx.calculated_fee ?? 0)}</span>
        </div>
      {/if}
      {#if qrisPayment?.qris_image_url}
        <img
          src={qrisPayment.qris_image_url}
          alt="QR Code Pembayaran"
          class="w-56 h-56 object-contain border border-gray-200 p-1"
        />
      {:else}
        <div class="w-56 h-56 bg-gray-100 flex items-center justify-center">
          <Loader2 size={32} class="animate-spin text-gray-400" />
        </div>
      {/if}
      <div class="flex flex-col items-center gap-1">
        <p class="text-xs text-gray-400 tracking-[0.1em] text-center uppercase">Scan dengan aplikasi dompet digital</p>
        <div class="flex items-center gap-1.5">
          <Loader2 size={10} class="animate-spin text-gray-300" />
          <span class="text-[10px] text-gray-300 tracking-wider">Menunggu konfirmasi pembayaran...</span>
        </div>
      </div>
    </div>
  {/snippet}
</KioskModal>

<!-- Modal: Tunai — operator yang proses -->
<KioskModal
  show={payModal === 'cash'}
  title="Pembayaran Tunai"
  onClose={() => {}}
  footerLabel=""
>
  {#snippet children()}
    <div class="px-6 py-8 flex flex-col items-center gap-5">
      {#if tx}
        <div class="w-full bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
          <span class="text-xs tracking-[0.2em] uppercase text-gray-400">Total Tagihan</span>
          <span class="text-2xl font-black text-gray-900">{formatCurrency(tx.calculated_fee ?? 0)}</span>
        </div>
      {/if}
      <Loader2 size={64} class="animate-spin text-gray-400" strokeWidth={1.5} />
      <div class="text-center">
        <p class="text-lg font-bold text-gray-800 tracking-[0.1em]">MENUNGGU KONFIRMASI KASIR</p>
        <p class="text-sm text-gray-400 mt-1">Petugas sedang memproses pembayaran tunai Anda</p>
      </div>
    </div>
  {/snippet}
</KioskModal>
