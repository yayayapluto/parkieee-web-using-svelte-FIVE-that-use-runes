<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { page } from '$app/stores'
  import { getGateInfo } from '$lib/utils/auth'
  import { getTransaction } from '$lib/api/transactions'
  import { getKioskTariff } from '$lib/api/fees'
  import { payCash, initiateQRIS, getPaymentsByTransaction } from '$lib/api/payments'
  import { createPoller } from '$lib/utils/polling'
  import type { Transaction, Payment } from '$lib/types/domain'

  import PaymentLoading from '$lib/components/payment/PaymentLoading.svelte'
  import PaymentSelect  from '$lib/components/payment/PaymentSelect.svelte'
  import PaymentCash    from '$lib/components/payment/PaymentCash.svelte'
  import PaymentQRIS    from '$lib/components/payment/PaymentQRIS.svelte'
  import PaymentError   from '$lib/components/payment/PaymentError.svelte'
  import KioskModal     from '$lib/components/kiosk/KioskModal.svelte'

  import { CircleCheckBig } from 'lucide-svelte'
  import { formatCurrency, formatDurationMinutes } from '$lib/utils/format'

  const gateId = $page.params.gate_id
  const txId   = $page.url.searchParams.get('tx_id') ?? ''
  const gate   = getGateInfo()

  type Step = 'loading' | 'select' | 'cash' | 'qris-loading' | 'qris-waiting' | 'processing' | 'error'

  let step        = $state<Step>('loading')
  let tx          = $state<Transaction | null>(null)
  let payment     = $state<Payment | null>(null)
  let cashInput   = $state('')
  let errorMsg    = $state('')
  let gracePeriod = $state(0)
  let now         = $state(Date.now())

  let showGraceModal    = $state(false)
  let pendingMethod     = $state<'cash' | 'qris' | null>(null)

  let clockInterval: ReturnType<typeof setInterval> | null = null
  let idleTimer:     ReturnType<typeof setTimeout>  | null = null

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => window.location.href = `/gate/${gateId}`, 120_000)
  }

  const qrisPoller = createPoller(async () => {
    if (!txId) return
    const payments = await getPaymentsByTransaction(txId)
    const latest   = payments[payments.length - 1]
    if (!latest) return
    payment = latest
    if (latest.status === 'paid') {
      qrisPoller.stop()
      window.location.href = `/gate/${gateId}/success?tx_id=${txId}&type=exit`
    } else if (latest.status === 'failed') {
      qrisPoller.stop()
      errorMsg = 'Pembayaran gagal. Silakan coba lagi.'
      step = 'error'
    }
  }, 3_000)

  onMount(async () => {
    resetIdleTimer()
    clockInterval = setInterval(() => { now = Date.now() }, 1_000)
    if (!txId) { window.location.href = `/gate/${gateId}`; return }
    try {
      tx = await getTransaction(txId)
      if (gate?.id) {
        try {
          const tariffs = await getKioskTariff(gate.id)
          gracePeriod = tariffs[0]?.fee_config?.grace_period_minutes ?? 0
        } catch { /* grace period tetap 0 */ }
      }
      step = 'select'
    } catch {
      window.location.href = `/gate/${gateId}`
    }
  })

  onDestroy(() => {
    if (idleTimer) clearTimeout(idleTimer)
    if (clockInterval) clearInterval(clockInterval)
    qrisPoller.stop()
  })

  const durationMinutes = $derived(
    tx?.entry_at ? Math.ceil((now - new Date(tx.entry_at).getTime()) / 60_000) : 0
  )
  const isGracePeriod = $derived(gracePeriod > 0 && durationMinutes <= gracePeriod)
  const effectiveFee  = $derived(isGracePeriod ? 0 : (tx?.calculated_fee ?? 0))

  const cashTendered = $derived(parseInt(cashInput.replace(/\D/g, ''), 10) || 0)
  const cashChange   = $derived(Math.max(0, cashTendered - effectiveFee))
  const cashValid    = $derived(isGracePeriod || cashTendered >= effectiveFee)
  const cashPresets  = [2_000, 5_000, 10_000, 20_000, 50_000]

  function addPreset(val: number) {
    cashInput = String(cashTendered + val)
    resetIdleTimer()
  }

  function handleSelectCash() {
    resetIdleTimer()
    if (isGracePeriod) {
      pendingMethod = 'cash'
      showGraceModal = true
    } else {
      step = 'cash'
    }
  }

  function handleSelectQRIS() {
    resetIdleTimer()
    if (isGracePeriod) {
      pendingMethod = 'qris'
      showGraceModal = true
    } else {
      doStartQRIS()
    }
  }

  function confirmGrace() {
    showGraceModal = false
    resetIdleTimer()
    window.location.href = `/gate/${gateId}/success?tx_id=${txId}&type=exit`
  }

  function cancelGrace() {
    showGraceModal = false
    pendingMethod  = null
    resetIdleTimer()
  }

  async function doStartQRIS() {
    if (!tx) return
    step = 'qris-loading'; resetIdleTimer()
    try {
      payment = await initiateQRIS(tx.id)
      step = 'qris-waiting'
      qrisPoller.start()
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Gagal membuat QRIS.'
      step = 'error'
    }
  }

  async function submitCash() {
    if (!tx || !cashValid) return
    step = 'processing'; resetIdleTimer()
    try {
      await payCash(tx.id, cashTendered)
      window.location.href = `/gate/${gateId}/success?tx_id=${txId}&type=exit`
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Pembayaran gagal.'
      step = 'error'
    }
  }

  const statusBarText = $derived(
    step === 'select' && isGracePeriod ? 'Kendaraan masih dalam grace period — tidak dikenakan biaya' :
    step === 'qris-waiting'            ? 'Gunakan aplikasi mobile banking atau e-wallet untuk scan QRIS' :
    step === 'cash'                    ? 'Serahkan uang kepada operator atau masukkan ke mesin' :
                                         'Pilih metode pembayaran'
  )
</script>

<svelte:window
  onkeydown={() => resetIdleTimer()}
  onclick={() => resetIdleTimer()}
/>

<div class="w-screen h-screen flex flex-col bg-white text-gray-900 select-none overflow-hidden font-[family-name:var(--font-family-kiosk)]">

  <!-- Header -->
  <div class="flex items-center justify-between px-10 h-16 border-b border-gray-200 shrink-0">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-[#1a56db] rounded-full flex items-center justify-center">
        <span class="text-white text-[11px] font-black tracking-[-0.5px]">P</span>
      </div>
      <span class="text-[15px] font-extrabold tracking-[0.08em] uppercase text-gray-900">PARKIEEE</span>
    </div>
    <span class="text-[13px] text-gray-500 tracking-[0.05em] uppercase">
      {gate?.zone_name ?? '—'} › Pembayaran
    </span>
  </div>

  <!-- Body -->
  <div class="flex-1 flex items-center justify-center p-8">

    {#if step === 'loading'}
      <PaymentLoading message="Memuat data transaksi..." />

    {:else if step === 'select' && tx}
      <PaymentSelect
        {tx}
        {durationMinutes}
        {isGracePeriod}
        {gracePeriod}
        onSelectCash={handleSelectCash}
        onSelectQRIS={handleSelectQRIS}
      />

    {:else if step === 'cash' && tx}
      <PaymentCash
        {effectiveFee}
        {isGracePeriod}
        bind:cashInput
        {cashTendered}
        {cashChange}
        {cashValid}
        {cashPresets}
        onAddPreset={addPreset}
        onBack={() => { step = 'select'; cashInput = ''; resetIdleTimer() }}
        onConfirm={submitCash}
      />

    {:else if step === 'qris-loading'}
      <PaymentLoading message="Membuat kode QRIS..." />

    {:else if step === 'qris-waiting' && payment}
      <PaymentQRIS
        {payment}
        onBack={() => { qrisPoller.stop(); step = 'select'; resetIdleTimer() }}
      />

    {:else if step === 'processing'}
      <PaymentLoading message="Memproses pembayaran..." />

    {:else if step === 'error'}
      <PaymentError
        {errorMsg}
        onRetry={() => { step = 'select'; errorMsg = ''; resetIdleTimer() }}
        onHome={() => window.location.href = `/gate/${gateId}`}
      />
    {/if}

  </div>

  <!-- Status bar -->
  <div class="border-t border-gray-200 bg-gray-50 px-8 py-2.5 flex justify-center shrink-0">
    <p class="text-[11px] text-gray-400 tracking-[0.1em] uppercase">{statusBarText}</p>
  </div>

</div>

<!-- Modal Grace Period -->
<KioskModal
  show={showGraceModal}
  title="Konfirmasi Keluar"
  footerLabel="LANJUTKAN — GRATIS"
  onClose={confirmGrace}
>
  <div class="flex flex-col items-center gap-5 px-8 py-10 text-center">
    <CircleCheckBig size={52} class="text-green-500" strokeWidth={1.25} />
    <div class="space-y-1">
      <p class="text-xl font-bold text-gray-900">Parkir Gratis</p>
      <p class="text-sm text-gray-500">
        Durasi parkir <span class="font-semibold text-[#1a56db]">{formatDurationMinutes(durationMinutes)}</span>
        masih dalam grace period <span class="font-semibold">{gracePeriod} menit</span>.
      </p>
    </div>
    <div class="border border-green-200 bg-green-50 px-8 py-4 w-full">
      <p class="text-xs text-gray-500 mb-1">Total Bayar</p>
      <p class="text-3xl font-black text-green-600">Rp 0</p>
      {#if tx?.calculated_fee}
        <p class="text-xs text-gray-400 line-through mt-0.5">{formatCurrency(tx.calculated_fee)}</p>
      {/if}
    </div>
    <button
      onclick={cancelGrace}
      class="text-xs text-gray-400 underline cursor-pointer hover:text-gray-600 transition-colors"
    >
      Batalkan
    </button>
  </div>
</KioskModal>
