<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { getGateInfo } from '$lib/utils/auth'
  import { getTransaction } from '$lib/api/transactions'
  import { payCash, initiateQRIS, getPaymentsByTransaction } from '$lib/api/payments'
  import { formatCurrency, formatDurationMinutes } from '$lib/utils/format'
  import { createPoller } from '$lib/utils/polling'
  import { Banknote, QrCode, AlertCircle, Loader } from 'lucide-svelte'
  import type { Transaction, Payment } from '$lib/types/domain'

  const gateId = $page.params.gate_id
  const txId   = $page.url.searchParams.get('tx_id') ?? ''
  const gate   = getGateInfo()

  type Step = 'loading-tx' | 'select' | 'cash-input' | 'qris-loading' | 'qris-waiting' | 'processing' | 'error'

  let step      = $state<Step>('loading-tx')
  let tx        = $state<Transaction | null>(null)
  let payment   = $state<Payment | null>(null)
  let cashInput = $state('')
  let errorMsg  = $state('')

  let idleTimer: ReturnType<typeof setTimeout> | null = null

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => goto(`/kiosk/${gateId}`, { replaceState: true }), 120_000)
  }

  const qrisPoller = createPoller(async () => {
    if (!txId) return
    const payments = await getPaymentsByTransaction(txId)
    const latest = payments[payments.length - 1]
    if (!latest) return
    payment = latest
    if (latest.status === 'paid') {
      qrisPoller.stop()
      goto(`/kiosk/${gateId}/success?tx_id=${txId}&type=exit`, { replaceState: true })
    } else if (latest.status === 'failed') {
      qrisPoller.stop()
      errorMsg = 'Pembayaran gagal. Silakan coba lagi.'
      step = 'error'
    }
  }, 3_000)

  onMount(async () => {
    resetIdleTimer()
    if (!txId) { goto(`/kiosk/${gateId}`, { replaceState: true }); return }
    try {
      tx = await getTransaction(txId)
      step = 'select'
    } catch {
      goto(`/kiosk/${gateId}`, { replaceState: true })
    }
  })

  onDestroy(() => {
    if (idleTimer) clearTimeout(idleTimer)
    qrisPoller.stop()
  })

  const durationMinutes = $derived(
    tx?.entry_at ? Math.ceil((Date.now() - new Date(tx.entry_at).getTime()) / 60_000) : 0
  )

  const entryPlate = $derived(
    tx?.ocr?.find(o => o.photo_type === 'entry')?.actual_plate ?? null
  )

  async function startQRIS() {
    if (!tx) return
    step = 'qris-loading'
    resetIdleTimer()
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
    if (!tx) return
    const tendered = parseInt(cashInput.replace(/\D/g, ''), 10)
    if (isNaN(tendered) || tendered < (tx.calculated_fee ?? 0)) return
    step = 'processing'
    resetIdleTimer()
    try {
      await payCash(tx.id, tendered)
      goto(`/kiosk/${gateId}/success?tx_id=${txId}&type=exit`, { replaceState: true })
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Pembayaran gagal.'
      step = 'error'
    }
  }

  const cashTendered = $derived(parseInt(cashInput.replace(/\D/g, ''), 10) || 0)
  const cashChange   = $derived(Math.max(0, cashTendered - (tx?.calculated_fee ?? 0)))
  const cashValid    = $derived(cashTendered >= (tx?.calculated_fee ?? 0))
  const cashPresets  = [5_000, 10_000, 20_000, 50_000, 100_000]

  function addPreset(val: number) {
    cashInput = String((cashTendered || 0) + val)
    resetIdleTimer()
  }
</script>

<svelte:window onkeydown={() => resetIdleTimer()} />

<div class="flex h-screen flex-col bg-white text-slate-900 select-none">

  <!-- Header -->
  <div class="flex items-center justify-between border-b border-slate-200 px-8 py-3">
    <div>
      <p class="text-xs text-slate-400 uppercase tracking-widest">{gate?.zone_name ?? '—'}</p>
      <p class="text-sm font-semibold text-slate-700">{gate?.name ?? '—'}</p>
    </div>
    <p class="font-mono text-xs text-slate-400">Pembayaran</p>
  </div>

  <!-- Main -->
  <div class="flex flex-1 flex-col items-center justify-center gap-8 px-8">

    {#if step === 'loading-tx'}
      <Loader size={32} strokeWidth={1.5} class="animate-spin text-brand-500" />
      <p class="text-sm text-slate-400">Memuat data transaksi...</p>

    {:else if step === 'select' && tx}
      <!-- Info panel split dua kolom sesuai wireframe -->
      <div class="w-full max-w-2xl rounded border border-slate-200 shadow-sm overflow-hidden">
        <div class="grid grid-cols-2 divide-x divide-slate-200">

          <!-- Kiri: durasi + tipe + total -->
          <div class="flex flex-col justify-between p-8 gap-4">
            <div class="space-y-2">
              <p class="font-mono text-2xl font-light text-slate-800">
                {formatDurationMinutes(durationMinutes)}
              </p>
              <p class="text-sm text-slate-500">Hari Biasa</p>
            </div>
            <p class="font-mono text-3xl font-bold text-slate-900">
              {tx.calculated_fee != null ? formatCurrency(tx.calculated_fee) : '—'}
            </p>
          </div>

          <!-- Kanan: plat + tagihan -->
          <div class="flex flex-col divide-y divide-slate-200">
            <div class="flex flex-col gap-1 p-6">
              <p class="text-xs text-slate-400 uppercase tracking-wide">Nomor Polisi</p>
              <p class="font-mono text-2xl font-bold text-slate-800 uppercase">
                {entryPlate ?? '—'}
              </p>
            </div>
            <div class="flex flex-col gap-1 p-6">
              <p class="text-xs text-slate-400 uppercase tracking-wide">Bayar</p>
              <p class="font-mono text-2xl font-bold text-emerald-600">
                {tx.calculated_fee != null ? formatCurrency(tx.calculated_fee) : '—'}
              </p>
            </div>
          </div>

        </div>
      </div>

      <!-- Pilih metode bayar -->
      <div class="flex gap-4">
        <button
          onclick={() => { step = 'cash-input'; resetIdleTimer() }}
          class="flex h-24 w-40 flex-col items-center justify-center gap-3 rounded-lg
            border-2 border-slate-300 bg-white text-slate-600 font-semibold
            hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600
            active:scale-95 transition-all"
        >
          <Banknote size={28} strokeWidth={1.5} />
          <span class="text-sm">Tunai</span>
        </button>

        <button
          onclick={startQRIS}
          class="flex h-24 w-40 flex-col items-center justify-center gap-3 rounded-lg
            border-2 border-slate-300 bg-white text-slate-600 font-semibold
            hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600
            active:scale-95 transition-all"
        >
          <QrCode size={28} strokeWidth={1.5} />
          <span class="text-sm">QRIS</span>
        </button>
      </div>

    {:else if step === 'cash-input' && tx}
      <div class="w-full max-w-sm space-y-4">
        <p class="text-center text-sm font-semibold text-slate-700">Masukkan nominal uang</p>

        <!-- Tagihan -->
        <div class="rounded border border-slate-200 bg-slate-50 p-4 text-center">
          <p class="text-xs text-slate-400 mb-1">Total Tagihan</p>
          <p class="font-mono text-2xl font-bold text-slate-900">
            {formatCurrency(tx.calculated_fee ?? 0)}
          </p>
        </div>

        <!-- Preset -->
        <div class="flex flex-wrap gap-2 justify-center">
          {#each cashPresets as preset}
            <button
              onclick={() => addPreset(preset)}
              class="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-600
                hover:bg-slate-100 active:scale-95 transition-all"
            >
              +{formatCurrency(preset)}
            </button>
          {/each}
        </div>

        <!-- Input uang diterima -->
        <div class="rounded border border-slate-300 bg-white px-4 py-3">
          <p class="text-xs text-slate-400 mb-1">Uang Diterima</p>
          <input
            bind:value={cashInput}
            oninput={() => { cashInput = cashInput.replace(/\D/g, ''); resetIdleTimer() }}
            placeholder="0"
            class="w-full bg-transparent font-mono text-2xl font-bold text-slate-900
              outline-none placeholder:text-slate-300"
          />
        </div>

        {#if cashTendered > 0}
          <div class="flex justify-between rounded border border-slate-200 bg-slate-50 px-4 py-3">
            <span class="text-sm text-slate-500">Kembalian</span>
            <span class="font-mono font-semibold {cashValid ? 'text-emerald-600' : 'text-red-500'}">
              {cashValid ? formatCurrency(cashChange) : 'Kurang'}
            </span>
          </div>
        {/if}

        <div class="flex gap-3">
          <button
            onclick={() => { step = 'select'; cashInput = ''; resetIdleTimer() }}
            class="flex-1 rounded border border-slate-300 py-2.5 text-sm text-slate-600
              hover:bg-slate-50 active:scale-95 transition-colors"
          >
            Kembali
          </button>
          <button
            onclick={submitCash}
            disabled={!cashValid}
            class="flex-1 rounded bg-brand-500 py-2.5 text-sm font-semibold text-white
              hover:bg-brand-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Konfirmasi
          </button>
        </div>
      </div>

    {:else if step === 'qris-loading'}
      <Loader size={36} strokeWidth={1.5} class="animate-spin text-brand-500" />
      <p class="text-sm text-slate-400">Membuat kode QRIS...</p>

    {:else if step === 'qris-waiting' && payment}
      <p class="text-sm font-semibold text-slate-700">Scan QRIS untuk membayar</p>

      {#if payment.qris_image_url}
        <img
          src={payment.qris_image_url}
          alt="QRIS"
          class="h-56 w-56 rounded border border-slate-200 p-2 bg-white shadow-sm"
        />
      {:else}
        <div class="flex h-56 w-56 items-center justify-center rounded border border-slate-200 bg-slate-50">
          <QrCode size={64} strokeWidth={1} class="text-slate-300" />
        </div>
      {/if}

      <p class="font-mono text-2xl font-bold text-emerald-600">
        {formatCurrency(payment.amount)}
      </p>

      <div class="flex items-center gap-2 text-slate-400">
        <Loader size={13} class="animate-spin" />
        <p class="text-xs">Menunggu konfirmasi pembayaran...</p>
      </div>

    {:else if step === 'processing'}
      <Loader size={36} strokeWidth={1.5} class="animate-spin text-brand-500" />
      <p class="text-sm text-slate-400">Memproses pembayaran...</p>

    {:else if step === 'error'}
      <AlertCircle size={40} strokeWidth={1.25} class="text-red-500" />
      <p class="text-base font-semibold text-red-600">Pembayaran Gagal</p>
      <p class="text-sm text-slate-400 text-center max-w-xs">{errorMsg}</p>
      <div class="flex gap-4">
        <button
          onclick={() => { step = 'select'; errorMsg = ''; resetIdleTimer() }}
          class="rounded border border-slate-300 px-6 py-2.5 text-sm text-slate-600
            hover:bg-slate-50 active:scale-95"
        >
          Coba Lagi
        </button>
        <button
          onclick={() => goto(`/kiosk/${gateId}`, { replaceState: true })}
          class="rounded border border-slate-300 px-6 py-2.5 text-sm text-slate-600
            hover:bg-slate-50 active:scale-95"
        >
          Kembali
        </button>
      </div>
    {/if}

  </div>

  <!-- Footer -->
  <div class="border-t border-slate-200 bg-slate-50 px-8 py-3">
    <p class="text-center text-xs text-slate-400">
      {step === 'qris-waiting' ? 'Gunakan aplikasi mobile banking atau e-wallet untuk scan QRIS' : 'Pilih metode pembayaran'}
    </p>
  </div>

</div>
