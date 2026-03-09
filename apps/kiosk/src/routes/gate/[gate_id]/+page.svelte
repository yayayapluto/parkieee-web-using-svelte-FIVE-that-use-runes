<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { page } from '$app/stores'
  import { getGateInfo } from '$lib/utils/auth'
  import { recordEntry, getTransactionByCode, getTransactionByRFID, recordExit } from '$lib/api/transactions'
  import { initiateQRIS, pollPaymentStatus } from '$lib/api/payments'
  import { getKioskTariff } from '$lib/api/fees'
  import EntryGate from '$lib/components/EntryGate.svelte'
  import ExitGate  from '$lib/components/ExitGate.svelte'
  import type { VehicleTypeTariff } from '$lib/api/fees'
  import type { Transaction } from '$lib/types/domain'

  const gateId  = $page.params.gate_id
  const gate    = getGateInfo()
  const isEntry = gate?.gate_type === 'entry'

  let idleTimer: ReturnType<typeof setTimeout> | null = null
  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => window.location.reload(), 60_000)
  }
  onMount(() => resetIdleTimer())
  onDestroy(() => { if (idleTimer) clearTimeout(idleTimer) })

  // ── Entry state ──

  type EntryStep = 'idle' | 'loading' | 'error'
  let entryStep  = $state<EntryStep>('idle')
  let entryError = $state('')
  let rfidInput  = $state('')
  let tariffs    = $state<VehicleTypeTariff[]>([])

  let showModal      = $state(false)
  let ticketCode     = $state('')
  let ticketImg      = $state('')
  let ticketPlate    = $state<string | null>(null)
  let ticketMethod   = $state<'qr' | 'rfid'>('qr')
  let modalCountdown = $state(15)
  let modalTimer: ReturnType<typeof setInterval> | null = null

  function openTicketModal(code: string, img: string, plate: string | null, method: 'qr' | 'rfid') {
    ticketCode = code; ticketImg = img; ticketPlate = plate; ticketMethod = method
    showModal = true; modalCountdown = 15
    if (modalTimer) clearInterval(modalTimer)
    modalTimer = setInterval(() => {
      modalCountdown -= 1
      if (modalCountdown <= 0) closeTicketModal()
    }, 1000)
  }

  function closeTicketModal() {
    if (modalTimer) clearInterval(modalTimer)
    showModal = false
    resetIdleTimer()
    setTimeout(() => { ticketCode = ''; ticketImg = ''; ticketPlate = null }, 5000)
  }

  onMount(async () => {
    if (!isEntry) return
    try {
      const all = await getKioskTariff()
      tariffs = all.filter(t => t.fee_config !== null)
    } catch { /* lanjut tanpa tarif */ }
  })

  async function doCetakTiket() {
    if (!gate || entryStep === 'loading') return
    entryStep = 'loading'; resetIdleTimer()
    try {
      const form = new FormData()
      form.append('entry_gate_id', gate.id)
      form.append('entry_method', 'qr')
      const tx = await recordEntry(form)
      entryStep = 'idle'
      const plate = tx.ocr?.find(o => o.photo_type === 'entry')?.ocr_detected_plate ?? null
      openTicketModal(tx.transaction_code, tx.entry_qr_code_image ?? '', plate, 'qr')
    } catch (err) {
      entryError = err instanceof Error ? err.message : 'Gagal mencetak tiket'
      entryStep = 'error'; resetIdleTimer()
      setTimeout(() => { if (entryStep === 'error') { entryError = ''; rfidInput = ''; entryStep = 'idle' } }, 5000)
    }
  }

  async function doRFIDEntry(uid: string) {
    if (!gate || entryStep === 'loading') return
    entryStep = 'loading'; resetIdleTimer()
    try {
      const form = new FormData()
      form.append('entry_gate_id', gate.id)
      form.append('entry_method', 'rfid')
      form.append('rfid_card_uid', uid)
      const tx = await recordEntry(form)
      rfidInput = ''; entryStep = 'idle'
      ticketPlate = tx.ocr?.find(o => o.photo_type === 'entry')?.ocr_detected_plate ?? null
      ticketMethod = 'rfid'; ticketCode = tx.transaction_code
      resetIdleTimer()
      setTimeout(() => { ticketCode = ''; ticketPlate = null }, 5000)
    } catch (err) {
      entryError = err instanceof Error ? err.message : 'Kartu tidak dapat dibaca'
      rfidInput = ''; entryStep = 'error'; resetIdleTimer()
      setTimeout(() => { if (entryStep === 'error') { entryError = ''; entryStep = 'idle' } }, 5000)
    }
  }

  function retryEntry() {
    entryError = ''; rfidInput = ''; entryStep = 'idle'; resetIdleTimer()
  }

  // ── Exit state ──

  type ExitStep = 'idle' | 'loading' | 'success' | 'error'
  let exitStep  = $state<ExitStep>('idle')
  let exitError = $state('')
  let exitRFID  = $state('')
  let tx        = $state<Transaction | null>(null)

  type PayModal = 'none' | 'select' | 'qris' | 'cash'
  let payModal             = $state<PayModal>('none')
  let qrisPayment          = $state<import('$lib/types/domain').Payment | null>(null)
  let qrisLoading          = $state(false)
  let qrisError            = $state('')
  let cashCountdown        = $state(0)
  let qrisExpireCountdown  = $state(0)

  let cashTimer:       ReturnType<typeof setInterval> | null = null
  let qrisPollTimer:   ReturnType<typeof setInterval> | null = null
  let qrisExpireTimer: ReturnType<typeof setInterval> | null = null

  async function processExit(code: string, method: 'qr' | 'rfid') {
    if (!gate || exitStep === 'loading') return
    exitStep = 'loading'; resetIdleTimer()
    try {
      let updatedTx: Transaction

      if (method === 'rfid') {
        const found = await getTransactionByRFID(code)
        if (found.status === 'awaiting_payment') {
          updatedTx = found
        } else {
          const form = new FormData()
          form.append('exit_gate_id', gate.id)
          form.append('exit_method', 'rfid')
          form.append('rfid_card_uid', code)
          updatedTx = await recordExit(found.id, form)
        }
      } else {
        const found = await getTransactionByCode(code)
        if (found.status === 'awaiting_payment') {
          updatedTx = found
        } else {
          const exitForm = new FormData()
          exitForm.append('exit_gate_id', gate.id)
          exitForm.append('exit_method', 'qr')
          updatedTx = await recordExit(found.id, exitForm)
        }
      }

      tx = updatedTx
      if (!updatedTx.calculated_fee || updatedTx.calculated_fee === 0) {
        exitStep = 'success'; resetIdleTimer()
        setTimeout(() => { exitStep = 'idle'; tx = null }, 5000)
      } else {
        exitStep = 'idle'; payModal = 'select'
      }
    } catch (err) {
      exitError = err instanceof Error ? err.message : 'Gagal memproses keluar'
      exitRFID = ''; exitStep = 'error'; resetIdleTimer()
      setTimeout(() => { if (exitStep === 'error') { exitError = ''; exitStep = 'idle' } }, 5000)
    }
  }

  async function doStartQRIS() {
    if (!tx || qrisLoading) return
    qrisLoading = true; qrisError = ''
    try {
      qrisPayment = await initiateQRIS(tx.id)
      payModal = 'qris'
      startQRISPolling()
      startQRISExpireCountdown()
    } catch (err) {
      qrisError = err instanceof Error ? err.message : 'Gagal membuat QRIS'
    } finally {
      qrisLoading = false
    }
  }

  function startQRISPolling() {
    if (qrisPollTimer) clearInterval(qrisPollTimer)
    let consecutiveErrors = 0
    qrisPollTimer = setInterval(async () => {
      if (!qrisPayment) return
      try {
        const updated = await pollPaymentStatus(qrisPayment.id)
        consecutiveErrors = 0
        qrisPayment = updated
        if (updated.status === 'completed') {
          stopQRISTimers()
          payModal = 'none'; exitStep = 'success'; tx = null
          resetIdleTimer()
          setTimeout(() => { exitStep = 'idle' }, 5000)
        }
      } catch {
        consecutiveErrors += 1
        // Setelah 5 kali gagal berturut-turut (~15 detik), tampilkan error ke user
        if (consecutiveErrors >= 5) {
          stopQRISTimers()
          qrisError = 'Koneksi bermasalah. Silakan coba lagi atau hubungi petugas.'
          payModal = 'select'
        }
      }
    }, 3000)
  }

  function startQRISExpireCountdown() {
    if (!qrisPayment?.qris_expires_at) return
    if (qrisExpireTimer) clearInterval(qrisExpireTimer)
    function tick() {
      const secs = Math.max(0, Math.floor((new Date(qrisPayment!.qris_expires_at!).getTime() - Date.now()) / 1000))
      qrisExpireCountdown = secs
      if (secs <= 0) {
        stopQRISTimers()
        qrisPayment = null
        qrisError = 'QRIS expired, silakan coba lagi'
        payModal = 'select'
      }
    }
    tick()
    qrisExpireTimer = setInterval(tick, 1000)
  }

  function stopQRISTimers() {
    if (qrisPollTimer)   { clearInterval(qrisPollTimer);   qrisPollTimer = null }
    if (qrisExpireTimer) { clearInterval(qrisExpireTimer); qrisExpireTimer = null }
  }

  function doSelectCash() {
    payModal = 'cash'; cashCountdown = 60
    if (cashTimer) clearInterval(cashTimer)
    cashTimer = setInterval(() => {
      cashCountdown -= 1
      if (cashCountdown <= 0) closePayModal()
    }, 1000)
  }

  function closePayModal() {
    if (cashTimer) clearInterval(cashTimer)
    stopQRISTimers()
    payModal = 'none'; qrisPayment = null; qrisError = ''
    // Transaksi exit sudah direcord — kasir proses manual, anggap sukses di sisi kiosk
    exitStep = 'success'; tx = null
    resetIdleTimer()
    setTimeout(() => { exitStep = 'idle' }, 5000)
  }

  function doExitScan(rawCode: string) {
    const code = rawCode.replace(/^PARKIEEE-/i, '')
    processExit(code, 'qr')
  }

  function doExitRFID(uid: string) {
    exitRFID = ''
    processExit(uid, 'rfid')
  }

  const gateLabel = $derived(
    gate ? `${gate.zone_name ?? ''} > ${gate.name ?? ''}`.toUpperCase() : 'GATE'
  )
</script>

<svelte:window onkeydown={() => resetIdleTimer()} />

{#if isEntry}
  <EntryGate
    {tariffs}
    bind:rfidInput
    bind:step={entryStep}
    bind:errorMsg={entryError}
    {showModal}
    {ticketCode}
    {ticketImg}
    {ticketPlate}
    {ticketMethod}
    {modalCountdown}
    onCetakTiket={doCetakTiket}
    onRFIDSubmit={doRFIDEntry}
    onRetry={retryEntry}
    onCloseModal={closeTicketModal}
  />
{:else}
  <ExitGate
    bind:rfidInput={exitRFID}
    bind:step={exitStep}
    bind:errorMsg={exitError}
    {tx}
    {gateLabel}
    {payModal}
    {qrisPayment}
    {qrisLoading}
    {qrisError}
    {cashCountdown}
    {qrisExpireCountdown}
    onScanSubmit={doExitScan}
    onRFIDSubmit={doExitRFID}
    onSelectQRIS={doStartQRIS}
    onSelectCash={doSelectCash}
    onClosePayModal={closePayModal}
  />
{/if}
