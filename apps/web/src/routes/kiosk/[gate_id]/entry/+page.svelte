<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { getGateInfo } from '$lib/utils/auth'
  import { recordEntry } from '$lib/api/transactions'
  import { getFeeConfigs } from '$lib/api/fees'
  import { getVehicleTypes } from '$lib/api/vehicles'
  import { formatCurrency } from '$lib/utils/format'
  import { Printer, HelpCircle, AlertCircle, Loader } from 'lucide-svelte'
  import type { FeeConfig, VehicleType } from '$lib/types/domain'

  const gateId = $page.params.gate_id
  const gate   = getGateInfo()

  type Step = 'idle' | 'loading' | 'error'

  let step         = $state<Step>('idle')
  let rfidInput    = $state('')
  let errorMsg     = $state('')
  let rfidEl       = $state<HTMLInputElement | null>(null)
  let feeConfigs   = $state<FeeConfig[]>([])
  let vehicleTypes = $state<VehicleType[]>([])
  let statusMsg    = $state('Scan tiket atau tempel kartu')

  function refocus() { rfidEl?.focus() }

  let idleTimer: ReturnType<typeof setTimeout> | null = null

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => goto(`/kiosk/${gateId}`, { replaceState: true }), 60_000)
  }

  onMount(async () => {
    resetIdleTimer()
    refocus()
    if (gate) {
      try {
        const [feesRes, typesRes] = await Promise.all([
          getFeeConfigs({ zone_id: gate.zone_id, active: true }),
          getVehicleTypes(),
        ])
        feeConfigs   = feesRes.data
        vehicleTypes = typesRes
      } catch {
        // tampilkan tanpa tarif kalau gagal fetch
      }
    }
  })

  onDestroy(() => { if (idleTimer) clearTimeout(idleTimer) })

  function getTypeName(id: string): string {
    return vehicleTypes.find(t => t.id === id)?.name ?? '—'
  }

  function getTier1(cfg: FeeConfig): string {
    if (cfg.tiers && cfg.tiers.length > 0) return formatCurrency(cfg.tiers[0].fee_amount)
    return formatCurrency(cfg.base_fee)
  }

  function getTier2(cfg: FeeConfig): string {
    if (cfg.tiers && cfg.tiers.length > 1) return formatCurrency(cfg.tiers[1].fee_amount)
    return formatCurrency(cfg.base_fee)
  }

  async function doCetakTiket() {
    if (!gate || step === 'loading') return
    step = 'loading'
    statusMsg = 'Memproses tiket...'
    resetIdleTimer()
    try {
      const form = new FormData()
      form.append('entry_gate_id', gate.id)
      form.append('entry_method', 'qr')
      const tx = await recordEntry(form)
      statusMsg = 'Proses validasi LPR, mohon tunggu...'
      await new Promise(r => setTimeout(r, 800))
      statusMsg = 'Silahkan masuk'
      const img = tx.entry_qr_code_image ?? ''
      goto(`/kiosk/${gateId}/success?code=${tx.transaction_code}&type=entry&img=${encodeURIComponent(img)}`, { replaceState: true })
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Gagal mencetak tiket.'
      step = 'error'
      statusMsg = 'Scan tiket atau tempel kartu'
      resetIdleTimer()
    }
  }

  async function doRFIDEntry(uid: string) {
    if (!gate || step === 'loading') return
    step = 'loading'
    statusMsg = 'Membaca kartu...'
    resetIdleTimer()
    try {
      const form = new FormData()
      form.append('entry_gate_id', gate.id)
      form.append('entry_method', 'rfid')
      form.append('rfid_card_uid', uid)
      const tx = await recordEntry(form)
      statusMsg = 'Proses validasi LPR, mohon tunggu...'
      await new Promise(r => setTimeout(r, 800))
      statusMsg = 'Silahkan masuk'
      goto(`/kiosk/${gateId}/success?code=${tx.transaction_code}&type=entry`, { replaceState: true })
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Kartu tidak dikenali atau sudah aktif.'
      rfidInput = ''
      step = 'error'
      statusMsg = 'Scan tiket atau tempel kartu'
      resetIdleTimer()
    }
  }

  function handleRFIDKey(e: KeyboardEvent) {
    resetIdleTimer()
    if (e.key === 'Enter' && rfidInput.trim()) {
      doRFIDEntry(rfidInput.trim())
    }
  }

  function retry() {
    errorMsg  = ''
    rfidInput = ''
    step      = 'idle'
    statusMsg = 'Scan tiket atau tempel kartu'
    resetIdleTimer()
    refocus()
  }
</script>

<svelte:window onclick={refocus} onkeydown={() => resetIdleTimer()} />

<!-- RFID reader input — selalu aktif -->
<input
  bind:this={rfidEl}
  bind:value={rfidInput}
  onkeydown={handleRFIDKey}
  onblur={refocus}
  class="fixed opacity-0 pointer-events-none w-0 h-0"
  autocomplete="off"
  tabindex="-1"
/>

<div class="flex h-screen flex-col bg-white text-slate-900 select-none">

  <!-- Header tipis -->
  <div class="flex items-center justify-between border-b border-slate-200 px-8 py-3">
    <div>
      <p class="text-xs text-slate-400 uppercase tracking-widest">{gate?.zone_name ?? '—'}</p>
      <p class="text-sm font-semibold text-slate-700">{gate?.name ?? '—'}</p>
    </div>
    <p class="font-mono text-xs text-slate-400">
      {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
    </p>
  </div>

  <!-- Main -->
  <div class="flex flex-1 flex-col gap-6 px-8 py-6">

    {#if step === 'error'}
      <!-- Error state -->
      <div class="flex flex-1 flex-col items-center justify-center gap-4">
        <AlertCircle size={48} strokeWidth={1.25} class="text-red-500" />
        <p class="text-lg font-semibold text-red-600">Gagal</p>
        <p class="text-sm text-slate-500 text-center max-w-xs">{errorMsg}</p>
        <button
          onclick={retry}
          class="mt-2 rounded border border-slate-300 px-8 py-2.5 text-sm font-medium
            text-slate-700 hover:bg-slate-50 active:scale-95 transition-colors"
        >
          Coba Lagi
        </button>
      </div>

    {:else if step === 'loading'}
      <!-- Loading state -->
      <div class="flex flex-1 flex-col items-center justify-center gap-4">
        <Loader size={36} strokeWidth={1.5} class="animate-spin text-brand-500" />
        <p class="text-sm text-slate-500">{statusMsg}</p>
      </div>

    {:else}
      <!-- Tabel tarif atas -->
      <div class="rounded border border-slate-200 bg-slate-50 p-5">
        {#if feeConfigs.length === 0}
          <p class="text-center text-sm text-slate-400">Memuat informasi tarif...</p>
        {:else}
          <div class="grid gap-6" style="grid-template-columns: repeat({feeConfigs.length}, 1fr)">
            {#each feeConfigs as cfg}
              <div>
                <p class="text-sm font-semibold text-slate-700 mb-3">
                  Tarif Parkir {getTypeName(cfg.vehicle_type_id)}
                </p>
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

      <!-- Area bawah: tombol kiri + RFID kanan -->
      <div class="flex flex-1 gap-6 items-stretch">

        <!-- Tombol-tombol kiri -->
        <div class="flex flex-col gap-4 justify-center">
          <button
            onclick={doCetakTiket}
            class="flex h-28 w-36 flex-col items-center justify-center gap-3 rounded-xl
              border-2 border-brand-500 bg-brand-50 text-brand-600 font-semibold
              hover:bg-brand-100 active:scale-95 transition-all shadow-sm"
          >
            <Printer size={36} strokeWidth={1.5} />
            <span class="text-sm">Cetak Tiket</span>
          </button>

          <button
            onclick={() => { statusMsg = 'Hubungi petugas untuk bantuan.'; resetIdleTimer() }}
            class="flex h-28 w-36 flex-col items-center justify-center gap-3 rounded-xl
              border-2 border-red-400 bg-red-50 text-red-600 font-semibold
              hover:bg-red-100 active:scale-95 transition-all shadow-sm"
          >
            <HelpCircle size={36} strokeWidth={1.5} />
            <span class="text-sm">Bantuan</span>
          </button>
        </div>

        <!-- Area RFID kanan -->
        <div class="flex flex-1 flex-col justify-center rounded-xl border-2 border-slate-200 bg-slate-50 px-8 py-6 gap-3">
          <p class="text-sm font-semibold text-slate-600">Tempel kartu di samping</p>
          <div class="rounded border border-slate-300 bg-white px-4 py-3 min-h-[3rem] flex items-center">
            {#if rfidInput}
              <p class="font-mono text-sm text-slate-700">{rfidInput}</p>
            {:else}
              <p class="font-mono text-sm text-slate-300">Menunggu kartu...</p>
            {/if}
          </div>
          <p class="text-xs text-slate-400">
            Tempelkan kartu member atau kartu prepaid ke reader
          </p>
        </div>

      </div>
    {/if}
  </div>

  <!-- Status footer -->
  <div class="border-t border-slate-200 bg-slate-50 px-8 py-3">
    <p class="text-center text-xs text-slate-500">{statusMsg}</p>
  </div>

</div>
