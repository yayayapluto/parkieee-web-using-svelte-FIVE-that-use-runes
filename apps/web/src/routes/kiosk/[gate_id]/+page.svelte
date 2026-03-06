<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { page } from '$app/stores'
  import { getGateInfo } from '$lib/utils/auth'
  import { recordEntry, getTransactionByCode, recordExit } from '$lib/api/transactions'
  import { getFeeConfigs } from '$lib/api/fees'
  import { getVehicleTypes } from '$lib/api/vehicles'
  import { formatCurrency, formatDurationMinutes } from '$lib/utils/format'
  import { Printer, HelpCircle, AlertCircle, Loader } from 'lucide-svelte'
  import type { FeeConfig, VehicleType, Transaction } from '$lib/types/domain'

  const gateId   = $page.params.gate_id
  const gate     = getGateInfo()
  const isEntry  = gate?.gate_type === 'entry'

  // ── shared state ──
  type Step = 'idle' | 'loading' | 'confirm' | 'error'
  let step     = $state<Step>('idle')
  let errorMsg = $state('')

  let idleTimer: ReturnType<typeof setTimeout> | null = null
  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => window.location.reload(), 60_000)
  }

  onMount(() => { resetIdleTimer() })
  onDestroy(() => { if (idleTimer) clearTimeout(idleTimer) })

  // ── ENTRY state ──
  let rfidInput    = $state('')
  let rfidEl       = $state<HTMLInputElement | null>(null)
  let feeConfigs   = $state<FeeConfig[]>([])
  let vehicleTypes = $state<VehicleType[]>([])
  let entryStatus  = $state('Silakan cetak tiket atau tempelkan kartu')

  function refocus() { if (isEntry) rfidEl?.focus() }

  onMount(async () => {
    if (!isEntry || !gate) return
    refocus()
    try {
      const [feesRes, typesRes] = await Promise.all([
        getFeeConfigs({ zone_id: gate.zone_id, active: true }),
        getVehicleTypes(),
      ])
      feeConfigs   = feesRes.data
      vehicleTypes = typesRes
    } catch { /* lanjut tanpa tarif */ }
  })

  function getTypeName(id: string) {
    return vehicleTypes.find(t => t.id === id)?.name ?? '—'
  }
  function getTier1(cfg: FeeConfig) {
    return cfg.tiers?.length ? formatCurrency(cfg.tiers[0].fee_amount) : formatCurrency(cfg.base_fee)
  }
  function getTier2(cfg: FeeConfig) {
    return cfg.tiers?.length > 1 ? formatCurrency(cfg.tiers[1].fee_amount) : formatCurrency(cfg.base_fee)
  }

  async function doCetakTiket() {
    if (!gate || step === 'loading') return
    step = 'loading'; entryStatus = 'Memproses tiket...'; resetIdleTimer()
    try {
      const form = new FormData()
      form.append('entry_gate_id', gate.id)
      form.append('entry_method', 'qr')
      const tx = await recordEntry(form)
      entryStatus = 'Proses validasi LPR, mohon tunggu...'
      await new Promise(r => setTimeout(r, 800))
      const img = tx.entry_qr_code_image ?? ''
      window.location.href = `/kiosk/${gateId}/success?code=${tx.transaction_code}&type=entry&img=${encodeURIComponent(img)}`
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Gagal mencetak tiket.'
      step = 'error'; entryStatus = 'Silakan cetak tiket atau tempelkan kartu'; resetIdleTimer()
    }
  }

  async function doRFIDEntry(uid: string) {
    if (!gate || step === 'loading') return
    step = 'loading'; entryStatus = 'Membaca kartu...'; resetIdleTimer()
    try {
      const form = new FormData()
      form.append('entry_gate_id', gate.id)
      form.append('entry_method', 'rfid')
      form.append('rfid_card_uid', uid)
      const tx = await recordEntry(form)
      entryStatus = 'Proses validasi LPR, mohon tunggu...'
      await new Promise(r => setTimeout(r, 800))
      window.location.href = `/kiosk/${gateId}/success?code=${tx.transaction_code}&type=entry`
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Kartu tidak dikenali atau sudah aktif.'
      rfidInput = ''; step = 'error'; entryStatus = 'Silakan cetak tiket atau tempelkan kartu'; resetIdleTimer()
    }
  }

  function handleRFIDKey(e: KeyboardEvent) {
    resetIdleTimer()
    if (e.key === 'Enter' && rfidInput.trim()) doRFIDEntry(rfidInput.trim())
  }

  // ── EXIT state ──
  let exitInput   = $state('')
  let exitInputEl = $state<HTMLInputElement | null>(null)
  let tx          = $state<Transaction | null>(null)

  type ExitStatus = 'waiting' | 'validating' | 'open'
  let exitStatus = $state<ExitStatus>('waiting')
  const exitStatusLabels: Record<ExitStatus, string> = {
    waiting:    'Scan tiket atau tempel kartu',
    validating: 'Proses validasi LPR, mohon tunggu...',
    open:       'Silahkan keluar',
  }

  onMount(() => { if (!isEntry) exitInputEl?.focus() })

  $effect(() => {
    if (!isEntry && (step === 'idle' || step === 'error') && exitInputEl) exitInputEl.focus()
  })

  const durationMinutes = $derived(
    tx?.entry_at ? Math.ceil((Date.now() - new Date(tx.entry_at).getTime()) / 60_000) : 0
  )
  const entryPlate = $derived(
    tx?.ocr?.find((o: { photo_type: string }) => o.photo_type === 'entry')?.actual_plate ?? null
  )

  async function doExitLookup() {
    const value = exitInput.trim()
    if (!value || step !== 'idle') return
    step = 'loading'; exitStatus = 'validating'; resetIdleTimer()
    try {
      tx = await getTransactionByCode(value)
      step = 'confirm'; resetIdleTimer()
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Transaksi tidak ditemukan.'
      step = 'error'; exitStatus = 'waiting'; resetIdleTimer()
    }
  }

  async function confirmExit() {
    if (!tx || !gate) return
    step = 'loading'; exitStatus = 'validating'; resetIdleTimer()
    try {
      const form = new FormData()
      form.append('exit_gate_id', gate.id)
      form.append('exit_method', 'qr')
      const updated = await recordExit(tx.id, form)
      exitStatus = 'open'
      await new Promise(r => setTimeout(r, 600))
      window.location.href = `/kiosk/${gateId}/payment?tx_id=${updated.id}`
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Gagal memproses keluar.'
      step = 'error'; exitStatus = 'waiting'; resetIdleTimer()
    }
  }

  function retryEntry() {
    errorMsg = ''; rfidInput = ''; step = 'idle'
    entryStatus = 'Silakan cetak tiket atau tempelkan kartu'
    resetIdleTimer(); refocus()
  }

  function retryExit() {
    errorMsg = ''; exitInput = ''; tx = null; step = 'idle'
    exitStatus = 'waiting'; resetIdleTimer()
  }
</script>

<svelte:window
  onclick={() => { if (isEntry) refocus() }}
  onkeydown={() => resetIdleTimer()}
/>

{#if isEntry}
  <input
    bind:this={rfidEl}
    bind:value={rfidInput}
    onkeydown={handleRFIDKey}
    onblur={refocus}
    class="fixed opacity-0 pointer-events-none w-0 h-0"
    autocomplete="off"
    tabindex="-1"
  />
{/if}

<div class="flex h-screen flex-col bg-white text-slate-900 select-none">

  <!-- Header -->
  <div class="flex items-center justify-between border-b border-slate-200 px-8 py-3">
    <div>
      <p class="text-xs text-slate-400 uppercase tracking-widest">{gate?.zone_name ?? '—'}</p>
      <p class="text-sm font-semibold text-slate-700">{gate?.name ?? '—'}</p>
    </div>
    <div class="flex items-center gap-4">
      <p class="font-mono text-xs text-slate-400">
        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  </div>

  <!-- ══ ENTRY ══ -->
  {#if isEntry}
    <div class="flex flex-1 flex-col gap-6 px-8 py-6">

      {#if step === 'error'}
        <div class="flex flex-1 flex-col items-center justify-center gap-4">
          <AlertCircle size={48} strokeWidth={1.25} class="text-red-500" />
          <p class="text-lg font-semibold text-red-600">Gagal</p>
          <p class="text-sm text-slate-500 text-center max-w-xs">{errorMsg}</p>
          <button onclick={retryEntry}
            class="mt-2 rounded border border-slate-300 px-8 py-2.5 text-sm font-medium
              text-slate-700 hover:bg-slate-50 active:scale-95 transition-colors">
            Coba Lagi
          </button>
        </div>

      {:else if step === 'loading'}
        <div class="flex flex-1 flex-col items-center justify-center gap-4">
          <Loader size={36} strokeWidth={1.5} class="animate-spin text-brand-500" />
          <p class="text-sm text-slate-500">{entryStatus}</p>
        </div>

      {:else}
        <!-- Tabel tarif -->
        <div class="rounded border border-slate-200 bg-slate-50 p-5">
          {#if feeConfigs.length === 0}
            <p class="text-center text-sm text-slate-400">Memuat informasi tarif...</p>
          {:else}
            <div class="grid gap-8" style="grid-template-columns: repeat({feeConfigs.length}, 1fr)">
              {#each feeConfigs as cfg}
                <div>
                  <p class="text-sm font-semibold text-slate-700 mb-3">Tarif Parkir {getTypeName(cfg.vehicle_type_id)}</p>
                  <table class="w-full text-sm">
                    <tbody>
                      <tr>
                        <td class="py-1 text-slate-500">Jam pertama</td>
                        <td class="py-1 text-right font-mono font-semibold text-slate-800">{getTier1(cfg)}</td>
                      </tr>
                      <tr>
                        <td class="py-1 text-slate-500">Jam berikutnya</td>
                        <td class="py-1 text-right font-mono font-semibold text-slate-800">{getTier2(cfg)}</td>
                      </tr>
                      {#if cfg.grace_period_minutes > 0}
                        <tr>
                          <td class="pt-2 text-xs text-slate-400 italic" colspan="2">
                            Gratis {cfg.grace_period_minutes} menit pertama
                          </td>
                        </tr>
                      {/if}
                    </tbody>
                  </table>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Tombol + RFID -->
        <div class="flex flex-1 gap-6 items-stretch">
          <div class="flex flex-col gap-4 justify-center">
            <button onclick={doCetakTiket}
              class="flex h-28 w-36 flex-col items-center justify-center gap-3 rounded-xl
                border-2 border-brand-500 bg-brand-50 text-brand-600 font-semibold
                hover:bg-brand-100 active:scale-95 transition-all shadow-sm">
              <Printer size={36} strokeWidth={1.5} />
              <span class="text-sm">Cetak Tiket</span>
            </button>
            <button onclick={() => { entryStatus = 'Hubungi petugas untuk bantuan.'; resetIdleTimer() }}
              class="flex h-28 w-36 flex-col items-center justify-center gap-3 rounded-xl
                border-2 border-red-400 bg-red-50 text-red-600 font-semibold
                hover:bg-red-100 active:scale-95 transition-all shadow-sm">
              <HelpCircle size={36} strokeWidth={1.5} />
              <span class="text-sm">Bantuan</span>
            </button>
          </div>

          <div class="flex flex-1 flex-col justify-center rounded-xl border-2 border-slate-200 bg-slate-50 px-8 py-6 gap-3">
            <p class="text-sm font-semibold text-slate-600">Tempel kartu di samping</p>
            <div class="rounded border border-slate-300 bg-white px-4 py-3 min-h-[3rem] flex items-center">
              {#if rfidInput}
                <p class="font-mono text-sm text-slate-700">{rfidInput}</p>
              {:else}
                <p class="font-mono text-sm text-slate-300">Menunggu kartu...</p>
              {/if}
            </div>
            <p class="text-xs text-slate-400">Tempelkan kartu member atau kartu prepaid ke reader</p>
          </div>
        </div>
      {/if}

    </div>

    <div class="border-t border-slate-200 bg-slate-50 px-8 py-3">
      <p class="text-center text-xs text-slate-500">{entryStatus}</p>
    </div>

  <!-- ══ EXIT ══ -->
  {:else}
    <div class="flex flex-1 flex-col items-center justify-center gap-8 px-8">

      {#if step === 'idle' || step === 'error'}
        <p class="text-2xl font-light text-slate-700 text-center">
          Silahkan cetak tiket atau tempelkan kartu
        </p>

        <div class="w-full max-w-lg">
          <input
            bind:this={exitInputEl}
            bind:value={exitInput}
            onkeydown={(e) => { resetIdleTimer(); if (e.key === 'Enter') doExitLookup() }}
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
          <button onclick={retryExit}
            class="rounded border border-slate-300 px-6 py-2 text-sm text-slate-600
              hover:bg-slate-50 active:scale-95 transition-colors">
            Coba Lagi
          </button>
        {:else if exitInput.trim()}
          <button onclick={doExitLookup}
            class="rounded bg-brand-500 px-10 py-3 text-sm font-semibold text-white
              hover:bg-brand-600 active:scale-95 transition-colors">
            Cari Transaksi
          </button>
        {/if}

      {:else if step === 'loading'}
        <Loader size={36} strokeWidth={1.5} class="animate-spin text-brand-500" />
        <p class="text-sm text-slate-500">{exitStatusLabels.validating}</p>

      {:else if step === 'confirm' && tx}
        <div class="w-full max-w-2xl rounded border border-slate-200 shadow-sm overflow-hidden">
          <div class="grid grid-cols-2 divide-x divide-slate-200">
            <div class="flex flex-col justify-between p-8 gap-4">
              <div class="space-y-2">
                <p class="font-mono text-2xl font-light text-slate-800">{formatDurationMinutes(durationMinutes)}</p>
                <p class="text-sm text-slate-500">Hari Biasa</p>
              </div>
              <p class="font-mono text-3xl font-bold text-slate-900">
                {tx.calculated_fee != null ? formatCurrency(tx.calculated_fee) : '—'}
              </p>
            </div>
            <div class="flex flex-col divide-y divide-slate-200">
              <div class="flex flex-col gap-1 p-6">
                <p class="text-xs text-slate-400 uppercase tracking-wide">Nomor Polisi</p>
                <p class="font-mono text-2xl font-bold text-slate-800 uppercase">{entryPlate ?? '—'}</p>
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
          <button onclick={retryExit}
            class="rounded border border-slate-300 px-6 py-2.5 text-sm text-slate-600
              hover:bg-slate-50 active:scale-95 transition-colors">
            Batal
          </button>
          <button onclick={confirmExit}
            class="rounded bg-brand-500 px-10 py-2.5 text-sm font-semibold text-white
              hover:bg-brand-600 active:scale-95 transition-colors">
            Lanjut Bayar
          </button>
        </div>
      {/if}

    </div>

    <div class="border-t border-slate-200 bg-slate-50 px-8 py-3">
      <p class="text-center text-xs text-slate-500">{exitStatusLabels[exitStatus]}</p>
    </div>
  {/if}

</div>
