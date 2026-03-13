<script lang="ts">
  import { onMount } from 'svelte'
  import { api } from '$lib/api/client'
  import type { PaginatedResponse } from '$lib/types/api'
  import type { Transaction } from '$lib/types/domain.d'

  let transactions  = $state<Transaction[]>([])
  let selectedTxId  = $state('')
  let minutesAgo    = $state(60)
  let loading       = $state(false)
  let fetching      = $state(false)
  let successMsg    = $state('')
  let errorMsg      = $state('')

  const selectedTx  = $derived(transactions.find(t => t.id === selectedTxId) ?? null)

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
      successMsg = `entry_at berhasil di-backdate ${minutesAgo} menit`
      await fetchOpenTransactions()
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Gagal simulasi'
    } finally {
      loading = false
    }
  }

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
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  const presets = [5, 15, 30, 60, 90, 120, 180, 360, 720, 1440]

  onMount(() => fetchOpenTransactions())
</script>

<div class="min-h-screen bg-white p-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-2">Simulasi Entry Time</h1>
    <p class="text-gray-600 mb-8">Mundurkan entry_at transaksi untuk testing</p>

    <div class="grid grid-cols-2 gap-8">
      <!-- Left: Transaction List -->
      <div>
        <h2 class="text-lg font-semibold mb-3 flex items-center justify-between">
          Open Transactions
          <span class="text-sm font-normal text-gray-500">({transactions.length})</span>
        </h2>
        
        {#if fetching}
          <div class="text-gray-500 text-sm py-4">Loading...</div>
        {:else if transactions.length === 0}
          <div class="text-gray-500 text-sm py-4">No open transactions</div>
        {:else}
          <div class="border border-gray-200 rounded overflow-y-auto max-h-96">
            {#each transactions as tx}
              <button
                onclick={() => { selectedTxId = tx.id; successMsg = ''; errorMsg = '' }}
                class="w-full text-left px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors
                  {selectedTxId === tx.id ? 'bg-blue-50 border-b-2 border-blue-400' : ''}"
              >
                <div class="font-semibold text-sm">{tx.transaction_code}</div>
                <div class="text-xs text-gray-500 mt-1">
                  Entry: {formatDT(tx.entry_at)}
                </div>
                <div class="text-xs text-gray-400 mt-0.5">
                  {tx.entry_method.toUpperCase()}
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Right: Control Panel -->
      <div class="flex flex-col gap-6">
        {#if selectedTx}
          <div class="border border-gray-200 rounded p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Selected Transaction</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Code:</span>
                <span class="font-mono font-semibold">{selectedTx.transaction_code}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Method:</span>
                <span>{selectedTx.entry_method.toUpperCase()}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Entry At:</span>
                <span class="font-mono">{formatDT(selectedTx.entry_at)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Status:</span>
                <span>{selectedTx.status}</span>
              </div>
            </div>
          </div>
        {:else}
          <div class="border border-dashed border-gray-300 rounded p-4 text-gray-500 text-sm text-center py-8">
            Select transaction from list
          </div>
        {/if}

        <div class="border border-gray-200 rounded p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Set Duration</h3>
          
          <div class="flex flex-wrap gap-2 mb-4">
            {#each presets as p}
              <button
                onclick={() => minutesAgo = p}
                class="px-3 py-1.5 text-sm border rounded transition-colors
                  {minutesAgo === p
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'}"
              >
                {durationLabel(p)}
              </button>
            {/each}
          </div>

          <div class="mb-4">
            <label class="block text-sm text-gray-600 mb-2">Custom (minutes):</label>
            <input
              type="number"
              bind:value={minutesAgo}
              min="1"
              max="99999"
              class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="Enter minutes"
            />
          </div>

          {#if selectedTx && minutesAgo > 0}
            <div class="bg-gray-50 border border-gray-200 rounded p-3 mb-4 text-sm">
              <div class="text-gray-600">entry_at will be set to:</div>
              <div class="font-mono font-semibold text-gray-900 mt-1">
                {new Date(Date.now() - minutesAgo * 60_000).toLocaleString('id-ID', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                })}
              </div>
            </div>
          {/if}

          {#if successMsg}
            <div class="bg-green-50 border border-green-200 rounded p-3 mb-4 text-sm text-green-700">
              ✓ {successMsg}
            </div>
          {/if}

          {#if errorMsg}
            <div class="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
              ✗ {errorMsg}
            </div>
          {/if}

          <button
            onclick={simulate}
            disabled={!selectedTxId || minutesAgo <= 0 || loading}
            class="w-full py-2 px-4 rounded font-semibold text-sm transition-colors
              {!selectedTxId || minutesAgo <= 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'}"
          >
            {loading ? 'Processing...' : `Set entry_at (${durationLabel(minutesAgo)} ago)`}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
