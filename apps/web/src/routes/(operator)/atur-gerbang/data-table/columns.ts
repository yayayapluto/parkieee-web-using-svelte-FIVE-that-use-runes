import type { ColumnDef } from '@tanstack/table-core'
import { renderComponent } from '$lib/components/ui/data-table'
import type { Gate } from '$lib/types/domain'
import DataTableSortHeader from './data-table-sort-header.svelte'
import DataTableTypeBadge from './data-table-type-badge.svelte'
import DataTableStatusBadge from './data-table-status-badge.svelte'
import DataTableLastUsed from './data-table-last-used.svelte'
import DataTableActions from './data-table-actions.svelte'

export type GateRow = Gate & { zone_name: string }

export function createColumns(canManage: boolean, canPairing: boolean): ColumnDef<GateRow>[] {
  return [
    {
      id: 'name',
      accessorFn: (row) => row.name,
      header: ({ column }) => renderComponent(DataTableSortHeader, { column, label: 'Nama' }),
      cell: ({ row }) => row.original.name,
      enableHiding: false,
    },
    {
      id: 'zone_name',
      accessorFn: (row) => row.zone_name,
      header: ({ column }) => renderComponent(DataTableSortHeader, { column, label: 'Zona' }),
      cell: ({ row }) => row.original.zone_name,
    },
    {
      id: 'gate_type',
      accessorFn: (row) => row.gate_type,
      header: 'Tipe',
      cell: ({ row }) => renderComponent(DataTableTypeBadge, { type: row.original.gate_type }),
    },
    {
      id: 'location_desc',
      accessorFn: (row) => row.location_desc,
      header: 'Lokasi',
      cell: ({ row }) => row.original.location_desc || '—',
    },
    {
      id: 'token_last_used_at',
      accessorFn: (row) => row.token_last_used_at ?? '',
      header: ({ column }) => renderComponent(DataTableSortHeader, { column, label: 'Terakhir Aktif' }),
      cell: ({ row }) => renderComponent(DataTableLastUsed, { value: row.original.token_last_used_at }),
    },
    {
      id: 'is_active',
      accessorFn: (row) => row.is_active,
      header: 'Status',
      cell: ({ row }) => renderComponent(DataTableStatusBadge, { active: row.original.is_active }),
    },
    {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => renderComponent(DataTableActions, { gate: row.original, canManage, canPairing }),
    },
  ]
}
