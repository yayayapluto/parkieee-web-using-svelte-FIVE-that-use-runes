<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { formatCurrency } from '$lib/utils/format'
  import type { VehicleTypeTariff } from '$lib/api/fees'

  import KioskHeader      from '$lib/components/kiosk/KioskHeader.svelte'
  import KioskSubHeader   from '$lib/components/kiosk/KioskSubHeader.svelte'
  import KioskStatusBar   from '$lib/components/kiosk/KioskStatusBar.svelte'
  import EntryTariffPanel from '$lib/components/kiosk/EntryTariffPanel.svelte'
  import EntryStatusPanel from '$lib/components/kiosk/EntryStatusPanel.svelte'
  import EntryActionRow   from '$lib/components/kiosk/EntryActionRow.svelte'
  import TicketModal      from '$lib/components/kiosk/TicketModal.svelte'

  type Step = 'idle' | 'loading' | 'error'

  let {
    tariffs        = [],
    rfidInput      = $bindable(''),
    step           = $bindable<Step>('idle'),
    errorMsg       = $bindable(''),
    showModal      = false,
    ticketCode     = '',
    ticketImg      = '',
    ticketPlate    = null,
    ticketMethod   = 'qr' as 'qr' | 'rfid',
    modalCountdown = 15,
    onCetakTiket,
    onRFIDSubmit,
    onRetry,
    onCloseModal,
  }: {
    tariffs:        VehicleTypeTariff[]
    rfidInput:      string
    step:           Step
    errorMsg:       string
    showModal:      boolean
    ticketCode:     string
    ticketImg:      string
    ticketPlate:    string | null
    ticketMethod:   'qr' | 'rfid'
    modalCountdown: number
    onCetakTiket:   () => void
    onRFIDSubmit:   (uid: string) => void
    onRetry:        () => void
    onCloseModal:   () => void
  } = $props()

  // ── RFID global keyboard capture ─────────────────────────────────────────
  let rfidBuffer = ''
  let rfidFlushTimer: ReturnType<typeof setTimeout> | null = null

  function handleGlobalKey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    if (e.key === 'Enter') {
      const uid = rfidBuffer.trim()
      rfidBuffer = ''
      if (rfidFlushTimer) { clearTimeout(rfidFlushTimer); rfidFlushTimer = null }
      if (uid && step !== 'loading' && !showModal) {
        rfidInput = uid
        onRFIDSubmit(uid)
        setTimeout(() => { rfidInput = '' }, 1500)
      }
      return
    }

    if (e.key.length === 1) {
      rfidBuffer += e.key
      if (rfidFlushTimer) clearTimeout(rfidFlushTimer)
      rfidFlushTimer = setTimeout(() => {
        rfidBuffer = ''
        rfidFlushTimer = null
      }, 500)
    }
  }

  onMount(() => document.addEventListener('keydown', handleGlobalKey))
  onDestroy(() => document.removeEventListener('keydown', handleGlobalKey))

  let tarifIdx     = $state(0)
  let tarifVisible = $state(true)
  let tarifTimer:  ReturnType<typeof setInterval>

  onMount(() => {
    tarifTimer = setInterval(() => {
      if (tariffs.length <= 1) return
      tarifVisible = false
      setTimeout(() => {
        tarifIdx = (tarifIdx + 1) % tariffs.length
        tarifVisible = true
      }, 200)
    }, 5000)
  })
  onDestroy(() => clearInterval(tarifTimer))

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

  function translateError(msg: string): string {
    if (!msg) return 'Terjadi kesalahan'
    const m = msg.toLowerCase()
    if (m.includes('rfid card already has an open transaction')) return 'Kartu RFID sudah memiliki transaksi aktif'
    if (m.includes('rfid card is inactive'))         return 'Kartu RFID tidak aktif'
    if (m.includes('rfid card not found'))           return 'Kartu RFID tidak ditemukan'
    if (m.includes('rfid_card_uid is required'))     return 'UID kartu RFID tidak terbaca'
    if (m.includes('rfid card does not match'))      return 'Kartu RFID tidak sesuai dengan kartu masuk'
    if (m.includes('full capacity'))                 return 'Area parkir penuh'
    if (m.includes('zone is inactive'))              return 'Area parkir tidak aktif'
    if (m.includes('gate is not an entry gate'))     return 'Gate ini bukan gate masuk'
    if (m.includes('entry gate is inactive'))        return 'Gate masuk tidak aktif'
    if (m.includes('failed to record entry'))        return 'Gagal merekam data masuk, coba lagi'
    if (m.includes('failed to calculate fee'))       return 'Gagal menghitung tarif'
    if (m.includes('network') || m.includes('fetch') || m.includes('timeout')) return 'Koneksi bermasalah, hubungi petugas'
    return msg
  }

  type PanelState = 'idle' | 'success'
  const panelState = $derived<PanelState>((showModal || ticketCode !== '') ? 'success' : 'idle')

  const subTitle = $derived(
    step === 'loading' ? 'Memproses — Mohon Tunggu' :
    step === 'error'   ? 'Terjadi Kesalahan' :
    showModal          ? 'Tiket Berhasil Dicetak' :
    ticketCode !== ''  ? 'Tiket Berhasil — Silakan Masuk' :
                         'Ambil Tiket atau Tempel Kartu'
  )
  const statusText = $derived(
    step === 'loading' ? 'PROSES VALIDASI — MOHON TUNGGU' :
    step === 'error'   ? 'ERROR — HUBUNGI PETUGAS' :
    showModal          ? 'TIKET DICETAK — AMBIL TIKET ANDA' :
    ticketCode !== ''  ? 'TIKET DICETAK — SILAKAN MASUK' :
                         'AMBIL TIKET ATAU TEMPEL KARTU'
  )
</script>

<!-- RFID dibaca via global keydown listener, tidak perlu hidden input -->

<div class="w-screen h-screen bg-white flex flex-col select-none overflow-hidden font-[family-name:var(--font-family-kiosk)]">

  <KioskHeader {clockStr} gateLabel="GATE MASUK" />
  <KioskSubHeader text={subTitle} />

  <div class="flex flex-1 border-b border-gray-200 min-h-0">
    <EntryTariffPanel {tariffs} {tarifIdx} {tarifVisible} />
    <EntryStatusPanel
      {step}
      {errorMsg}
      {panelState}
      {ticketCode}
      {ticketPlate}
      {ticketMethod}
      {translateError}
    />
  </div>

  <EntryActionRow {step} {rfidInput} onCetakTiket={onCetakTiket} />

  <KioskStatusBar
    statusText={statusText}
    rightText="● System Online"
    rightColor="#16a34a"
  />

</div>

<TicketModal
  {showModal}
  {ticketImg}
  {ticketCode}
  {modalCountdown}
  onCloseModal={onCloseModal}
/>
