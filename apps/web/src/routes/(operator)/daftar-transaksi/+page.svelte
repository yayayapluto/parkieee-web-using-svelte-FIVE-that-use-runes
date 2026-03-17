<script lang="ts">
  import { onMount } from 'svelte'
  import { getTransactions, cancelTransaction, getTransactionLogs } from '$lib/api/transactions'
  import { createOverride } from '$lib/api/overrides'
  import { formatDateTime, formatCurrency } from '$lib/utils/format'
  import { Button } from '$lib/components/ui/button'
  import { Label } from '$lib/components/ui/label'
  import { Textarea } from '$lib/components/ui/textarea'
  import { Input } from '$lib/components/ui/input'
  import { Skeleton } from '$lib/components/ui/skeleton'
  import { Separator } from '$lib/components/ui/separator'
  import { Badge } from '$lib/components/ui/badge'
  import { SmallCard } from '$lib/components/ui/small-card'
  import * as Select from '$lib/components/ui/select'
  import * as Popover from '$lib/components/ui/popover'
  import * as AlertDialog from '$lib/components/ui/alert-dialog'
  import * as Dialog from '$lib/components/ui/dialog'
  import * as Accordion from '$lib/components/ui/accordion'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import { DateRangePicker } from '$lib/components/ui/date-range-picker'
  import { Download, History, RefreshCw } from 'lucide-svelte'
  import { goto } from '$app/navigation'
  import type { DateRange } from 'bits-ui'
  import type { Transaction, TransactionStatus, EntryMethod, TransactionLog, OverrideType } from '$lib/types/domain'
  import type { TransactionFilter } from '$lib/api/transactions'
  import DataTable from './data-table/data-table.svelte'
  import { exportCSV, exportXLSX, exportPDF, type ExportFilters } from './data-table/export-utils'

  function currentFilters(): ExportFilters {
    return {
      status: filterStatus || undefined,
      method: filterMethod || undefined,
      dateFrom: dateRange?.start?.toString(),
      dateTo: dateRange?.end?.toString(),
    }
  }

  const STATUS_CONFIG: Record<TransactionStatus, { label: string; class: string }> = {
    open:             { label: 'Open',       class: 'bg-green-100 text-green-700 hover:bg-green-100' },
    awaiting_payment: { label: 'Awaiting',   class: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
    paid:             { label: 'Paid',       class: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
    exited:           { label: 'Exited',     class: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
    overridden:       { label: 'Overridden', class: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
    cancelled:        { label: 'Cancelled',  class: 'bg-gray-100 text-gray-500 hover:bg-gray-100' },
  }

  const OVERRIDE_TYPES: { value: OverrideType; label: string }[] = [
    { value: 'lost_card_exit',   label: 'Kartu hilang' },
    { value: 'no_qr_exit',      label: 'QR tidak terbaca' },
    { value: 'fee_waive',       label: 'Bebaskan tarif' },
    { value: 'fee_adjust',      label: 'Sesuaikan tarif' },
    { value: 'force_open_gate', label: 'Buka paksa gate' },
    { value: 'manual_entry',    label: 'Entry manual' },
  ]

  let transactions = $state<Transaction[]>([])
  let loading = $state(false)
  let initialLoaded = $state(false)
  let error = $state('')
  let total = $state(0)
  let totalPages = $state(1)
  let currentPage = $state(1)
  const pageSize = 20

  let filterStatus = $state<TransactionStatus | ''>('')
  let filterMethod = $state<EntryMethod | ''>('')
  let dateRange = $state<DateRange | undefined>(undefined)
  let search = $state('')

  let detailTx = $state<Transaction | null>(null)
  let detailLogs = $state<TransactionLog[]>([])
  let detailLoading = $state(false)
  let detailOpen = $state(false)

  let overrideTx = $state<Transaction | null>(null)
  let overrideOpen = $state(false)
  let overrideType = $state<OverrideType>('fee_adjust')
  let overrideReason = $state('')
  let overrideAdjustedFee = $state('')
  let overrideLoading = $state(false)
  let overrideError = $state('')

  let cancelReason = $state('')
  let cancelTargetId = $state<string | null>(null)
  let cancelLoading = $state(false)

  async function fetchTransactions() {
    loading = true
    error = ''
    try {
      const params: TransactionFilter = { page: currentPage, page_size: pageSize }
      if (filterStatus) params.status = filterStatus
      if (filterMethod) params.entry_method = filterMethod
      if (dateRange?.start) params.date_from = dateRange.start.toString()
      if (dateRange?.end) params.date_to = dateRange.end.toString()
      const res = await getTransactions(params)
      transactions = res.data ?? []
      total = res.pagination?.meta?.total ?? 0
      totalPages = res.pagination?.meta?.last_page ?? 1
    } catch (e) {
      error = e instanceof Error ? e.message : 'Gagal memuat transaksi'
    } finally {
      loading = false
      initialLoaded = true
    }
  }

  async function openDetail(tx: Transaction) {
    detailTx = tx
    detailOpen = true
    detailLoading = true
    detailLogs = []
    try { detailLogs = await getTransactionLogs(tx.id) }
    catch { detailLogs = [] }
    finally { detailLoading = false }
  }

  function openOverride(tx: Transaction) {
    overrideTx = tx
    overrideType = 'fee_adjust'
    overrideReason = ''
    overrideAdjustedFee = tx.calculated_fee != null ? String(tx.calculated_fee) : ''
    overrideError = ''
    overrideOpen = true
  }

  function openCancel(id: string) {
    cancelTargetId = id
    cancelReason = ''
  }

  async function doOverride() {
    if (!overrideTx || !overrideReason.trim()) return
    overrideLoading = true
    overrideError = ''
    try {
      await createOverride({
        transaction_id: overrideTx.id,
        override_type: overrideType,
        reason: overrideReason,
        original_fee: overrideTx.calculated_fee ?? undefined,
        adjusted_fee: overrideAdjustedFee ? parseInt(overrideAdjustedFee) : undefined,
        approved_by: overrideTx.id,
      })
      overrideOpen = false
      fetchTransactions()
    } catch (e) {
      overrideError = e instanceof Error ? e.message : 'Gagal membuat override'
    } finally {
      overrideLoading = false
    }
  }

  async function doCancel() {
    if (!cancelTargetId || !cancelReason.trim()) return
    cancelLoading = true
    try {
      await cancelTransaction(cancelTargetId, cancelReason)
      cancelTargetId = null
      cancelReason = ''
      fetchTransactions()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Gagal membatalkan transaksi'
    } finally {
      cancelLoading = false
    }
  }

  function applyFilter() {
    currentPage = 1
    fetchTransactions()
  }

  function resetFilter() {
    filterStatus = ''
    filterMethod = ''
    dateRange = undefined
    search = ''
    applyFilter()
  }

  function onDateRangeChange(v: DateRange | undefined) {
    dateRange = v
    if (v?.start && v?.end) applyFilter()
    else if (!v) applyFilter()
  }

  const filtered = $derived(
    search.trim()
      ? transactions.filter(t => t.transaction_code?.toLowerCase().includes(search.toLowerCase()))
      : transactions
  )

  onMount(fetchTransactions)
</script>

<div class="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">

  <!-- Card header -->
  <div class="flex flex-shrink-0 flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
    <div class="flex items-baseline gap-2">
      <h1 class="text-[15px] font-semibold text-gray-900">Transaksi</h1>
      {#if initialLoaded}
        <span class="text-[12px] text-gray-400">({total} transaksi ditemukan)</span>
      {/if}
    </div>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        class="h-9 flex-1 gap-1.5 px-3 text-[13px] text-gray-600 sm:flex-none"
        onclick={() => { currentPage = 1; fetchTransactions() }}
        disabled={loading}
      >
        <RefreshCw size={13} class={loading ? 'animate-spin' : ''} />
        Refresh
      </Button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="outline" class="h-9 flex-1 gap-1.5 px-3 text-[13px] text-gray-600 sm:flex-none">
              <Download size={13} /> Export
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-40">
          <DropdownMenu.Item class="text-[13px]" onclick={() => exportCSV(filtered, currentFilters())}>Export CSV</DropdownMenu.Item>
          <DropdownMenu.Item class="text-[13px]" onclick={() => exportXLSX(filtered, currentFilters())}>Export XLSX</DropdownMenu.Item>
          <DropdownMenu.Item class="text-[13px]" onclick={() => exportPDF(filtered, currentFilters())}>Export PDF</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item class="gap-1.5 text-[13px] text-gray-500" onclick={() => goto('/operator/transactions/export')}>
            <History size={13} />
            Riwayat Export
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>

  <!-- Filter bar -->
  <div class="flex flex-shrink-0 flex-col gap-2 border-b border-gray-100 px-4 py-3 xl:flex-row xl:items-center xl:gap-4">
    <!-- Kiri: search -->
    <div class="relative w-full xl:w-48 xl:flex-shrink-0">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <Input type="text" placeholder="Cari kode..." bind:value={search} class="w-full pl-8 text-[13px]" autofocus />
    </div>

    <!-- Tengah: filter -->
    <div class="flex w-full flex-wrap items-center justify-start gap-2 xl:flex-1 xl:flex-nowrap xl:justify-center xl:gap-3">
      <!-- Grup 1: Status + Metode -->
      <div class="flex flex-1 gap-2">
        <Select.Root
          type="single"
          bind:value={filterStatus}
          onValueChange={(v) => { filterStatus = (v ?? '') as TransactionStatus | ''; applyFilter() }}
        >
          <Select.Trigger class="flex-1 text-[13px]">
            {filterStatus ? (STATUS_CONFIG[filterStatus as TransactionStatus]?.label ?? filterStatus) : 'Semua Status'}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">Semua Status</Select.Item>
            <Select.Item value="open">Open</Select.Item>
            <Select.Item value="awaiting_payment">Awaiting</Select.Item>
            <Select.Item value="paid">Paid</Select.Item>
            <Select.Item value="exited">Exited</Select.Item>
            <Select.Item value="overridden">Overridden</Select.Item>
            <Select.Item value="cancelled">Cancelled</Select.Item>
          </Select.Content>
        </Select.Root>

        <Select.Root
          type="single"
          bind:value={filterMethod}
          onValueChange={(v) => { filterMethod = (v ?? '') as EntryMethod | ''; applyFilter() }}
        >
          <Select.Trigger class="flex-1 text-[13px]">
            {filterMethod ? (filterMethod as string).toUpperCase() : 'Semua Metode'}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">Semua Metode</Select.Item>
            <Select.Item value="rfid">RFID</Select.Item>
            <Select.Item value="qr">QR</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>

      <!-- Grup 2: Date range picker -->
      <div class="flex flex-1">
        <DateRangePicker
          bind:value={dateRange}
          onValueChange={onDateRangeChange}
        />
      </div>
    </div>

    <!-- Kanan: reset -->
    <div class="flex items-center xl:w-48 xl:flex-shrink-0 xl:justify-end">
      {#if filterStatus || filterMethod || dateRange || search}
        <Button variant="outline" onclick={resetFilter} class="h-9 w-full px-3 text-[13px] text-gray-500 xl:w-auto">
          Reset
        </Button>
      {/if}
    </div>
  </div>

  {#if error}
    <div class="flex-shrink-0 border-b border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>
  {/if}

  <DataTable
    data={filtered}
    {loading}
    {total}
    {currentPage}
    {totalPages}
    {pageSize}
    onPageChange={(p) => { currentPage = p; fetchTransactions() }}
    onSelectionChange={() => {}}
    {openDetail}
    {openOverride}
    {openCancel}
  />
</div>

<!-- Detail Dialog -->
<Dialog.Root bind:open={detailOpen}>
  <Dialog.Content class="max-w-2xl gap-0 p-0">
    <Dialog.Header class="border-b border-gray-100 px-6 py-4">
      <Dialog.Title class="font-mono text-[13px] font-semibold text-gray-900">{detailTx?.transaction_code}</Dialog.Title>
      <Dialog.Description class="text-[12px] text-gray-400">Detail transaksi parkir</Dialog.Description>
    </Dialog.Header>

    {#if detailTx}
      <div class="flex max-h-[70vh]">
        <!-- Kiri: info detail -->
        <div class="flex-1 overflow-y-auto border-r border-gray-100 px-6 py-5">
          <div class="mb-4 flex items-center gap-2">
            <Badge class={STATUS_CONFIG[detailTx.status]?.class ?? ''}>
              {STATUS_CONFIG[detailTx.status]?.label ?? detailTx.status}
            </Badge>
            <Badge class={detailTx.entry_method === 'rfid' ? 'bg-[#fff1f2] text-[#e11d48] hover:bg-[#fff1f2]' : 'bg-gray-100 text-gray-600 hover:bg-gray-100'}>
              {detailTx.entry_method.toUpperCase()}
            </Badge>
          </div>
          <div class="space-y-2.5">
            {#each [
              { label: 'Kode', value: detailTx.transaction_code, mono: true },
              { label: 'Gate Masuk', value: detailTx.entry_gate_id, mono: true, short: true },
              { label: 'Waktu Masuk', value: formatDateTime(detailTx.entry_at) },
              { label: 'Gate Keluar', value: detailTx.exit_gate_id ?? '—', mono: !!detailTx.exit_gate_id, short: !!detailTx.exit_gate_id },
              { label: 'Waktu Keluar', value: detailTx.exit_at ? formatDateTime(detailTx.exit_at) : '—' },
              { label: 'Zona', value: detailTx.zone_id, mono: true, short: true },
              { label: 'Tarif', value: detailTx.calculated_fee != null ? formatCurrency(detailTx.calculated_fee) : '—' },
            ] as row}
              <div class="flex items-center justify-between gap-3">
                <span class="w-24 flex-shrink-0 text-[12px] text-gray-400">{row.label}</span>
                <span
                  class="text-right text-[13px] {row.mono ? 'font-mono text-[11px] text-gray-600' : 'text-gray-800'}"
                  title={row.short ? row.value : undefined}
                >
                  {row.short ? row.value.slice(0, 8) + '…' : row.value}
                </span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Kanan: log status pakai accordion -->
        <div class="w-64 flex-shrink-0 overflow-y-auto px-4 py-5">
          <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Log Status</p>
          {#if detailLoading}
            <div class="space-y-2">
              {#each Array(3) as _, i (i)}<Skeleton class="h-10 w-full" />{/each}
            </div>
          {:else if detailLogs.length === 0}
            <p class="text-[12px] text-gray-400">Tidak ada log</p>
          {:else}
            <Accordion.Root type="single" class="space-y-1.5">
              {#each detailLogs as log (log.id)}
                <div class="rounded-md border border-gray-200 bg-white">
                  <Accordion.Item value={log.id}>
                    <Accordion.Trigger class="px-3 py-2 text-[12px] font-medium text-gray-800 hover:no-underline [&>svg]:h-3.5 [&>svg]:w-3.5">
                      {log.event}
                    </Accordion.Trigger>
                    <Accordion.Content class="!pb-0">
                      <div class="flex items-center justify-between border-t border-gray-100 px-3 py-2">
                        <p class="text-[11px] text-gray-400">{formatDateTime(log.created_at)}</p>
                        <Badge class="bg-gray-100 text-[10px] font-normal text-gray-500 hover:bg-gray-100">
                          {log.triggered_by}
                        </Badge>
                      </div>
                      {#if log.note}
                        <p class="px-3 pb-2 text-[11px] text-gray-500">{log.note}</p>
                      {/if}
                    </Accordion.Content>
                  </Accordion.Item>
                </div>
              {/each}
            </Accordion.Root>
          {/if}
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<!-- Override Dialog -->
<Dialog.Root bind:open={overrideOpen}>
  <Dialog.Content class="max-w-md gap-0 p-0">
    <Dialog.Header class="border-b border-gray-100 px-6 py-4">
      <Dialog.Title class="text-[15px] font-semibold text-gray-900">Override Transaksi</Dialog.Title>
      <Dialog.Description class="font-mono text-[12px] text-gray-400">{overrideTx?.transaction_code}</Dialog.Description>
    </Dialog.Header>
    <div class="overflow-y-auto px-6 py-5">
      <div class="space-y-4">
        <div class="space-y-1.5">
          <Label class="text-[13px]">Tipe Override</Label>
          <Select.Root type="single" bind:value={overrideType}>
            <Select.Trigger class="w-full text-[13px]">
              {OVERRIDE_TYPES.find(t => t.value === overrideType)?.label ?? 'Pilih tipe'}
            </Select.Trigger>
            <Select.Content>
              {#each OVERRIDE_TYPES as t}
                <Select.Item value={t.value}>{t.label}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
        {#if overrideType === 'fee_adjust' || overrideType === 'fee_waive'}
          <div class="space-y-1.5">
            <Label class="text-[13px]">{overrideType === 'fee_waive' ? 'Tarif (kosongkan = Rp 0)' : 'Tarif disesuaikan (Rp)'}</Label>
            <Input type="number" min="0" bind:value={overrideAdjustedFee} placeholder="0" class="text-[13px]" />
            {#if overrideTx?.calculated_fee != null}
              <p class="text-[11px] text-gray-400">Tarif saat ini: {formatCurrency(overrideTx.calculated_fee)}</p>
            {/if}
          </div>
        {/if}
        <div class="space-y-1.5">
          <Label class="text-[13px]">Alasan</Label>
          <Textarea bind:value={overrideReason} rows={3} placeholder="Jelaskan alasan override..." class="resize-none text-[13px]" />
        </div>
        {#if overrideError}
          <p class="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-600">{overrideError}</p>
        {/if}
        <div class="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button variant="outline" onclick={() => overrideOpen = false}>Batal</Button>
          <Button disabled={!overrideReason.trim() || overrideLoading} onclick={doOverride} class="!bg-[#e11d48] !text-white hover:!bg-[#be123c]">
            {overrideLoading ? 'Memproses...' : 'Terapkan Override'}
          </Button>
        </div>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Cancel dialog -->
<AlertDialog.Root
  open={cancelTargetId !== null}
  onOpenChange={(o) => { if (!o) { cancelTargetId = null; cancelReason = '' } }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Batalkan Transaksi</AlertDialog.Title>
      <AlertDialog.Description>Tindakan ini tidak dapat dibatalkan.</AlertDialog.Description>
    </AlertDialog.Header>
    <div class="space-y-1.5">
      <Label class="text-[13px] font-medium text-gray-700">Alasan pembatalan</Label>
      <Textarea bind:value={cancelReason} rows={3} placeholder="Masukkan alasan..." class="resize-none text-[13.5px]" />
    </div>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => { cancelTargetId = null; cancelReason = '' }}>Batal</AlertDialog.Cancel>
      <AlertDialog.Action
        disabled={!cancelReason.trim() || cancelLoading}
        onclick={doCancel}
        class="!bg-[#ef4444] !text-white hover:!bg-[#dc2626]"
      >
        {cancelLoading ? 'Memproses...' : 'Batalkan'}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
