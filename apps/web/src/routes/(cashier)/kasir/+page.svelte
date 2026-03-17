<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { getUserName, clearToken } from '$lib/utils/auth'
  import { getTransactionByCode, getTransaction } from '$lib/api/transactions'
  import { payCash, initiateQRIS } from '$lib/api/payments'
  import { listenCashierSSE, notifyCashierDone, notifyCashierCancel, type CashierEvent } from '$lib/api/cashier'
  import { formatCurrency, formatDateTime } from '$lib/utils/format'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Badge } from '$lib/components/ui/badge'
  import * as AlertDialog from '$lib/components/ui/alert-dialog'
  import { toastError, toastSuccess } from '$lib/components/ui/toast'
  import { LogOut, Search, Loader2, QrCode, Banknote, CheckCircle, Bell, Inbox } from 'lucide-svelte'
  import { getTransactions } from '$lib/api/transactions'
  import { getPaymentsByTransaction } from '$lib/api/payments'
  import { PUBLIC_MIDTRANS_SANDBOX, PUBLIC_API_BASE_URL } from '$env/static/public'

  const isSandbox = PUBLIC_MIDTRANS_SANDBOX === 'true'
  let pendingQRISImageURL = $state<string | null>(null)

  async function fetchPendingQRIS(txId: string) {
    if (!isSandbox) return
    try {
      const payments = await getPaymentsByTransaction(txId)
      console.log('[KASIR] fetchPendingQRIS payments:', payments)
      const pending = payments.find(p => p.method === 'qris' && p.status === 'pending' && p.qris_image_url)
      console.log('[KASIR] pending QRIS:', pending)
      pendingQRISImageURL = pending?.qris_image_url ?? null
      console.log('[KASIR] pendingQRISImageURL:', pendingQRISImageURL)
    } catch (e) {
      console.error('[KASIR] fetchPendingQRIS error:', e)
    }
  }

  let showSimModal = $state(false)
  let clipboardCopied = $state(false)

  async function doSimulateQRIS() {
    if (!pendingQRISImageURL) return
    // Auto copy URL ke clipboard
    try {
      await navigator.clipboard.writeText(pendingQRISImageURL)
      clipboardCopied = true
      setTimeout(() => { clipboardCopied = false }, 3000)
    } catch { /* non-fatal */ }
    showSimModal = true
  }
  import type { Transaction, Payment } from '$lib/types/domain'

  const userName = getUserName() ?? '—'

  let now = $state(Date.now())
  let clockInterval: ReturnType<typeof setInterval>

  let searchCode = $state('')
  let searchLoading = $state(false)
  let tx = $state<Transaction | null>(null)
  let txError = $state('')

  let payStep = $state<'idle' | 'cash' | 'qris-loading' | 'qris-waiting' | 'processing' | 'done'>('idle')
  let cashTendered = $state('')
  let qrisPayment = $state<Payment | null>(null)
  let payError = $state('')

  let incomingEvent = $state<CashierEvent | null>(null)
  let logoutOpen = $state(false)
  let sseSource: { close: () => void; pause: () => void; resume: () => void } | null = null

  const cashPresets = [5_000, 10_000, 20_000, 50_000, 100_000]

  const tendered = $derived(parseInt(cashTendered.replace(/\D/g, ''), 10) || 0)
  const fee = $derived(tx?.calculated_fee ?? 0)
  const change = $derived(Math.max(0, tendered - fee))
  const cashValid = $derived(tendered >= fee && fee > 0)

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString('id-ID')
  }

  async function doSearch() {
    if (!searchCode.trim()) return
    searchLoading = true
    txError = ''
    tx = null
    payStep = 'idle'
    payError = ''
    cashTendered = ''
    try {
      tx = await getTransactionByCode(searchCode.trim().toUpperCase())
    } catch (e) {
      txError = e instanceof Error ? e.message : 'Transaksi tidak ditemukan'
    } finally {
      searchLoading = false
    }
  }

  async function loadFromEvent(e: CashierEvent) {
    console.log(`[KASIR] SSE event received type=${e.type} tx=${e.transaction_id} amount=${e.amount} gate=${e.gate_name}`)
    // Pause polling supaya tx berikutnya tidak masuk saat kasir sedang aktif
    sseSource?.pause()
    incomingEvent = e
    searchLoading = true
    txError = ''
    tx = null
    payStep = 'idle'
    payError = ''
    cashTendered = ''
    try {
      console.log(`[KASIR] fetching transaction ${e.transaction_id}`)
      tx = await getTransaction(e.transaction_id)
      searchCode = tx.transaction_code
      console.log(`[KASIR] tx loaded code=${tx.transaction_code} status=${tx.status} fee=${tx.calculated_fee}`)
      // Fetch QRIS pending kalau sandbox
      pendingQRISImageURL = null
      await fetchPendingQRIS(e.transaction_id)
      // Langsung buka step pembayaran sesuai tipe event
      if (tx.status === 'awaiting_payment') {
        if (e.type === 'cash' || e.type === 'qris_fail') {
          if (pendingQRISImageURL) {
            console.log('[KASIR] QRIS pending detected — open simulator')
            doSimulateQRIS()
            payStep = 'idle'
          } else if (e.type === 'cash') {
            console.log('[KASIR] auto-open cash step')
            payStep = 'cash'
          } else {
            console.log('[KASIR] qris_fail — open idle step')
            payStep = 'idle'
          }
        }
      } else {
        console.warn(`[KASIR] tx status bukan awaiting_payment: ${tx.status} — tidak auto-open payStep`)
      }
    } catch (err) {
      console.error('[KASIR] loadFromEvent error:', err)
      txError = err instanceof Error ? err.message : 'Transaksi tidak ditemukan'
    } finally {
      searchLoading = false
    }
  }

  async function doPayCash() {
    if (!tx || !cashValid) return
    payStep = 'processing'
    payError = ''
    console.log(`[KASIR] doPayCash tx=${tx.id} tendered=${tendered} fee=${fee}`)
    try {
      await payCash(tx.id, tendered)
      console.log('[KASIR] payCash OK, sending notifyCashierDone')
      await notifyCashierDone(tx.id)
      console.log('[KASIR] notifyCashierDone sent → payStep=done')
      payStep = 'done'
      toastSuccess('Pembayaran berhasil')
    } catch (e) {
      console.error('[KASIR] doPayCash error:', e)
      payError = e instanceof Error ? e.message : 'Pembayaran gagal'
      payStep = 'cash'
      toastError(payError)
    }
  }

  async function doInitiateQRIS() {
    if (!tx) return
    payStep = 'qris-loading'
    payError = ''
    try {
      qrisPayment = await initiateQRIS(tx.id)
      payStep = 'qris-waiting'
    } catch (e) {
      payError = e instanceof Error ? e.message : 'Gagal membuat QRIS'
      payStep = 'idle'
      toastError(payError)
    }
  }

  async function cancelPayment() {
    if (!tx) return
    try { await notifyCashierCancel(tx.id) } catch { /* non-fatal */ }
    payStep = 'idle'
    tx = null
    searchCode = ''
    incomingEvent = null
    // Resume polling setelah kasir batalkan
    sseSource?.resume()
  }

  function reset() {
    tx = null
    searchCode = ''
    cashTendered = ''
    payStep = 'idle'
    payError = ''
    txError = ''
    incomingEvent = null
    qrisPayment = null
    // Resume polling untuk transaksi berikutnya
    sseSource?.resume()
  }

  let queueLoading = $state(false)
  let queueCount = $state(0)

  async function fetchQueue() {
    queueLoading = true
    try {
      const res = await getTransactions({ status: 'awaiting_payment', page: 1, page_size: 1 })
      queueCount = res.pagination?.meta?.total ?? 0
      if (res.data.length > 0) {
        // Load transaksi pertama (exit_at paling baru)
        const first = res.data[0]
        console.log(`[KASIR] fetchQueue: loading ${first.id} ${first.transaction_code}`)
        await loadFromEvent({ type: 'cash', transaction_id: first.id, amount: first.calculated_fee ?? 0, gate_name: '', zone_name: '' })
      } else {
        toastSuccess('Tidak ada antrian')
      }
    } catch (e) {
      console.error('[KASIR] fetchQueue error:', e)
      toastError('Gagal mengambil antrian')
    } finally {
      queueLoading = false
    }
  }

  function handleLogout() {
    clearToken()
    goto('/masuk')
  }

  onMount(() => {
    clockInterval = setInterval(() => { now = Date.now() }, 1000)
    sseSource = listenCashierSSE(loadFromEvent)
    console.log('[KASIR] onMount: polling started', sseSource)
  })

  onDestroy(() => {
    clearInterval(clockInterval)
    sseSource?.close()
  })
</script>

<div class="flex flex-col overflow-hidden bg-[#f0f2f5]" style="height: 100dvh">

  <!-- Topbar -->
  <div class="flex h-11 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
    <div class="flex items-center gap-2">
      <div class="flex h-6 w-6 items-center justify-center rounded-md bg-[#e11d48]">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <span class="text-[13px] font-semibold text-gray-900">Kasir Parkiye</span>
      {#if incomingEvent}
        <div class="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
          <Bell size={11} />
          <span class="hidden sm:inline">Permintaan masuk dari kiosk</span>
          <span class="sm:hidden">Kiosk</span>
        </div>
      {/if}
    </div>
    <div class="flex items-center gap-3">
      <span class="hidden sm:inline text-[12px] tabular-nums text-gray-400">{formatTime(now)}</span>
      <span class="hidden sm:inline text-[12px] text-gray-600">{userName}</span>
      <Button variant="ghost" class="h-7 gap-1 px-2 text-[12px] text-gray-500" onclick={() => logoutOpen = true}>
        <LogOut size={12} />
        <span class="hidden sm:inline">Keluar</span>
      </Button>
    </div>
  </div>

  <!-- Main: stack di mobile, side-by-side di desktop -->
  <div class="flex flex-1 flex-col overflow-hidden md:flex-row">

    <!-- Kiri / Atas: search + info transaksi -->
    <div class="flex flex-col gap-3 overflow-y-auto p-4 md:w-[55%] md:flex-1">

      <!-- Search -->
      <div>
        <div class="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-gray-400">Cari Transaksi</div>
        <div class="flex gap-2">
          <Input
            placeholder="Kode transaksi / scan barcode..."
            bind:value={searchCode}
            onkeydown={(e) => { if (e.key === 'Enter') doSearch() }}
            class="text-[13px]"
            autofocus
          />
          <Button onclick={doSearch} disabled={searchLoading} class="!bg-[#e11d48] !text-white hover:!bg-[#be123c]">
            {#if searchLoading}
              <Loader2 size={14} class="animate-spin" />
            {:else}
              <Search size={14} />
            {/if}
          </Button>
        </div>
        {#if txError}
          <p class="mt-1.5 text-[12px] text-red-500">{txError}</p>
        {/if}
      </div>

      <!-- Info transaksi -->
      {#if tx}
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="mb-3 flex items-start justify-between">
            <div>
              <div class="text-[11px] text-gray-400">{tx.transaction_code}</div>
              <div class="mt-1 text-[26px] font-semibold tracking-wider text-gray-900">
                {tx.ocr?.find(o => o.photo_type === 'exit')?.actual_plate
                  ?? tx.ocr?.find(o => o.photo_type === 'entry')?.actual_plate
                  ?? '—'}
              </div>
            </div>
            <Badge class={
              tx.status === 'awaiting_payment' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
              tx.status === 'paid' || tx.status === 'exited' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
              'bg-gray-100 text-gray-500 hover:bg-gray-100'
            }>
              {tx.status === 'awaiting_payment' ? 'Menunggu Bayar' :
               tx.status === 'paid' ? 'Dibayar' :
               tx.status === 'exited' ? 'Sudah Keluar' : tx.status}
            </Badge>
          </div>

          <div class="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {#each [
              { label: 'Waktu Masuk', value: formatDateTime(tx.entry_at) },
              { label: 'Waktu Keluar', value: tx.exit_at ? formatDateTime(tx.exit_at) : '—' },
              { label: 'Metode Masuk', value: tx.entry_method.toUpperCase() },
              { label: 'Tarif', value: tx.calculated_fee != null ? formatCurrency(tx.calculated_fee) : '—' },
            ] as row}
              <div>
                <div class="text-[11px] text-gray-400">{row.label}</div>
                <div class="text-[13px] font-medium text-gray-800">{row.value}</div>
              </div>
            {/each}
          </div>

          <!-- OCR info -->
          {#if tx.ocr && tx.ocr.length > 0}
            <div class="mt-3 border-t border-gray-100 pt-3">
              <div class="mb-2 text-[11px] text-gray-400">Deteksi OCR</div>
              <div class="flex flex-wrap gap-2">
                {#each tx.ocr as ocr}
                  <div class="flex items-center gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-1.5">
                    <span class="text-[11px] text-gray-400">{ocr.photo_type === 'entry' ? 'Masuk' : 'Keluar'}</span>
                    <span class="text-[13px] font-medium">{ocr.actual_plate || ocr.ocr_detected_plate || '—'}</span>
                    <span class="text-[11px] {ocr.confidence >= 0.85 ? 'text-emerald-600' : 'text-amber-600'}">
                      {Math.round(ocr.confidence * 100)}%
                    </span>
                  </div>
                {/each}
              </div>

              {#if tx.ocr.some(o => o.confidence < 0.85 && !o.is_verified)}
                <div class="mt-2.5 rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p class="mb-2 text-[12px] text-amber-700">Confidence OCR rendah — konfirmasi plat nomor secara manual</p>
                  <Input
                    placeholder="Contoh: B 1234 XYZ"
                    class="text-[15px] font-semibold tracking-widest text-center uppercase"
                  />
                </div>
              {/if}
            </div>
          {/if}
        </div>

      {:else if !searchLoading}
        <div class="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-white py-16 text-center">
          <Search size={28} class="text-gray-200" />
          <p class="text-[13px] text-gray-400">Cari transaksi untuk mulai</p>
          <p class="text-[12px] text-gray-300">atau ambil dari antrian</p>
          <Button
            variant="outline"
            class="mt-2 gap-2 text-[12px]"
            onclick={fetchQueue}
            disabled={queueLoading}
          >
            {#if queueLoading}
              <Loader2 size={13} class="animate-spin" />
            {:else}
              <Inbox size={13} />
            {/if}
            Ambil Antrian
          </Button>
        </div>
      {/if}

    </div>

    <!-- Kanan / Bawah: panel pembayaran -->
    <div class="flex flex-col border-t border-gray-200 bg-white
      {payStep === 'idle' && !tx ? 'max-h-24' : ''}
      md:max-h-none md:w-[45%] md:border-l md:border-t-0">

      {#if payStep === 'done'}
        <div class="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <CheckCircle size={52} class="text-emerald-500" />
          <p class="text-[16px] font-semibold text-gray-900">Pembayaran Selesai</p>
          <p class="text-[13px] text-gray-500">Gate kiosk sudah dibuka otomatis</p>
          <Button onclick={reset} class="mt-2 !bg-emerald-600 !text-white hover:!bg-emerald-700">
            Transaksi Baru
          </Button>
        </div>

      {:else if !tx}
        <div class="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <Banknote size={36} class="text-gray-200" />
          <p class="text-[13px] text-gray-400">Pilih transaksi untuk melihat opsi pembayaran</p>
        </div>

      {:else}
        <div class="border-b border-gray-100 px-5 py-4">
          <div class="text-[13px] font-semibold text-gray-900">Pembayaran</div>
          <div class="mt-0.5 text-[11px] text-gray-400">{tx.transaction_code}</div>
        </div>

        <div class="border-b border-gray-100 px-5 py-5 text-center">
          <div class="text-[12px] text-gray-400">Total Tagihan</div>
          <div class="mt-1 text-[34px] font-semibold text-gray-900">{formatCurrency(fee)}</div>
        </div>

        {#if payStep === 'idle'}
          <div class="flex flex-1 flex-col justify-center gap-3 px-5">
            <p class="text-center text-[12px] text-gray-400">Pilih metode pembayaran</p>
            <Button
              onclick={() => { payStep = 'cash' }}
              class="h-12 gap-2 !bg-[#e11d48] !text-white text-[14px] hover:!bg-[#be123c]"
              disabled={tx.status !== 'awaiting_payment'}
            >
              <Banknote size={16} /> Tunai
            </Button>
            <Button
              onclick={doInitiateQRIS}
              variant="outline"
              class="h-12 gap-2 text-[14px]"
              disabled={tx.status !== 'awaiting_payment'}
            >
              <QrCode size={16} /> QRIS
            </Button>
            <Button variant="ghost" class="text-[12px] text-gray-400" onclick={cancelPayment}>
              Batalkan
            </Button>
          </div>

        {:else if payStep === 'cash'}
          <div class="flex flex-col gap-4 overflow-y-auto px-5 py-4 md:flex-1">
            <div>
              <div class="mb-2 text-[12px] font-medium text-gray-700">Nominal Diterima</div>
              <div class="grid grid-cols-3 gap-2">
                {#each cashPresets as p}
                  <button
                    class="h-9 rounded-lg border text-[12px] font-medium transition-colors
                      {tendered === p ? 'border-[#e11d48] bg-[#fff5f7] text-[#e11d48]' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}"
                    onclick={() => { cashTendered = String(p) }}
                  >
                    {formatCurrency(p)}
                  </button>
                {/each}
                <button
                  class="h-9 rounded-lg border text-[12px] font-medium transition-colors
                    {tendered === fee ? 'border-[#e11d48] bg-[#fff5f7] text-[#e11d48]' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}"
                  onclick={() => { cashTendered = String(fee) }}
                >
                  Pas
                </button>
              </div>
            </div>

            <div>
              <div class="mb-1.5 text-[12px] font-medium text-gray-700">Jumlah Uang (Rp)</div>
              <Input
                type="number"
                min="0"
                bind:value={cashTendered}
                placeholder="0"
                class="text-[15px] font-semibold"
              />
            </div>

            {#if tendered > 0}
              <div class="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
                <span class="text-[13px] text-emerald-700">Kembalian</span>
                <span class="text-[16px] font-semibold text-emerald-700">{formatCurrency(change)}</span>
              </div>
            {/if}

            {#if payError}
              <p class="text-[12px] text-red-500">{payError}</p>
            {/if}
          </div>

          <div class="flex gap-2 border-t border-gray-100 px-5 py-3">
            <Button variant="outline" class="h-10 text-[13px]" onclick={() => { payStep = 'idle'; cashTendered = '' }}>
              Kembali
            </Button>
            <Button
              class="h-10 flex-1 !bg-[#e11d48] !text-white text-[13px] hover:!bg-[#be123c]"
              disabled={!cashValid}
              onclick={doPayCash}
            >
              Proses Pembayaran
            </Button>
          </div>

        {:else if payStep === 'qris-loading'}
          <div class="flex flex-1 items-center justify-center gap-2">
            <Loader2 size={20} class="animate-spin text-gray-400" />
            <span class="text-[13px] text-gray-400">Membuat QRIS...</span>
          </div>

        {:else if payStep === 'qris-waiting' && qrisPayment}
          <div class="flex flex-1 flex-col items-center justify-center gap-4 px-5">
            {#if qrisPayment.qris_image_url}
              <img src={qrisPayment.qris_image_url} alt="QRIS" class="h-48 w-48 rounded-lg border border-gray-100" />
            {:else}
              <QrCode size={80} class="text-gray-300" />
            {/if}
            <p class="text-center text-[12px] text-gray-400">Minta pelanggan scan QRIS di aplikasi e-wallet</p>
            <Button variant="outline" class="text-[12px]" onclick={() => { payStep = 'idle'; qrisPayment = null }}>
              Kembali
            </Button>
          </div>

        {:else if payStep === 'processing'}
          <div class="flex flex-1 items-center justify-center gap-2">
            <Loader2 size={20} class="animate-spin text-gray-400" />
            <span class="text-[13px] text-gray-400">Memproses pembayaran...</span>
          </div>
        {/if}
      {/if}

    </div>
  </div>
</div>

<!-- Simulator QRIS Modal -->
{#if showSimModal && pendingQRISImageURL}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div class="flex flex-col rounded-lg border border-gray-200 bg-white shadow-2xl overflow-hidden"
      style="width:min(760px,95vw);height:min(640px,92dvh)">
      <!-- Header -->
      <div class="flex h-10 flex-shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50 px-4">
        <div class="flex items-center gap-2">
          <span class="text-[12px] font-semibold text-gray-700">Midtrans QRIS Simulator</span>
          <span class="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600">SANDBOX</span>
        </div>
        <button onclick={() => showSimModal = false}
          class="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-200">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <!-- Clipboard banner -->
      <div class="flex flex-shrink-0 items-center justify-between border-b px-4 py-2
        {clipboardCopied ? 'border-emerald-200 bg-emerald-50' : 'border-amber-100 bg-amber-50'}">
        <span class="text-[11px] {clipboardCopied ? 'text-emerald-700' : 'text-amber-700'}">
          {#if clipboardCopied}
            ✓ URL sudah di-copy! <strong>Paste</strong> di kolom "QR Code Image Url" → klik <strong>Scan QR</strong> → klik <strong>Pay</strong>
          {:else}
            Paste URL di kolom "QR Code Image Url" → klik <strong>Scan QR</strong> → klik <strong>Pay</strong>
          {/if}
        </span>
        <button
          onclick={async () => { await navigator.clipboard.writeText(pendingQRISImageURL!); clipboardCopied = true; setTimeout(() => clipboardCopied = false, 3000) }}
          class="ml-3 flex-shrink-0 rounded border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-500 hover:bg-gray-50"
        >
          Copy lagi
        </button>
      </div>
      <!-- iframe: simulator Midtrans langsung -->
      <iframe
        src="https://simulator.sandbox.midtrans.com/v2/qris/index"
        title="Midtrans QRIS Simulator"
        class="flex-1 w-full border-0"
        sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation"
      ></iframe>
    </div>
  </div>
{/if}

<!-- Logout confirm -->
<AlertDialog.Root bind:open={logoutOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Keluar dari sesi kasir?</AlertDialog.Title>
      <AlertDialog.Description>Pastikan semua transaksi sudah diproses.</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
      <AlertDialog.Action onclick={handleLogout} class="bg-[#e11d48] text-white hover:bg-[#be123c]">
        Ya, Keluar
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
