<script lang="ts" generics="T extends Record<string, unknown>">
  import type { Snippet } from 'svelte'
  import {
    type ColumnDef,
    type RowSelectionState,
    type SortingState,
    getCoreRowModel,
    getSortedRowModel,
  } from '@tanstack/table-core'
  import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table'
  import { Button } from '$lib/components/ui/button'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Skeleton } from '$lib/components/ui/skeleton'
  import * as Pagination from '$lib/components/ui/pagination'
  import * as Table from '$lib/components/ui/table'
  import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-svelte'

  const {
    data,
    columns,
    loading = false,
    total,
    page,
    totalPages,
    pageSize = 20,
    onPageChange,
    onSelectionChange,
    bulkActions,
    emptyMessage = 'Tidak ada data',
  } = $props<{
    data: T[]
    columns: ColumnDef<T>[]
    loading?: boolean
    total: number
    page: number
    totalPages: number
    pageSize?: number
    onPageChange: (page: number) => void
    onSelectionChange?: (rows: T[]) => void
    bulkActions?: Snippet<[T[]]>
    emptyMessage?: string
  }>()

  let sorting = $state<SortingState>([])
  let rowSelection = $state<RowSelectionState>({})

  const table = createSvelteTable<T>({
    get data() { return data },
    columns,
    state: {
      get sorting() { return sorting },
      get rowSelection() { return rowSelection },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      sorting = typeof updater === 'function' ? updater(sorting) : updater
    },
    onRowSelectionChange: (updater) => {
      rowSelection = typeof updater === 'function' ? updater(rowSelection) : updater
      const selected = table.getSelectedRowModel().rows.map(r => r.original)
      onSelectionChange?.(selected)
    },
    enableRowSelection: !!onSelectionChange,
  })

  const selectedCount = $derived(Object.keys(rowSelection).length)
  const selectedRows = $derived(table.getSelectedRowModel().rows.map(r => r.original))
</script>

<div class="flex flex-1 flex-col overflow-hidden">

  {#if selectedCount > 0 && bulkActions}
    <div class="flex flex-shrink-0 items-center gap-2 border-b border-gray-100 bg-[#fff5f6] px-6 py-2.5">
      <span class="rounded-md border border-gray-200 bg-white px-3 py-1 text-[12.5px] font-semibold text-gray-700">
        {selectedCount} dipilih
      </span>
      {@render bulkActions(selectedRows)}
      <span class="ml-auto text-[12px] text-gray-400">{selectedCount} / {total} baris</span>
    </div>
  {/if}

  <div class="flex-1 overflow-auto">
    <Table.Root>
      <Table.Header>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row class="hover:bg-transparent">
            {#each headerGroup.headers as header (header.id)}
              <Table.Head class="whitespace-nowrap px-4 text-[11.5px] font-semibold uppercase tracking-wide text-gray-500">
                {#if !header.isPlaceholder}
                  {#if header.column.getCanSort()}
                    <button
                      onclick={header.column.getToggleSortingHandler()}
                      class="flex items-center gap-1 hover:text-gray-800"
                    >
                      <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
                      {#if header.column.getIsSorted() === 'asc'}
                        <ArrowUp size={12} />
                      {:else if header.column.getIsSorted() === 'desc'}
                        <ArrowDown size={12} />
                      {:else}
                        <ArrowUpDown size={12} class="text-gray-300" />
                      {/if}
                    </button>
                  {:else}
                    <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
                  {/if}
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body>
        {#if loading}
          {#each Array(pageSize) as _, i (i)}
            <Table.Row>
              {#each table.getAllColumns() as col (col.id)}
                <Table.Cell class="px-4">
                  <Skeleton class="h-4 w-3/4" />
                </Table.Cell>
              {/each}
            </Table.Row>
          {/each}
        {:else if table.getRowModel().rows.length === 0}
          <Table.Row>
            <Table.Cell colspan={table.getAllColumns().length} class="py-16 text-center text-[13px] text-gray-400">
              {emptyMessage}
            </Table.Cell>
          </Table.Row>
        {:else}
          {#each table.getRowModel().rows as row (row.id)}
            <Table.Row data-state={row.getIsSelected() ? 'selected' : undefined} class={row.getIsSelected() ? 'bg-[#fff5f6] hover:bg-[#fff5f6]' : ''}>
              {#each row.getVisibleCells() as cell (cell.id)}
                <Table.Cell class="px-4 text-[13.5px] text-gray-700">
                  <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
                </Table.Cell>
              {/each}
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
    </Table.Root>
  </div>

  <div class="flex flex-shrink-0 items-center justify-between border-t border-gray-100 px-6 py-3">
    <span class="text-[13px] text-gray-400">
      {total} data · halaman {page} dari {totalPages}
    </span>
    <Pagination.Root count={total} perPage={pageSize} page={page} onPageChange={onPageChange}>
      {#snippet children({ pages, currentPage: cp })}
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous class="h-8 text-[13px]" />
          </Pagination.Item>
          {#each pages as p (p.key)}
            {#if p.type === 'ellipsis'}
              <Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
            {:else}
              <Pagination.Item>
                <Pagination.Link
                  page={p}
                  isActive={cp === p.value}
                  class="h-8 w-8 text-[13px] {cp === p.value ? '!bg-[#e11d48] !text-white !border-[#e11d48]' : ''}"
                >
                  {p.value}
                </Pagination.Link>
              </Pagination.Item>
            {/if}
          {/each}
          <Pagination.Item>
            <Pagination.Next class="h-8 text-[13px]" />
          </Pagination.Item>
        </Pagination.Content>
      {/snippet}
    </Pagination.Root>
  </div>

</div>
