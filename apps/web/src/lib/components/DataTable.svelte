<script lang="ts" generics="T extends Record<string, unknown>">
  import type { Snippet } from 'svelte'
  import { ChevronUp, ChevronDown, ChevronsUpDown, Download, Search, SlidersHorizontal } from 'lucide-svelte'
  import Pagination from './Pagination.svelte'

  export interface Column<T> {
    key: keyof T | string
    label: string
    sortable?: boolean
    visible?: boolean
    render?: Snippet<[T]>
    class?: string
  }

  const {
    data,
    columns: initialColumns,
    loading = false,
    selectedId = null,
    onRowClick,
    onSelectionChange,
    bulkActions,
    page,
    totalPages,
    totalRows,
    onPageChange,
    pageSize = 20,
    searchable = false,
    searchPlaceholder = 'Cari...',
    exportFilename,
    emptyMessage = 'Tidak ada data',
  } = $props<{
    data: T[]
    columns: Column<T>[]
    loading?: boolean
    selectedId?: string | null
    onRowClick?: (row: T) => void
    onSelectionChange?: (selected: T[]) => void
    bulkActions?: Snippet<[T[]]>
    page: number
    totalPages: number
    totalRows: number
    onPageChange: (page: number) => void
    pageSize?: number
    searchable?: boolean
    searchPlaceholder?: string
    exportFilename?: string
    emptyMessage?: string
  }>()

  let sortKey = $state<string | null>(null)
  let sortDir = $state<'asc' | 'desc'>('asc')
  let searchQuery = $state('')
  let columns = $state(initialColumns.map(c => ({ ...c, visible: c.visible ?? true })))
  let showColumnToggle = $state(false)
  let selectedIds = $state<Set<string>>(new Set())

  function getRowId(row: T): string {
    return (row as Record<string, unknown>).id as string ?? ''
  }

  function handleSort(key: string) {
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey = key
      sortDir = 'asc'
    }
  }

  function getCellValue(row: T, key: string): unknown {
    return key.split('.').reduce((obj: unknown, k) => {
      if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[k]
      return undefined
    }, row)
  }

  const visibleColumns = $derived(columns.filter(c => c.visible))

  const filteredData = $derived(
    searchQuery.trim() === ''
      ? data
      : data.filter(row =>
          visibleColumns.some(col => {
            const val = getCellValue(row, col.key as string)
            return String(val ?? '').toLowerCase().includes(searchQuery.toLowerCase())
          })
        )
  )

  const sortedData = $derived(
    sortKey === null
      ? filteredData
      : [...filteredData].sort((a, b) => {
          const av = getCellValue(a, sortKey!) ?? ''
          const bv = getCellValue(b, sortKey!) ?? ''
          const cmp = String(av).localeCompare(String(bv), 'id', { numeric: true })
          return sortDir === 'asc' ? cmp : -cmp
        })
  )

  const allSelected = $derived(
    sortedData.length > 0 && sortedData.every(row => selectedIds.has(getRowId(row)))
  )

  const someSelected = $derived(
    sortedData.some(row => selectedIds.has(getRowId(row))) && !allSelected
  )

  const selectedRows = $derived(
    sortedData.filter(row => selectedIds.has(getRowId(row)))
  )

  function toggleAll() {
    if (allSelected) {
      sortedData.forEach(row => selectedIds.delete(getRowId(row)))
    } else {
      sortedData.forEach(row => selectedIds.add(getRowId(row)))
    }
    selectedIds = new Set(selectedIds)
    onSelectionChange?.(selectedRows)
  }

  function toggleRow(row: T, e: MouseEvent) {
    e.stopPropagation()
    const id = getRowId(row)
    if (selectedIds.has(id)) {
      selectedIds.delete(id)
    } else {
      selectedIds.add(id)
    }
    selectedIds = new Set(selectedIds)
    onSelectionChange?.(selectedRows)
  }

  function exportCSV() {
    const headers = visibleColumns.map(c => c.label)
    const rows = sortedData.map(row =>
      visibleColumns.map(col => {
        const val = getCellValue(row, col.key as string)
        const str = String(val ?? '')
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
      })
    )
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportFilename ?? 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasBulk = $derived(!!onSelectionChange || !!bulkActions)
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      {#if selectedIds.size > 0 && bulkActions}
        <span class="text-xs font-medium text-slate-600">{selectedIds.size} dipilih</span>
        {@render bulkActions(selectedRows)}
      {:else if searchable}
        <div class="relative">
          <Search size={13} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            bind:value={searchQuery}
            class="h-8 rounded border border-surface-border pl-8 pr-3 text-xs text-slate-900
              outline-none focus:border-brand-500"
          />
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-1.5">
      {#if exportFilename}
        <button
          onclick={exportCSV}
          class="flex h-8 items-center gap-1.5 rounded border border-surface-border px-3
            text-xs text-slate-600 hover:bg-surface-muted"
        >
          <Download size={13} />
          Export CSV
        </button>
      {/if}

      <div class="relative">
        <button
          onclick={() => showColumnToggle = !showColumnToggle}
          class="flex h-8 items-center gap-1.5 rounded border border-surface-border px-3
            text-xs text-slate-600 hover:bg-surface-muted"
        >
          <SlidersHorizontal size={13} />
          Kolom
        </button>

        {#if showColumnToggle}
          <div class="absolute right-0 top-9 z-10 min-w-40 rounded border border-surface-border
            bg-surface p-2 shadow-sm">
            {#each columns as col, i}
              <label class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs
                text-slate-700 hover:bg-surface-muted">
                <input
                  type="checkbox"
                  checked={col.visible}
                  onchange={() => columns[i].visible = !columns[i].visible}
                  class="h-3 w-3"
                />
                {col.label}
              </label>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="overflow-x-auto rounded border border-surface-border">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="border-b border-surface-border bg-surface-muted">
          {#if hasBulk}
            <th class="w-8 px-3 py-2">
              <input
                type="checkbox"
                checked={allSelected}
                indeterminate={someSelected}
                onchange={toggleAll}
                class="h-3.5 w-3.5 cursor-pointer accent-brand-500"
              />
            </th>
          {/if}
          {#each visibleColumns as col}
            <th
              class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500
                {col.sortable ? 'cursor-pointer select-none hover:text-slate-700' : ''}
                {col.class ?? ''}"
              onclick={() => col.sortable && handleSort(col.key as string)}
            >
              <div class="flex items-center gap-1">
                {col.label}
                {#if col.sortable}
                  {#if sortKey === col.key}
                    {#if sortDir === 'asc'}
                      <ChevronUp size={12} />
                    {:else}
                      <ChevronDown size={12} />
                    {/if}
                  {:else}
                    <ChevronsUpDown size={12} class="text-slate-300" />
                  {/if}
                {/if}
              </div>
            </th>
          {/each}
        </tr>
      </thead>

      <tbody>
        {#if loading}
          {#each Array(pageSize) as _}
            <tr class="border-b border-surface-border">
              {#if hasBulk}
                <td class="px-3 py-2"><div class="h-3.5 w-3.5 rounded bg-slate-100"></div></td>
              {/if}
              {#each visibleColumns as _col}
                <td class="px-3 py-2">
                  <div class="h-3.5 w-3/4 animate-pulse rounded bg-slate-100"></div>
                </td>
              {/each}
            </tr>
          {/each}
        {:else if sortedData.length === 0}
          <tr>
            <td
              colspan={visibleColumns.length + (hasBulk ? 1 : 0)}
              class="px-3 py-10 text-center text-xs text-slate-400"
            >
              {emptyMessage}
            </td>
          </tr>
        {:else}
          {#each sortedData as row}
            {@const id = getRowId(row)}
            {@const isSelected = selectedIds.has(id)}
            <tr
              class="h-10 border-b border-surface-border transition-colors last:border-0
                {onRowClick ? 'cursor-pointer' : ''}
                {isSelected
                  ? 'bg-blue-50'
                  : id && selectedId === id
                    ? 'bg-brand-50'
                    : 'hover:bg-surface-muted'}"
              onclick={() => onRowClick?.(row)}
            >
              {#if hasBulk}
                <td class="px-3 py-2" onclick={(e) => toggleRow(row, e)}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    class="h-3.5 w-3.5 cursor-pointer accent-brand-500"
                    readonly
                  />
                </td>
              {/if}
              {#each visibleColumns as col}
                <td class="px-3 py-2 text-sm text-slate-900 {col.class ?? ''}">
                  {#if col.render}
                    {@render col.render(row)}
                  {:else}
                    {getCellValue(row, col.key as string) ?? '—'}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  <div class="flex items-center justify-between">
    <p class="text-xs text-slate-400">
      {totalRows} data{selectedIds.size > 0 ? `, ${selectedIds.size} dipilih` : ''}
    </p>
    <Pagination {page} {totalPages} {onPageChange} />
  </div>
</div>
