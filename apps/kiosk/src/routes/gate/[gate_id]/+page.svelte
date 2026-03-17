<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { getGateInfo } from '$lib/utils/auth'
  import { recordEntry, getTransactionByCode, getTransactionByRFID, recordExit, getTransaction } from '$lib/api/transactions'
  import { initiateQRIS, pollPaymentStatus, notifyCashier, pollKioskCashier } from '$lib/api/payments'
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
    // idle timer dinonaktifkan — kiosk tidak pernah auto reload
  }
  onMount(() => {
    restoreFromURL()
  })
  onDestroy(() => {
    stopKioskPoll()
  })

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
  let kioskPollTimer:  ReturnType<typeof setInterval> | null = null

  async function processExit(code: string, method: 'qr' | 'rfid') {
    if (!gate || exitStep === 'loading') return
    exitStep = 'loading'; resetIdleTimer()
    console.log(`[EXIT] processExit start | method=${method} code=${code} gate=${gate.id}`)
    try {
      let updatedTx: Transaction

      if (method === 'rfid') {
        console.log(`[EXIT] lookup tx by RFID uid=${code}`)
        const found = await getTransactionByRFID(code)
        console.log(`[EXIT] found tx id=${found.id} status=${found.status} fee=${found.calculated_fee}`)
        if (found.status === 'awaiting_payment') {
          console.log('[EXIT] status awaiting_payment — skip recordExit, lanjut ke payModal')
          updatedTx = found
        } else {
          console.log('[EXIT] recordExit via RFID')
          const form = new FormData()
          form.append('exit_gate_id', gate.id)
          form.append('exit_method', 'rfid')
          form.append('rfid_card_uid', code)
          updatedTx = await recordExit(found.id, form)
          console.log(`[EXIT] recordExit done status=${updatedTx.status} fee=${updatedTx.calculated_fee}`)
        }
      } else {
        console.log(`[EXIT] lookup tx by QR code=${code}`)
        const found = await getTransactionByCode(code)
        console.log(`[EXIT] found tx id=${found.id} status=${found.status} fee=${found.calculated_fee}`)
        if (found.status === 'awaiting_payment') {
          console.log('[EXIT] status awaiting_payment — skip recordExit, lanjut ke payModal')
          updatedTx = found
        } else {
          console.log('[EXIT] recordExit via QR')
          const exitForm = new FormData()
          exitForm.append('exit_gate_id', gate.id)
          exitForm.append('exit_method', 'qr')
          updatedTx = await recordExit(found.id, exitForm)
          console.log(`[EXIT] recordExit done status=${updatedTx.status} fee=${updatedTx.calculated_fee}`)
        }
      }

      tx = updatedTx
      if (!updatedTx.calculated_fee || updatedTx.calculated_fee === 0) {
        console.log('[EXIT] fee=0 → langsung success')
        exitStep = 'success'; resetIdleTimer()
        setTimeout(() => { exitStep = 'idle'; tx = null }, 5000)
      } else {
        console.log(`[EXIT] fee=${updatedTx.calculated_fee} → buka payModal`)
        exitStep = 'idle'; payModal = 'select'
        pushPayState('select', updatedTx.id)
      }
    } catch (err) {
      console.error('[EXIT] processExit error:', err)
      exitError = err instanceof Error ? err.message : 'Gagal memproses keluar'
      exitRFID = ''; exitStep = 'error'; resetIdleTimer()
      setTimeout(() => { if (exitStep === 'error') { exitError = ''; exitStep = 'idle' } }, 5000)
    }
  }

  async function doStartQRIS() {
    if (!tx || qrisLoading) return
    qrisLoading = true; qrisError = ''
    console.log(`[PAYMENT] doStartQRIS tx=${tx.id} fee=${tx.calculated_fee}`)
    try {
      qrisPayment = await initiateQRIS(tx.id)
      console.log(`[PAYMENT] QRIS initiated payment_id=${qrisPayment.id} expires=${qrisPayment.qris_expires_at}`)
      payModal = 'qris'
      pushPayState('qris', tx.id)
      startQRISPolling()
      startQRISExpireCountdown()
      // Stamp cashier_requested_at supaya kasir polling detect tx ini
      try {
        await notifyCashier({
          type: 'qris_fail', // pakai qris_fail supaya kasir tahu ada QRIS pending
          transaction_id: tx.id,
          amount: tx.calculated_fee ?? 0,
          gate_name: gate?.name ?? '',
          zone_name: gate?.zone_name ?? '',
        })
        console.log('[PAYMENT] notifyCashier qris sent (for kasir polling detection)')
      } catch { /* non-fatal */ }
    } catch (err) {
      console.error('[PAYMENT] initiateQRIS failed:', err)
      qrisError = err instanceof Error ? err.message : 'Gagal membuat QRIS'
      if (tx) {
        try {
          console.log(`[PAYMENT] notifyCashier qris_fail tx=${tx.id}`)
          await notifyCashier({
            type: 'qris_fail',
            transaction_id: tx.id,
            amount: tx.calculated_fee ?? 0,
            gate_name: gate?.name ?? '',
            zone_name: gate?.zone_name ?? '',
          })
          console.log('[PAYMENT] notifyCashier sent, starting kioskPoll')
          if (kioskPollTimer) clearInterval(kioskPollTimer)
          kioskPollTimer = pollKioskCashier(
            tx.id,
            () => {
              console.log('[PAYMENT] kioskPoll → done')
              if (kioskPollTimer) { clearInterval(kioskPollTimer); kioskPollTimer = null }
              payModal = 'none'; exitStep = 'success'; tx = null
              resetIdleTimer()
              setTimeout(() => { exitStep = 'idle' }, 5000)
            },
            () => {
              console.log('[PAYMENT] kioskPoll → cancel')
              if (kioskPollTimer) { clearInterval(kioskPollTimer); kioskPollTimer = null }
              cancelPayModal()
            },
          )
        } catch (notifyErr) {
          console.error('[PAYMENT] notifyCashier failed:', notifyErr)
        }
      }
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

  async function doSelectCash() {
    payModal = 'cash'; cashCountdown = 60
    pushPayState('cash', tx?.id)
    console.log(`[PAYMENT] doSelectCash — tx=${tx?.id} fee=${tx?.calculated_fee}`)
    // Pause idle timer selama menunggu kasir — jangan reload halaman
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }
    if (cashTimer) clearInterval(cashTimer)
    cashTimer = setInterval(() => {
      cashCountdown -= 1
      if (cashCountdown <= 0) {
        console.log('[PAYMENT] cashCountdown habis → closePayModal')
        closePayModal()
      }
    }, 1000)

    if (!tx) return
    try {
      console.log(`[PAYMENT] notifyCashier cash tx=${tx.id} — stamp cashier_requested_at di DB`)
      await notifyCashier({
        type: 'cash',
        transaction_id: tx.id,
        amount: tx.calculated_fee ?? 0,
        gate_name: gate?.name ?? '',
        zone_name: gate?.zone_name ?? '',
      })
      console.log('[PAYMENT] notifyCashier OK')
    } catch (err) {
      console.error('[PAYMENT] notifyCashier failed:', err)
    }
    console.log('[PAYMENT] starting kioskPoll')
    if (kioskPollTimer) clearInterval(kioskPollTimer)
    kioskPollTimer = pollKioskCashier(
      tx.id,
      () => {
        console.log('[PAYMENT] kioskPoll → done (cash)')
        if (cashTimer) clearInterval(cashTimer)
        if (kioskPollTimer) { clearInterval(kioskPollTimer); kioskPollTimer = null }
        payModal = 'none'; exitStep = 'success'; tx = null
        pushPayState('none')
        resetIdleTimer()
        setTimeout(() => { exitStep = 'idle' }, 5000)
      },
      () => {
        console.log('[PAYMENT] kioskPoll → cancel (cash)')
        if (cashTimer) clearInterval(cashTimer)
        if (kioskPollTimer) { clearInterval(kioskPollTimer); kioskPollTimer = null }
        cancelPayModal()
      },
    )
  }

  function stopKioskPoll() {
    if (kioskPollTimer) { clearInterval(kioskPollTimer); kioskPollTimer = null }
  }

  function closePayModal() {
    // closePayModal hanya dipanggil saat countdown habis — kembali ke select, BUKAN success
    // Success hanya dari kioskPoll → onDone
    if (cashTimer) clearInterval(cashTimer)
    stopQRISTimers()
    // Jangan stop kioskPoll — biarkan terus poll sampai kasir konfirmasi
    payModal = 'select'; qrisPayment = null; qrisError = ''
    cashCountdown = 0
    resetIdleTimer()
    console.log('[PAYMENT] cashCountdown habis → kembali ke payModal select (kioskPoll masih jalan)')
  }

  function cancelPayModal() {
    if (cashTimer) clearInterval(cashTimer)
    stopQRISTimers()
    stopKioskPoll()
    payModal = 'none'; qrisPayment = null; qrisError = ''
    exitStep = 'idle'; tx = null
    pushPayState('none')
    resetIdleTimer()
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

  // ── URL state sync ────────────────────────────────────────────────────────
  // Simpan state payment ke query param supaya reload bisa restore
  // Format: ?modal=cash&tx=<id> atau ?modal=select&tx=<id>

  function pushPayState(modal: PayModal, txId?: string) {
    if (!isEntry) {
      const url = new URL(window.location.href)
      if (modal === 'none') {
        url.searchParams.delete('modal')
        url.searchParams.delete('tx')
      } else {
        url.searchParams.set('modal', modal)
        if (txId) url.searchParams.set('tx', txId)
      }
      goto(url.pathname + url.search, { replaceState: true, noScroll: true, keepFocus: true })
    }
  }

  // Restore state dari URL saat pertama load
  async function restoreFromURL() {
    if (isEntry) return
    const urlModal = $page.url.searchParams.get('modal') as PayModal | null
    const urlTxId  = $page.url.searchParams.get('tx')
    if (!urlModal || urlModal === 'none' || !urlTxId) return

    console.log(`[STATE] restore from URL modal=${urlModal} tx=${urlTxId}`)
    try {
      const restored = await getTransaction(urlTxId)
      if (restored.status !== 'awaiting_payment') {
        // Transaksi sudah selesai — clear URL dan kembali idle
        console.log(`[STATE] tx sudah ${restored.status}, skip restore`)
        pushPayState('none')
        return
      }
      tx = restored
      exitStep = 'idle'
      payModal = urlModal === 'cash' ? 'cash' : 'select'
      console.log(`[STATE] restored: payModal=${payModal} tx=${tx.id}`)

      // Kalau restore ke cash, langsung mulai kioskPoll lagi
      if (payModal === 'cash') {
        if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }
        console.log('[STATE] re-starting kioskPoll after restore')
        if (kioskPollTimer) clearInterval(kioskPollTimer)
        kioskPollTimer = pollKioskCashier(
          tx.id,
          () => {
            if (cashTimer) clearInterval(cashTimer)
            if (kioskPollTimer) { clearInterval(kioskPollTimer); kioskPollTimer = null }
            payModal = 'none'; exitStep = 'success'; tx = null
            pushPayState('none')
            resetIdleTimer()
            setTimeout(() => { exitStep = 'idle' }, 5000)
          },
          () => {
            if (cashTimer) clearInterval(cashTimer)
            if (kioskPollTimer) { clearInterval(kioskPollTimer); kioskPollTimer = null }
            cancelPayModal()
          },
        )
      }
    } catch (err) {
      console.error('[STATE] restore failed:', err)
      pushPayState('none')
    }
  }
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
    onCancelPayModal={cancelPayModal}
  />
{/if}
