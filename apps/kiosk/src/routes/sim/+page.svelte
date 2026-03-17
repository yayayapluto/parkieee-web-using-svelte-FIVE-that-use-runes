<script lang="ts">
  import { onMount } from 'svelte'
  import axios from 'axios'
  import { PUBLIC_API_BASE_URL } from '$env/static/public'
  import type { PaginatedResponse, ApiResponse } from '$lib/types/api'
  import type { Transaction } from '$lib/types/domain.d'

  const DEV_TOKEN_KEY = 'sim_dev_token'
  const ALLOWED_ROLES = ['admin', 'engineer']

  let devToken      = $state<string | null>(null)
  let loginEmail    = $state('')
  let loginPassword = $state('')
  let loginLoading  = $state(false)
  let loginError    = $state('')
  let showPassword  = $state(false)

  function getRoleFromToken(token: string): string | null {
    try { return JSON.parse(atob(token.split('.')[1])).role ?? null } catch { return null }
  }

  const simClient = axios.create({ baseURL: PUBLIC_API_BASE_URL })
  simClient.interceptors.request.use((cfg) => {
    if (devToken) cfg.headers.Authorization = `Bearer ${devToken}`
    return cfg
  })
  simClient.interceptors.response.use(
    (r) => r,
    (e) => Promise.reject(new Error(e.response?.data?.meta?.message ?? e.message)),
  )

  async function login() {
    loginLoading = true
    loginError = ''
    try {
      const res = await axios.post<ApiResponse<{ token: string }>>(`${PUBLIC_API_BASE_URL}/api/v1/auth/login`, {
        email: loginEmail,
        password: loginPassword,
      })
      const token = res.data.data.token
      const role  = getRoleFromToken(token)
      if (!role || !ALLOWED_ROLES.includes(role)) {
        loginError = `Role "${role}" tidak diizinkan. Hanya admin/engineer.`
        return
      }
      devToken = token
      localStorage.setItem(DEV_TOKEN_KEY, token)
      await fetchOpenTransactions()
    } catch (e) {
      loginError = e instanceof Error ? e.message : 'Login gagal'
    } finally {
      loginLoading = false
    }
  }

  function logout() {
    devToken = null
    localStorage.removeItem(DEV_TOKEN_KEY)
    transactions = []
    selectedTxId = ''
    successMsg = ''
    errorMsg = ''
  }

  // ── Transactions ──────────────────────────────────────────────────────────

  let transactions = $state<Transaction[]>([])
  let selectedTxId = $state('')
  let minutesAgo   = $state(60)
  let simLoading   = $state(false)
  let fetching     = $state(false)
  let successMsg   = $state('')
  let errorMsg     = $state('')

  const selectedTx = $derived(transactions.find(t => t.id === selectedTxId) ?? null)
  const presets    = [5, 15, 30, 60, 90, 120, 180, 360, 720, 1440]

  async function fetchOpenTransactions() {
    fetching = true
    errorMsg = ''
    try {
      const res = await simClient.get<PaginatedResponse<Transaction>>('/api/v1/transactions?status=open&page_size=100')
      transactions = res.data.data ?? []
      if (transactions.length > 0 && !selectedTxId) selectedTxId = transactions[0].id
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : 'Gagal memuat transaksi'
    } finally {
      fetching = false
    }
  }

  async function simulate() {
    if (!selectedTxId || minutesAgo <= 0) return
    simLoading = true; successMsg = ''; errorMsg = ''
    try {
      await simClient.patch(`/api/v1/transactions/${selectedTxId}/simulate`, { minutes_ago: minutesAgo })
      successMsg = `entry_at berhasil di-backdate ${durationLabel(minutesAgo)}`
      await fetchOpenTransactions()
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : 'Gagal simulasi'
    } finally {
      simLoading = false
    }
  }

  // ── Formatting ────────────────────────────────────────────────────────────

  function durationLabel(mins: number): string {
    if (mins < 60) return `${mins} menit`
    const h = Math.floor(mins / 60), m = mins % 60
    return m > 0 ? `${h}j ${m}m` : `${h}j`
  }

  function formatDT(iso: string) {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  onMount(() => {
    const saved = localStorage.getItem(DEV_TOKEN_KEY)
    if (saved && ALLOWED_ROLES.includes(getRoleFromToken(saved) ?? '')) {
      devToken = saved
      fetchOpenTransactions()
    }
  })
</script>

<div class="flex flex-col overflow-hidden bg-[#f0f2f5]" style="height:100dvh">

  {#if !devToken}
    <!-- ── Login ── -->
    <div class="flex flex-1 items-center justify-center bg-[#f0f2f5] px-4">
      <div class="w-full max-w-[360px]">
        <!-- Header -->
        <div class="mb-6 flex items-center gap-2">
          <div class="flex h-6 w-6 items-center justify-center rounded-md bg-[#e11d48]">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              <path d="M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
          </div>
          <span class="text-[13px] font-semibold text-gray-900">Simulate</span>
          <span class="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">DEV</span>
        </div>

        <!-- Card -->
        <div class="rounded-lg border border-gray-200 bg-white">
          <div class="border-b border-gray-100 px-5 py-3">
            <span class="text-[11px] font-medium uppercase tracking-widest text-gray-400">Masuk ke Simulate</span>
          </div>
          <div class="p-5 space-y-3">
            <div>
              <label class="mb-1 block text-[13px] font-medium text-gray-700">Email</label>
              <input
                type="email"
                bind:value={loginEmail}
                onkeydown={(e) => { if (e.key === 'Enter') login() }}
                placeholder="admin@parkieee.local"
                class="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] outline-none transition-colors focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48]/20 focus:bg-white"
              />
            </div>
            <div>
              <label class="mb-1 block text-[13px] font-medium text-gray-700">Password</label>
              <div class="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  bind:value={loginPassword}
                  onkeydown={(e) => { if (e.key === 'Enter') login() }}
                  placeholder="••••••••"
                  class="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 pr-9 text-[13px] outline-none transition-colors focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48]/20 focus:bg-white"
                />
                <button type="button" onclick={() => showPassword = !showPassword}
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabindex="-1">
                  {#if showPassword}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  {:else}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  {/if}
                </button>
              </div>
            </div>

            {#if loginError}
              <div class="rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">{loginError}</div>
            {/if}

            <button onclick={login} disabled={loginLoading || !loginEmail || !loginPassword}
              class="w-full rounded bg-[#e11d48] py-2.5 text-[12px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#be123c] disabled:cursor-not-allowed disabled:opacity-40">
              {loginLoading ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </div>
        </div>
        
      </div>
    </div>

  {:else}
    <!-- ── Main App ── -->

    <!-- Topbar -->
    <div class="flex h-11 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div class="flex items-center gap-2">
        <div class="flex h-6 w-6 items-center justify-center rounded-md bg-[#e11d48]">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
        </div>
        <span class="text-[13px] font-semibold text-gray-900">Simulate</span>
        <span class="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">DEV</span>
      </div>
      <button onclick={logout}
        class="flex items-center gap-1.5 rounded border border-gray-200 px-2.5 py-1 text-[11px] text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Keluar
      </button>
    </div>

    <!-- Body -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Kiri: Transaction List -->
      <div class="flex w-[42%] flex-shrink-0 flex-col border-r border-gray-200 bg-white overflow-hidden">
        <!-- List header -->
        <div class="flex h-9 flex-shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50 px-4">
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-bold uppercase tracking-widest text-gray-500">Open Transactions</span>
            <span class="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">{transactions.length}</span>
          </div>
          <button onclick={fetchOpenTransactions} disabled={fetching}
            class="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 disabled:opacity-40 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class={fetching ? 'animate-spin' : ''}>
              <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
              <path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            Refresh
          </button>
        </div>

        <!-- List body -->
        <div class="flex-1 overflow-y-auto">
          {#if fetching}
            <div class="space-y-px p-2">
              {#each Array(6) as _, i (i)}
                <div class="h-14 animate-pulse rounded bg-gray-100"></div>
              {/each}
            </div>
          {:else if transactions.length === 0}
            <div class="flex flex-col items-center justify-center gap-2 py-20 text-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-200">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
              </svg>
              <p class="text-[12px] text-gray-400">Tidak ada transaksi open</p>
            </div>
          {:else}
            {#each transactions as t (t.id)}
              <button
                onclick={() => { selectedTxId = t.id; successMsg = ''; errorMsg = '' }}
                class="group w-full border-b border-gray-100 px-4 py-2.5 text-left transition-colors hover:bg-gray-50
                  {selectedTxId === t.id ? '!bg-[#e11d48] !border-[#e11d48]' : ''}"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[12px] font-semibold {selectedTxId === t.id ? 'text-white' : 'text-gray-800'}">
                    {t.transaction_code}
                  </span>
                  <span class="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase
                    {selectedTxId === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}">
                    {t.entry_method}
                  </span>
                </div>
                <div class="mt-0.5 text-[11px] {selectedTxId === t.id ? 'text-gray-300' : 'text-gray-400'}">
                  {formatDT(t.entry_at)}
                </div>
              </button>
            {/each}
          {/if}
        </div>
      </div>

      <!-- Kanan: Control Panel -->
      <div class="flex flex-1 flex-col overflow-y-auto bg-[#f0f2f5] p-5 gap-4">

        <!-- Info tx terpilih -->
        <div class="rounded-lg border border-gray-200 bg-white">
          <div class="flex h-9 items-center border-b border-gray-100 bg-gray-50 px-4">
            <span class="text-[11px] font-bold uppercase tracking-widest text-gray-500">Detail Transaksi</span>
          </div>
          {#if selectedTx}
            <div class="divide-y divide-gray-50">
              {#each [
                { label: 'Kode', value: selectedTx.transaction_code, mono: true },
                { label: 'Metode Masuk', value: selectedTx.entry_method.toUpperCase() },
                { label: 'Entry At', value: formatDT(selectedTx.entry_at), mono: true },
                { label: 'Status', value: selectedTx.status },
              ] as row}
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-[11px] text-gray-400">{row.label}</span>
                  <span class="text-[12px] font-medium text-gray-800">{row.value}</span>
                </div>
              {/each}
            </div>
          {:else}
            <div class="px-4 py-8 text-center text-[12px] text-gray-400">← Pilih transaksi dari daftar</div>
          {/if}
        </div>

        <!-- Set durasi -->
        <div class="rounded-lg border border-gray-200 bg-white">
          <div class="flex h-9 items-center border-b border-gray-100 bg-gray-50 px-4">
            <span class="text-[11px] font-bold uppercase tracking-widest text-gray-500">Set Durasi Parkir</span>
          </div>
          <div class="p-4 space-y-4">

            <!-- Preset buttons -->
            <div>
              <div class="mb-2 text-[11px] text-gray-400">Preset</div>
              <div class="flex flex-wrap gap-1.5">
                {#each presets as p}
                  <button onclick={() => minutesAgo = p}
                    class="rounded border px-2.5 py-1 text-[11px] font-semibold transition-colors
                      {minutesAgo === p
                        ? 'border-[#e11d48] bg-[#e11d48] text-white'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-[#e11d48] hover:text-[#e11d48]'}">
                    {durationLabel(p)}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Custom input -->
            <div>
              <label class="mb-1 block text-[11px] text-gray-400">Custom (menit)</label>
              <input type="number" bind:value={minutesAgo} min="1"
                class="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] outline-none transition-colors focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48]/20 focus:bg-white" />
            </div>

            <!-- Preview -->
            {#if selectedTx && minutesAgo > 0}
              <div class="rounded border border-gray-200 bg-gray-50 px-4 py-3">
                <div class="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Entry At akan menjadi</div>
                <div class="text-[13px] font-bold text-gray-900">
                  {new Date(Date.now() - minutesAgo * 60_000).toLocaleString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                  })}
                </div>
              </div>
            {/if}

            <!-- Feedback -->
            {#if successMsg}
              <div class="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {successMsg}
              </div>
            {/if}
            {#if errorMsg}
              <div class="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errorMsg}
              </div>
            {/if}

            <!-- Action button -->
            <button onclick={simulate} disabled={!selectedTxId || minutesAgo <= 0 || simLoading}
              class="w-full rounded bg-[#e11d48] py-2.5 text-[12px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#be123c] disabled:cursor-not-allowed disabled:opacity-40">
              {#if simLoading}
                <span class="flex items-center justify-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Memproses...
                </span>
              {:else}
                Backdate {durationLabel(minutesAgo)}
              {/if}
            </button>
          </div>
        </div>

      </div>
    </div>
  {/if}
</div>
