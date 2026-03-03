<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { getGateInfo } from '$lib/utils/auth'
  import { getTransactionByCode, recordExit } from '$lib/api/transactions'
  import { formatCurrency, formatDurationMinutes } from '$lib/utils/format'
  import { ArrowLeft, CreditCard, ScanLine, Clock, Car, AlertCircle, CheckCircle } from 'lucide-svelte'
  import PlateDisplay from '$lib/components/PlateDisplay.svelte'
  import type { Transaction } from '$lib/types/domain'

  const gateId = $page.params.gate_id
  const gate   = getGateInfo()

  type Method = 'rfid' | 'qr'
  type Step   = 'select' | 'input' | 'loading-lookup' | 'confirm' | 'loading-exit' | 'error'

  let method   = $state<Method>('rfid')
  let step     = $state<Step>('select')
  let inputVal = $state('')
  let tx       = $state<Transaction | null>(null)
  let errorMsg = $state('')
  let inputEl  = $state<HTMLInputElement | null>(null)

  $effect(() => {
    if (step === 'input' && inputEl) inputEl.focus()
  })

  let idleTimer: ReturnType<typeof setTimeout> | null = null

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => goto(`/kiosk/${gateId}`, { replaceState: true }), 60_000)
  }

  onMount(() => resetIdleTimer())
  onDestroy(() => { if (idleTimer) clearTimeout(idleTimer) })

  function selectMethod(m: Method) {
    method = m
    step = 'input'
    resetIdleTimer()
  }

  async function lookup() {
    const value = inputVal.trim()
    if (!value) return

    step = 'loading-lookup'
    resetIdleTimer()

    try {
      const result = await getTransactionByCode(value)
      tx = result
      step = 'confirm'
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Transaksi tidak ditemukan.'
      step = 'error'
    }
    resetIdleTimer()
  }

  async function confirmExit() {
    if (!tx || !gate) return

    step = 'loading-exit'
    resetIdleTimer()

    try {
      const form = new FormData()
      form.append('exit_gate_id', gate.id)
      form.append('exit_method', method)
      if (method === 'rfid') form.append('rfid_card_uid', inputVal.trim())

      const updated = await recordExit(tx.id, form)
      goto(`/kiosk/${gateId}/payment?tx_id=${updated.id}`)
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Gagal memproses keluar.'
      step = 'error'
    }
    resetIdleTimer()
  }

  function retry() {
    inputVal = ''
    tx = null
    errorMsg = ''
    step = 'select'
    method = 'rfid'
    resetIdleTimer()
  }

  const durationMinutes = $derived(
    tx?.entry_at
      ? Math.ceil((Date.now() - new Date(tx.entry_at).getTime()) / 60_000)
      : 0
  )
</script>

<svelte:window onkeydown={() => resetIdleTimer()} onmousemove={() => resetIdleTimer()} />

<div class="flex h-screen flex-col bg-slate-950 text-white select-none">
  <div class="flex items-center gap-4 px-8 py-5 border-b border-slate-800">
    <button
      onclick={() => goto(`/kiosk/${gateId}`, { replaceState: true })}
      class="text-slate-500 hover:text-slate-300 transition-colors"
    >
      <ArrowLeft size={20} />
    </button>
    <div>
      <p class="text-xs text-slate-500 uppercase tracking-widest">Gerbang Keluar</p>
      <p class="text-sm font-semibold text-slate-300">{gate?.name}</p>
    </div>
  </div>

  <div class="flex flex-1 flex-col items-center justify-center gap-8 px-8">

    {#if step === 'select'}
      <p class="text-xl font-light text-slate-300">Pilih metode keluar</p>

      <div class="flex gap-6">
        <button
          onclick={() => selectMethod('rfid')}
          class="flex h-44 w-44 flex-col items-center justify-center gap-4 rounded-xl
            border-2 border-slate-700 bg-slate-900 text-slate-300 transition-all
            hover:border-brand-500 hover:bg-slate-800 hover:text-white active:scale-95"
        >
          <CreditCard size={48} strokeWidth={1.25} />
          <span class="text-sm font-semibold">Tap RFID</span>
        </button>

        <button
          onclick={() => selectMethod('qr')}
          class="flex h-44 w-44 flex-col items-center justify-center gap-4 rounded-xl
            border-2 border-slate-700 bg-slate-900 text-slate-300 transition-all
            hover:border-brand-500 hover:bg-slate-800 hover:text-white active:scale-95"
        >
          <ScanLine size={48} strokeWidth={1.25} />
          <span class="text-sm font-semibold">Scan QR / Kode</span>
        </button>
      </div>

    {:else if step === 'input'}
      {#if method === 'rfid'}
        <CreditCard size={56} strokeWidth={1} class="text-slate-600 animate-pulse" />
        <p class="text-xl font-light text-slate-300">Tempelkan kartu RFID</p>
        <p class="text-xs text-slate-600 text-center max-w-xs">
          Atau minta petugas untuk input kode tiket secara manual
        </p>
        <input
          bind:this={inputEl}
          bind:value={inputVal}
          onkeydown={(e) => { if (e.key === 'Enter') lookup() }}
          class="absolute opacity-0 pointer-events-none"
          autocomplete="off"
        />
        {#if inputVal}
          <p class="font-mono text-xs text-slate-500">{inputVal}</p>
          <button
            onclick={lookup}
            class="rounded-lg bg-brand-500 px-8 py-3 text-sm font-semibold
              hover:bg-brand-600 active:scale-95 transition-colors"
          >
            Lanjutkan
          </button>
        {/if}
      {:else}
        <ScanLine size={56} strokeWidth={1} class="text-slate-600" />
        <p class="text-xl font-light text-slate-300">Scan QR atau masukkan kode tiket</p>
        <div class="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3">
          <ScanLine size={16} class="text-slate-500 shrink-0" />
          <input
            bind:this={inputEl}
            bind:value={inputVal}
            onkeydown={(e) => { if (e.key === 'Enter') lookup() }}
            placeholder="Kode tiket..."
            class="bg-transparent font-mono text-sm text-slate-300 outline-none
              placeholder:text-slate-600 w-52"
          />
        </div>
        {#if inputVal.trim()}
          <button
            onclick={lookup}
            class="rounded-lg bg-brand-500 px-8 py-3 text-sm font-semibold
              hover:bg-brand-600 active:scale-95 transition-colors"
          >
            Cari Transaksi
          </button>
        {/if}
      {/if}

    {:else if step === 'loading-lookup' || step === 'loading-exit'}
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-brand-500"></div>
      <p class="text-sm text-slate-400">
        {step === 'loading-lookup' ? 'Mencari transaksi...' : 'Memproses keluar...'}
      </p>

    {:else if step === 'confirm' && tx}
      <CheckCircle size={40} strokeWidth={1.5} class="text-emerald-400" />
      <p class="text-xl font-light text-slate-300">Konfirmasi Keluar</p>

      <div class="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-500 flex items-center gap-1.5">
            <Car size={13} />
            Plat Kendaraan
          </span>
          <PlateDisplay
            plate={tx.ocr?.find(o => o.photo_type === 'entry')?.actual_plate ?? null}
            size="md"
          />
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock size={13} />
            Durasi Parkir
          </span>
          <span class="font-mono text-sm font-semibold text-white">
            {formatDurationMinutes(durationMinutes)}
          </span>
        </div>

        <div class="flex items-center justify-between border-t border-slate-800 pt-4">
          <span class="text-xs text-slate-500">Estimasi Tarif</span>
          <span class="font-mono text-lg font-bold text-emerald-400">
            {tx.calculated_fee != null ? formatCurrency(tx.calculated_fee) : '—'}
          </span>
        </div>
      </div>

      <div class="flex gap-4">
        <button
          onclick={retry}
          class="rounded-lg border border-slate-700 px-6 py-2.5 text-sm text-slate-400
            hover:bg-slate-800 active:scale-95 transition-colors"
        >
          Batal
        </button>
        <button
          onclick={confirmExit}
          class="rounded-lg bg-brand-500 px-8 py-2.5 text-sm font-semibold
            hover:bg-brand-600 active:scale-95 transition-colors"
        >
          Proses Keluar
        </button>
      </div>

    {:else if step === 'error'}
      <AlertCircle size={48} strokeWidth={1.25} class="text-red-400" />
      <p class="text-lg font-semibold text-red-400">Gagal</p>
      <p class="text-sm text-slate-400 text-center max-w-xs">{errorMsg}</p>
      <div class="flex gap-4">
        <button
          onclick={retry}
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
