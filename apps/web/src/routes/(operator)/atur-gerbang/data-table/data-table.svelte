<script lang="ts" module>
  export interface TableContext {
    openDetail: (gate: import('./columns').GateRow) => void
    openToggle: (gate: import('./columns').GateRow) => void
    openPairing: (gate: import('./columns').GateRow) => void
  }
</script>

<script lang="ts">
  import {
    type SortingState,
    type VisibilityState,
    type PaginationState,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
  } from '@tanstack/table-core'
  import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table'
  import { Skeleton } from '$lib/components/ui/skeleton'
  import * as Table from '$lib/components/ui/table'
  import * as Pagination from '$lib/components/ui/pagination'
  import * as Select from '$lib/components/ui/select'
  import { setContext } from 'svelte'
  import { createColumns } from './columns'
  import type { GateRow } from './columns'

  let {
    data,
    loading,
    canManage,
    canPairing,
    openDetail,
    openToggle,
    openPairing,
    serverTotal = 0,
    page = $bindable(1),
    pageSize = $bindable(20),
  } = $props<{
    data: GateRow[]
    loading: boolean
    canManage: boolean
    canPairing: boolean
    openDetail: (gate: GateRow) => void
    openToggle: (gate: GateRow) => void
    openPairing: (gate: GateRow) => void
    serverTotal?: number
    page?: number
    pageSize?: number
  }>()

  setContext<TableContext>('gateTableActions', {
    openDetail: (gate) => openDetail(gate),
    openToggle: (gate) => openToggle(gate),
    openPairing: (gate) => openPairing(gate),
  })

  let sorting = $state<SortingState>([])
  let columnVisibility = $state<VisibilityState>({})

  const pagination = $derived<PaginationState>({ pageIndex: page - 1, pageSize })
  const columns = $derived(createColumns(canManage, canPairing))
  const totalPages = $derived(Math.max(1, Math.ceil(serverTotal / pageSize)))

  const table = createSvelteTable({
    get data() { return data },
    get columns() { return columns },
    get rowCount() { return serverTotal },
    state: {
      get sorting() { return sorting },
      get columnVisibility() { return columnVisibility },
      get pagination() { return pagination },
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (u) => { sorting = typeof u === 'function' ? u(sorting) : u },
    onColumnVisibilityChange: (u) => { columnVisibility = typeof u === 'function' ? u(columnVisibility) : u },
  })

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return
    page = p
  }

  function changePageSize(size: number) {
    pageSize = size
    page = 1
  }

  function buildPages(cp: number, total: number): (number | 'ellipsis')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages: (number | 'ellipsis')[] = []
    const delta = 1
    const left = Math.max(2, cp - delta)
    const right = Math.min(total - 1, cp + delta)
    pages.push(1)
    if (left > 2) pages.push('ellipsis')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < total - 1) pages.push('ellipsis')
    pages.push(total)
    return pages
  }

  const PAGE_SIZES = [10, 20, 50, 100]
</script>

<div class="flex flex-1 flex-col overflow-hidden">
  <div class="flex-1 overflow-x-auto overflow-y-auto">
    <Table.Root>
      <Table.Header class="sticky top-0 z-10 bg-white">
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row class="hover:bg-transparent">
            {#each headerGroup.headers as header (header.id)}
              <Table.Head class="whitespace-nowrap border-b border-gray-200 px-4">
                {#if !header.isPlaceholder}
                  <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body>
        {#if loading}
          {#each Array(8) as _, i (i)}
            <Table.Row class="hover:bg-transparent">
              {#each columns as col, j (j)}
                <Table.Cell class="px-4 py-3">
                  <Skeleton class="h-4 {j === columns.length - 1 ? 'w-8' : 'w-full'} min-w-8" />
                </Table.Cell>
              {/each}
            </Table.Row>
          {/each}
        {:else}
          {#each table.getRowModel().rows as row (row.id)}
            <Table.Row class="cursor-pointer" onclick={() => openDetail(row.original)}>
              {#each row.getVisibleCells() as cell (cell.id)}
                <Table.Cell class="px-4">
                  <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
                </Table.Cell>
              {/each}
            </Table.Row>
          {:else}
            <Table.Row>
              <Table.Cell colspan={columns.length} class="py-16 text-center text-[13px] text-gray-400">
                Tidak ada gerbang
              </Table.Cell>
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
    </Table.Root>
  </div>

  <!-- Pagination -->
  <div class="flex flex-shrink-0 items-center justify-between border-t border-gray-100 px-4 py-3">
    <!-- Page numbers -->
    <Pagination.Root
      count={serverTotal}
      perPage={pageSize}
      page={page}
      onPageChange={goToPage}
      class="mx-0 w-auto justify-start"
    >
      {#snippet children({ currentPage: cp })}
        {@const pages = buildPages(cp, totalPages)}
        <Pagination.Content class="gap-1">
          <Pagination.Item>
            <Pagination.Previous class="h-8 gap-1 border border-gray-200 bg-white px-2.5 text-[13px] text-gray-600 hover:bg-gray-50 disabled:opacity-40" />
          </Pagination.Item>

          <div class="hidden sm:contents">
            {#each pages as p, i (i)}
              {#if p === 'ellipsis'}
                <Pagination.Item><Pagination.Ellipsis class="h-8 w-8" /></Pagination.Item>
              {:else}
                <Pagination.Item>
                  <Pagination.Link
                    page={{ type: 'page', value: p }}
                    isActive={cp === p}
                    class="h-8 w-8 text-[13px] {cp === p ? '!bg-[#e11d48] !text-white !border-[#e11d48]' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
                  >{p}</Pagination.Link>
                </Pagination.Item>
              {/if}
            {/each}
          </div>

          <Pagination.Item>
            <Pagination.Next class="h-8 gap-1 border border-gray-200 bg-white px-2.5 text-[13px] text-gray-600 hover:bg-gray-50 disabled:opacity-40" />
          </Pagination.Item>
        </Pagination.Content>
      {/snippet}
    </Pagination.Root>

    <!-- Rows per page (kanan) -->
    <div class="flex items-center gap-2">
      <span class="hidden text-[12px] text-gray-400 sm:inline">Tampilkan</span>
      <Select.Root
        type="single"
        value={String(pageSize)}
        onValueChange={(v) => changePageSize(Number(v))}
      >
        <Select.Trigger class="h-8 w-20 text-[13px]">
          {pageSize}
        </Select.Trigger>
        <Select.Content>
          {#each PAGE_SIZES as size}
            <Select.Item value={String(size)}>{size}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      <span class="text-[12px] text-gray-400">per halaman</span>
    </div>
  </div>
</div>
