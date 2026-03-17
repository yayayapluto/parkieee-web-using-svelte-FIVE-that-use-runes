import type { ColumnDef } from '@tanstack/table-core'
import { renderComponent } from '$lib/components/ui/data-table'
import type { Transaction } from '$lib/types/domain'
import { formatCurrency } from '$lib/utils/format'
import DataTableSortHeader from './data-table-sort-header.svelte'
import DataTableActions from './data-table-actions.svelte'
import DataTableStatusBadge from './data-table-status-badge.svelte'
import DataTableMethodBadge from './data-table-method-badge.svelte'
import DataTableCode from './data-table-code.svelte'
import DataTableDate from './data-table-date.svelte'
import DataTableGate from './data-table-gate.svelte'
import DataTableFee from './data-table-fee.svelte'

export const columns: ColumnDef<Transaction>[] = [
  {
    id: 'no',
    enableHiding: false,
    enableSorting: false,
    header: '#',
    cell: ({ row, table }) => {
      const meta = table.options.meta as { pageOffset?: number } | undefined
      return (meta?.pageOffset ?? 0) + row.index + 1
    },
  },
  {
    id: 'transaction_code',
    accessorFn: (row) => String(row.transaction_code ?? ''),
    header: ({ column }) => renderComponent(DataTableSortHeader, { column, label: 'Kode' }),
    cell: ({ row }) => renderComponent(DataTableCode, { value: String(row.original.transaction_code ?? '') }),
    enableHiding: false,
  },
  {
    id: 'entry_at',
    accessorFn: (row) => String(row.entry_at ?? ''),
    header: ({ column }) => renderComponent(DataTableSortHeader, { column, label: 'Masuk' }),
    cell: ({ row }) => renderComponent(DataTableDate, { value: String(row.original.entry_at ?? '') }),
  },
  {
    id: 'entry_gate_id',
    accessorFn: (row) => String(row.entry_gate_id ?? ''),
    header: 'Gerbang',
    cell: ({ row }) => renderComponent(DataTableGate, { value: String(row.original.entry_gate_id ?? '') }),
  },
  {
    id: 'entry_method',
    accessorFn: (row) => String(row.entry_method ?? ''),
    header: 'Metode',
    cell: ({ row }) => renderComponent(DataTableMethodBadge, { method: String(row.original.entry_method ?? '') }),
  },
  {
    id: 'status',
    accessorFn: (row) => String(row.status ?? ''),
    header: ({ column }) => renderComponent(DataTableSortHeader, { column, label: 'Status' }),
    cell: ({ row }) => renderComponent(DataTableStatusBadge, { status: row.original.status }),
  },
  {
    id: 'calculated_fee',
    accessorFn: (row) => row.calculated_fee ?? null,
    header: ({ column }) => renderComponent(DataTableSortHeader, { column, label: 'Tarif', align: 'right' }),
    cell: ({ row }) => renderComponent(DataTableFee, { value: row.original.calculated_fee }),
  },
  {
    id: 'actions',
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => renderComponent(DataTableActions, { transaction: row.original }),
  },
]
