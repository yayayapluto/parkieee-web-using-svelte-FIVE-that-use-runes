<script lang="ts">
  import { onMount } from 'svelte'
  import { api } from '$lib/api/client'
  import type { ApiResponse, PaginatedResponse } from '$lib/types/api'
  import type { Transaction } from '$lib/types/domain.d'
  import { FlaskConical, RefreshCw, Clock, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-svelte'

  // ── State ──────────────────────────────────────────────────────────────────
  let transactions  = $state<Transaction[]>([])
  let selectedTxId  = $state('')
  let minutesAgo    = $state(60)
  let loading       = $state(false)
  let fetching      = $state(false)
  let successMsg    = $state('')
  let errorMsg      = $state('')

  const selectedTx  = $derived(transactions.find(t => t.id === selectedTxId) ?? null)

  // ── API ────────────────────────────────────────────────────────────────────
  async function fetchOpenTransactions() {
    fetching = true
    try {
      const res = await api.get<PaginatedResponse<Transaction>>('/api/v1/gate/transactions?status=open&page_size=100')
      transactions = res.data.data ?? []
      if (transactions.length > 0 && !selectedTxId) {
        selectedTxId = transactions[0].id
      }
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Gagal memuat transaksi'
    } finally {
      fetching = false
    }
  }

  async function simulate() {
    if (!selectedTxId || minutesAgo <= 0) return
    loading = true; successMsg = ''; errorMsg = ''
    try {
      await api.patch(`/api/v1/gate/transactions/${selectedTxId}/simulate`, { minutes_ago: minutesAgo })
      successMsg = `entry_at berhasil di-backdate ${minutesAgo} menit yang lalu`
      await fetchOpenTransactions()
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Gagal simulasi'
    } finally {
      loading = false
    }
  }

  // ── Utils ──────────────────────────────────────────────────────────────────
  function formatDT(iso: string) {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  function durationLabel(mins: number): string {
    if (mins < 60) return `${mins} menit`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h} jam ${m} menit` : `${h} jam`
  }

  // Presets durasi
  const presets = [5, 15, 30, 60, 90, 120, 180, 360, 720, 1440]

  onMount(() => fetchOpenTransactions())
</script>

<div class="min-h-screen bg-gray-950 text-gray-100 font-mono p-6 flex flex-col gap-6">

  <!-- Header -->
  <div class="flex items-center justify-between border-b border-gray-800 pb-4">
    <div class="flex items-center gap-3">
      <FlaskConical size={24} class="text-amber-400" />
      <div>
        <h1 class="text-lg font-bold tracking-widest uppercase text-amber-400">Simulation Panel</h1>
        <p class="text-xs text-gray-500 tracking-wider">Backdate entry_at transaksi open — dev only</p>
      </div>
    </div>
    <button
      onclick={fetchOpenTransactions}
      disabled={fetching}
      class="flex items-center gap-2 px-3 py-1.5 border border-gray-700 text-gray-400 text-xs tracking-wider hover:border-gray-500 hover:text-gray-200 transition-colors cursor-pointer disabled:opacity-40"
    >
      <RefreshCw size={12} class={fetching ? 'animate-spin' : ''} />
      REFRESH
    </button>
  </div>

  <!-- Main layout: 2 kolom -->
  <div class="flex gap-6 flex-1">

    <!-- Kiri: Daftar transaksi open -->
    <div class="w-[420px] flex flex-col gap-3 shrink-0">
      <div class="flex items-center gap-2 text-xs text-gray-500 tracking-widest uppercase">
        <span>Transaksi Open</span>
        <span class="bg-gray-800 text-amber-400 px-1.5 py-px text-[10px]">{transactions.length}</span>
      </div>

      {#if fetching}
        <div class="flex items-center gap-2 text-gray-600 text-xs py-8 justify-center">
          <RefreshCw size={14} class="animate-spin" />
          <span>Memuat...</span>
        </div>
      {:else if transactions.length === 0}
        <div class="text-gray-600 text-xs py-8 text-center">Tidak ada transaksi open</div>
      {:else}
        <div class="flex flex-col gap-1 max-h-[560px] overflow-y-auto pr-1">
          {#each transactions as tx}
            <button
              onclick={() => { selectedTxId = tx.id; successMsg = ''; errorMsg = '' }}
              class="text-left px-4 py-3 border transition-all cursor-pointer {selectedTxId === tx.id
                ? 'border-amber-500 bg-amber-500/10 text-amber-100'
                : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-600 hover:text-gray-200'}"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold tracking-wider {selectedTxId === tx.id ? 'text-amber-300' : 'text-gray-300'}">
                  {tx.transaction_code}
                </span>
                <span class="text-[10px] tracking-wider {tx.entry_method === 'rfid' ? 'text-blue-400' : 'text-green-400'}">
                  {tx.entry_method.toUpperCase()}
                </span>
              </div>
              <div class="text-[11px] text-gray-600">{formatDT(tx.entry_at)}</div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Kanan: Control panel -->
    <div class="flex-1 flex flex-col gap-5">

      <!-- Selected transaction info -->
      {#if selectedTx}
        <div class="border border-gray-800 bg-gray-900 p-4 flex flex-col gap-2">
          <div class="text-[10px] text-gray-600 tracking-widest uppercase mb-1">Transaksi Dipilih</div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div class="text-gray-500">Kode</div>
            <div class="text-gray-100 font-bold">{selectedTx.transaction_code}</div>
            <div class="text-gray-500">Entry Method</div>
            <div class="text-gray-100">{selectedTx.entry_method.toUpperCase()}</div>
            <div class="text-gray-500">Entry At (sekarang)</div>
            <div class="text-amber-300">{formatDT(selectedTx.entry_at)}</div>
            <div class="text-gray-500">Status</div>
            <div class="text-gray-100">{selectedTx.status}</div>
          </div>
        </div>
      {:else}
        <div class="border border-dashed border-gray-800 p-4 text-gray-700 text-xs text-center">
          Pilih transaksi dari daftar kiri
        </div>
      {/if}

      <!-- Set durasi -->
      <div class="border border-gray-800 bg-gray-900 p-4 flex flex-col gap-4">
        <div class="text-[10px] text-gray-500 tracking-widest uppercase">Set Durasi Parkir (Mundurkan entry_at)</div>

        <!-- Preset buttons -->
        <div class="flex flex-wrap gap-2">
          {#each presets as p}
            <button
              onclick={() => minutesAgo = p}
              class="px-3 py-1.5 text-[11px] tracking-wider border transition-colors cursor-pointer {minutesAgo === p
                ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'}"
            >
              {durationLabel(p)}
            </button>
          {/each}
        </div>

        <!-- Custom input -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 border border-gray-700 bg-gray-950 px-3 py-2 flex-1">
            <Clock size={14} class="text-gray-600 shrink-0" />
            <input
              type="number"
              bind:value={minutesAgo}
              min="1"
              max="99999"
              class="bg-transparent text-gray-100 text-sm w-full outline-none tabular-nums"
              placeholder="menit custom"
            />
            <span class="text-gray-600 text-xs shrink-0">menit</span>
          </div>
          <span class="text-gray-600 text-xs shrink-0">= {durationLabel(minutesAgo)}</span>
        </div>

        <!-- Preview -->
        {#if selectedTx && minutesAgo > 0}
          <div class="bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs flex items-center justify-between">
            <span class="text-gray-600">entry_at akan diset ke</span>
            <span class="text-amber-300 font-bold">
              {new Date(Date.now() - minutesAgo * 60_000).toLocaleString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              })}
            </span>
          </div>
        {/if}
      </div>

      <!-- Feedback -->
      {#if successMsg}
        <div class="flex items-center gap-3 border border-green-800 bg-green-950/40 px-4 py-3 text-green-400 text-xs">
          <CheckCircle2 size={16} class="shrink-0" />
          {successMsg}
        </div>
      {/if}
      {#if errorMsg}
        <div class="flex items-center gap-3 border border-red-800 bg-red-950/40 px-4 py-3 text-red-400 text-xs">
          <AlertCircle size={16} class="shrink-0" />
          {errorMsg}
        </div>
      {/if}

      <!-- Tombol eksekusi -->
      <button
        onclick={simulate}
        disabled={!selectedTxId || minutesAgo <= 0 || loading}
        class="flex items-center justify-center gap-3 py-4 border text-sm font-bold tracking-widest uppercase transition-all cursor-pointer
          {!selectedTxId || minutesAgo <= 0
            ? 'border-gray-800 text-gray-700 cursor-not-allowed'
            : loading
              ? 'border-amber-700 bg-amber-900/30 text-amber-500 cursor-wait'
              : 'border-amber-500 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'}"
      >
        {#if loading}
          <RefreshCw size={16} class="animate-spin" />
          Memproses...
        {:else}
          <FlaskConical size={16} />
          Set entry_at → {durationLabel(minutesAgo)} yang lalu
        {/if}
      </button>

    </div>
  </div>

</div>
