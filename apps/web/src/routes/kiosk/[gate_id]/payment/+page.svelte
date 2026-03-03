<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { getGateInfo } from '$lib/utils/auth'
  import { getTransaction } from '$lib/api/transactions'
  import { payCash, initiateQRIS, getPaymentsByTransaction } from '$lib/api/payments'
  import { formatCurrency } from '$lib/utils/format'
  import { createPoller } from '$lib/utils/polling'
  import { Banknote, QrCode, CheckCircle, AlertCircle, Loader } from 'lucide-svelte'
  import type { Transaction, Payment } from '$lib/types/domain'

  const gateId = $page.params.gate_id
  const txId   = $page.url.searchParams.get('tx_id') ?? ''
  const gate   = getGateInfo()

  type PayMethod = 'select' | 'cash' | 'qris'
  type Step = 'select' | 'cash-input' | 'cash-confirm' | 'qris-loading' | 'qris-waiting' | 'processing' | 'error'

  let step       = $state<Step>('select')
  let payMethod  = $state<PayMethod>('select')
  let tx         = $state<Transaction | null>(null)
  let payment    = $state<Payment | null>(null)
  let cashInput  = $state('')
  let errorMsg   = $state('')

  let idleTimer: ReturnType<typeof setTimeout> | null = null

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => goto(`/kiosk/${gateId}`, { replaceState: true }), 120_000)
  }

  onMount(async () => {
    resetIdleTimer()
    if (!txId) { goto(`/kiosk/${gateId}`); return }
    try {
      tx = await getTransaction(txId)
    } catch {
      goto(`/kiosk/${gateId}`)
    }
  })

  onDestroy(() => {
    if (idleTimer) clearTimeout(idleTimer)
    qrisPoller.stop()
  })

  // Poll payment status setiap 3 detik saat menunggu QRIS
  const qrisPoller = createPoller(async () => {
    if (!txId) return
    const payments = await getPaymentsByTransaction(txId)
    const latest = payments[payments.length - 1]
    if (!latest) return
    payment = latest
    if (latest.status === 'completed') {
      qrisPoller.stop()
      goto(`/kiosk/${gateId}/success?tx_id=${txId}&type=exit`)
    } else if (latest.status === 'failed' || latest.status === 'expired') {
      qrisPoller.stop()
      errorMsg = latest.status === 'expired' ? 'QRIS kadaluarsa.' : 'Pembayaran gagal.'
      step = 'error'
    }
  }, 3_000)

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
      goto(`/kiosk/${gateId}/success?tx_id=${txId}&type=exit`)
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Pembayaran gagal.'
      step = 'error'
    }
  }

  const cashTendered = $derived(parseInt(cashInput.replace(/\D/g, ''), 10) || 0)
  const cashChange   = $derived(Math.max(0, cashTendered - (tx?.calculated_fee ?? 0)))
  const cashValid    = $derived(cashTendered >= (tx?.calculated_fee ?? 0))

  // Preset nominal uang
  const cashPresets = [5_000, 10_000, 20_000, 50_000, 100_000]

  function addPreset(val: number) {
    cashInput = String((cashTendered || 0) + val)
    resetIdleTimer()
  }
</script>

<svelte:window onkeydown={() => resetIdleTimer()} onmousemove={() => resetIdleTimer()} />

<div class="flex h-screen flex-col bg-slate-950 text-white select-none">
  <div class="flex items-center justify-between px-8 py-5 border-b border-slate-800">
    <div>
      <p class="text-xs text-slate-500 uppercase tracking-widest">Pembayaran</p>
      <p class="text-sm font-semibold text-slate-300">{gate?.name}</p>
    </div>
    {#if tx}
      <div class="text-right">
        <p class="text-xs text-slate-500">Total Tagihan</p>
        <p class="font-mono text-xl font-bold text-emerald-400">
          {formatCurrency(tx.calculated_fee ?? 0)}
        </p>
      </div>
    {/if}
  </div>

  <div class="flex flex-1 flex-col items-center justify-center gap-8 px-8">

    {#if step === 'select'}
      <p class="text-xl font-light text-slate-300">Pilih metode pembayaran</p>

      <div class="flex gap-6">
        <button
          onclick={() => { payMethod = 'qris'; startQRIS() }}
          class="flex h-44 w-44 flex-col items-center justify-center gap-4 rounded-xl
            border-2 border-slate-700 bg-slate-900 text-slate-300 transition-all
            hover:border-brand-500 hover:bg-slate-800 hover:text-white active:scale-95"
        >
          <QrCode size={48} strokeWidth={1.25} />
          <span class="text-sm font-semibold">QRIS</span>
        </button>

        <button
          onclick={() => { payMethod = 'cash'; step = 'cash-input' }}
          class="flex h-44 w-44 flex-col items-center justify-center gap-4 rounded-xl
            border-2 border-slate-700 bg-slate-900 text-slate-300 transition-all
            hover:border-brand-500 hover:bg-slate-800 hover:text-white active:scale-95"
        >
          <Banknote size={48} strokeWidth={1.25} />
          <span class="text-sm font-semibold">Tunai</span>
        </button>
      </div>

    {:else if step === 'cash-input'}
      <p class="text-xl font-light text-slate-300">Masukkan nominal uang</p>

      <div class="w-full max-w-xs space-y-4">
        <div class="rounded-xl border border-slate-700 bg-slate-900 p-4 text-center">
          <p class="text-xs text-slate-500 mb-1">Tagihan</p>
          <p class="font-mono text-2xl font-bold text-white">
            {formatCurrency(tx?.calculated_fee ?? 0)}
          </p>
        </div>

        <div class="flex flex-wrap gap-2 justify-center">
          {#each cashPresets as preset}
            <button
              onclick={() => addPreset(preset)}
              class="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400
                hover:bg-slate-800 active:scale-95 transition-all"
            >
              +{formatCurrency(preset)}
            </button>
          {/each}
        </div>

        <div class="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3">
          <p class="text-xs text-slate-500 mb-1">Uang Diterima</p>
          <input
            bind:value={cashInput}
            oninput={() => { cashInput = cashInput.replace(/\D/g, ''); resetIdleTimer() }}
            placeholder="0"
            class="w-full bg-transparent font-mono text-2xl font-bold text-white outline-none
              placeholder:text-slate-700"
          />
        </div>

        {#if cashTendered > 0}
          <div class="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 flex justify-between">
            <span class="text-xs text-slate-500">Kembalian</span>
            <span class="font-mono text-sm font-semibold {cashValid ? 'text-emerald-400' : 'text-red-400'}">
              {cashValid ? formatCurrency(cashChange) : 'Kurang'}
            </span>
          </div>
        {/if}

        <button
          onclick={submitCash}
          disabled={!cashValid}
          class="w-full rounded-lg bg-brand-500 py-3 text-sm font-semibold transition-colors
            hover:bg-brand-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Konfirmasi Pembayaran
        </button>
      </div>

    {:else if step === 'qris-loading'}
      <Loader size={40} strokeWidth={1.5} class="text-slate-500 animate-spin" />
      <p class="text-sm text-slate-400">Membuat kode QRIS...</p>

    {:else if step === 'qris-waiting' && payment}
      <p class="text-xl font-light text-slate-300">Scan QRIS untuk membayar</p>

      {#if payment.qris_image_url}
        <img
          src={payment.qris_image_url}
          alt="QRIS"
          class="h-56 w-56 rounded-xl border border-slate-700 bg-white p-2"
        />
      {:else}
        <div class="flex h-56 w-56 items-center justify-center rounded-xl border border-slate-700 bg-slate-900">
          <QrCode size={64} strokeWidth={1} class="text-slate-600" />
        </div>
      {/if}

      <div class="flex items-center gap-2 text-slate-500">
        <Loader size={14} class="animate-spin" />
        <p class="text-xs">Menunggu konfirmasi pembayaran...</p>
      </div>

      <p class="font-mono text-2xl font-bold text-emerald-400">
        {formatCurrency(payment.amount)}
      </p>

    {:else if step === 'processing'}
      <Loader size={40} strokeWidth={1.5} class="text-slate-500 animate-spin" />
      <p class="text-sm text-slate-400">Memproses pembayaran...</p>

    {:else if step === 'error'}
      <AlertCircle size={48} strokeWidth={1.25} class="text-red-400" />
      <p class="text-lg font-semibold text-red-400">Pembayaran Gagal</p>
      <p class="text-sm text-slate-400 text-center max-w-xs">{errorMsg}</p>
      <div class="flex gap-4">
        <button
          onclick={() => { step = 'select'; errorMsg = ''; payMethod = 'select'; resetIdleTimer() }}
          class="rounded-lg border border-slate-700 px-6 py-2.5 text-sm text-slate-300
            hover:bg-slate-800 active:scale-95"
        >
          Coba Lagi
        </button>
        <button
          onclick={() => goto(`/kiosk/${gateId}`, { replaceState: true })}
          class="rounded-lg border border-slate-700 px-6 py-2.5 text-sm text-slate-300
            hover:bg-slate-800 active:scale-95"
        >
          Kembali
        </button>
      </div>
    {/if}

  </div>
</div>
