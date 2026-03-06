<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { getGateInfo } from '$lib/utils/auth'
  import { getTransactionByCode, recordExit } from '$lib/api/transactions'
  import { formatCurrency, formatDurationMinutes } from '$lib/utils/format'
  import { AlertCircle, Loader } from 'lucide-svelte'
  import type { Transaction } from '$lib/types/domain'

  const gateId = $page.params.gate_id
  const gate   = getGateInfo()

  type Step = 'idle' | 'loading-lookup' | 'confirm' | 'loading-exit' | 'error'

  let step     = $state<Step>('idle')
  let inputVal = $state('')
  let tx       = $state<Transaction | null>(null)
  let errorMsg = $state('')
  let inputEl  = $state<HTMLInputElement | null>(null)

  type StatusPhase = 'waiting' | 'validating' | 'open'
  let statusPhase = $state<StatusPhase>('waiting')

  const statusLabels: Record<StatusPhase, string> = {
    waiting:    'Scan tiket atau tempel kartu',
    validating: 'Proses validasi LPR, mohon tunggu...',
    open:       'Silahkan masuk',
  }

  let idleTimer: ReturnType<typeof setTimeout> | null = null

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => goto(`/kiosk/${gateId}`, { replaceState: true }), 60_000)
  }

  onMount(() => {
    resetIdleTimer()
    inputEl?.focus()
  })

  onDestroy(() => { if (idleTimer) clearTimeout(idleTimer) })

  $effect(() => {
    if ((step === 'idle' || step === 'error') && inputEl) inputEl.focus()
  })

  async function lookup() {
    const value = inputVal.trim()
    if (!value || step !== 'idle') return

    step = 'loading-lookup'
    statusPhase = 'validating'
    resetIdleTimer()

    try {
      tx = await getTransactionByCode(value)
      step = 'confirm'
      resetIdleTimer()
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Transaksi tidak ditemukan.'
      step = 'error'
      statusPhase = 'waiting'
      resetIdleTimer()
    }
  }

  async function confirmExit() {
    if (!tx || !gate) return

    step = 'loading-exit'
    statusPhase = 'validating'
    resetIdleTimer()

    try {
      const form = new FormData()
      form.append('exit_gate_id', gate.id)
      form.append('exit_method', 'qr')
      const updated = await recordExit(tx.id, form)
      statusPhase = 'open'
      await new Promise(r => setTimeout(r, 600))
      goto(`/kiosk/${gateId}/payment?tx_id=${updated.id}`, { replaceState: true })
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Gagal memproses keluar.'
      step = 'error'
      statusPhase = 'waiting'
      resetIdleTimer()
    }
  }

  function retry() {
    inputVal    = ''
    tx          = null
    errorMsg    = ''
    step        = 'idle'
    statusPhase = 'waiting'
    resetIdleTimer()
  }

  const durationMinutes = $derived(
    tx?.entry_at ? Math.ceil((Date.now() - new Date(tx.entry_at).getTime()) / 60_000) : 0
  )

  const entryPlate = $derived(
    tx?.ocr?.find(o => o.photo_type === 'entry')?.actual_plate ?? null
  )
</script>

<svelte:window onkeydown={() => resetIdleTimer()} />

<div class="flex h-screen flex-col bg-white text-slate-900 select-none">

  <!-- Header -->
  <div class="flex items-center justify-between border-b border-slate-200 px-8 py-3">
    <div>
      <p class="text-xs text-slate-400 uppercase tracking-widest">{gate?.zone_name ?? '—'}</p>
      <p class="text-sm font-semibold text-slate-700">{gate?.name ?? '—'}</p>
    </div>
    <p class="font-mono text-xs text-slate-400">Gerbang Keluar</p>
  </div>

  <!-- Main -->
  <div class="flex flex-1 flex-col items-center justify-center gap-8 px-8">

    {#if step === 'idle' || step === 'error'}

      <p class="text-2xl font-light text-slate-700 text-center">
        Silahkan cetak tiket atau tempelkan kartu
      </p>

      <!-- Input visible — hasil RFID reader (HID keyboard) masuk sini -->
      <div class="w-full max-w-lg">
        <input
          bind:this={inputEl}
          bind:value={inputVal}
          onkeydown={(e) => { resetIdleTimer(); if (e.key === 'Enter') lookup() }}
          placeholder="Scan tiket atau tempel kartu..."
          class="w-full rounded border border-slate-300 bg-white px-5 py-3.5
            font-mono text-base text-slate-700 outline-none text-center
            placeholder:text-slate-300 focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
          autocomplete="off"
        />
      </div>

      {#if step === 'error'}
        <div class="flex items-center gap-2 text-red-500">
          <AlertCircle size={16} strokeWidth={1.5} />
          <p class="text-sm">{errorMsg}</p>
        </div>
        <button
          onclick={retry}
          class="rounded border border-slate-300 px-6 py-2 text-sm text-slate-600
            hover:bg-slate-50 active:scale-95 transition-colors"
        >
          Coba Lagi
        </button>
      {:else if inputVal.trim()}
        <button
          onclick={lookup}
          class="rounded bg-brand-500 px-10 py-3 text-sm font-semibold text-white
            hover:bg-brand-600 active:scale-95 transition-colors"
        >
          Cari Transaksi
        </button>
      {/if}

    {:else if step === 'loading-lookup' || step === 'loading-exit'}

      <Loader size={36} strokeWidth={1.5} class="animate-spin text-brand-500" />
      <p class="text-sm text-slate-500">{statusLabels.validating}</p>

    {:else if step === 'confirm' && tx}

      <!-- Confirm panel — split dua kolom sesuai wireframe gambar 3 -->
      <div class="w-full max-w-2xl rounded border border-slate-200 shadow-sm overflow-hidden">
        <div class="grid grid-cols-2 divide-x divide-slate-200">

          <!-- Kiri: durasi + tipe + total -->
          <div class="flex flex-col justify-between p-8 gap-4 bg-white">
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

      <div class="flex gap-4">
        <button
          onclick={retry}
          class="rounded border border-slate-300 px-6 py-2.5 text-sm text-slate-600
            hover:bg-slate-50 active:scale-95 transition-colors"
        >
          Batal
        </button>
        <button
          onclick={confirmExit}
          class="rounded bg-brand-500 px-10 py-2.5 text-sm font-semibold text-white
            hover:bg-brand-600 active:scale-95 transition-colors"
        >
          Lanjut Bayar
        </button>
      </div>

    {/if}

  </div>

  <!-- Status footer -->
  <div class="border-t border-slate-200 bg-slate-50 px-8 py-3">
    <p class="text-center text-xs text-slate-500">{statusLabels[statusPhase]}</p>
  </div>

</div>
