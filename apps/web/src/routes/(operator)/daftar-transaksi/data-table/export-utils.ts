import type { Transaction, TransactionStatus, EntryMethod } from '$lib/types/domain'
import { formatDateTime, formatCurrency } from '$lib/utils/format'

export interface ExportFilters {
  status?: TransactionStatus | ''
  method?: EntryMethod | ''
  dateFrom?: string
  dateTo?: string
}

export interface ExportHistoryItem {
  id: string
  filename: string
  format: 'csv' | 'xlsx' | 'pdf'
  rowCount: number
  filters: ExportFilters
  exportedAt: string
}

const HISTORY_KEY = 'parkiye_export_history'
const MAX_HISTORY = 50

function buildFilename(filters: ExportFilters): string {
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15)
  const parts: string[] = [`export_trx_${ts}`]
  if (filters.status)   parts.push(filters.status)
  if (filters.method)   parts.push(filters.method)
  if (filters.dateFrom) parts.push(filters.dateFrom.replace(/-/g, ''))
  if (filters.dateTo)   parts.push(filters.dateTo.replace(/-/g, ''))
  return parts.join('_')
}

function saveHistory(item: Omit<ExportHistoryItem, 'id' | 'exportedAt'>) {
  const existing: ExportHistoryItem[] = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  const entry: ExportHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    exportedAt: new Date().toISOString(),
  }
  const updated = [entry, ...existing].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

export function getExportHistory(): ExportHistoryItem[] {
  if (typeof localStorage === 'undefined') return []
  return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
}

export function clearExportHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

function toRows(data: Transaction[]) {
  return data.map(tx => ({
    Kode: tx.transaction_code,
    Masuk: tx.entry_at ? formatDateTime(tx.entry_at) : '—',
    Keluar: tx.exit_at ? formatDateTime(tx.exit_at) : '—',
    'Gate Masuk': tx.entry_gate_id,
    Metode: tx.entry_method.toUpperCase(),
    Status: tx.status,
    Tarif: tx.calculated_fee != null ? tx.calculated_fee : '',
  }))
}

export function exportCSV(data: Transaction[], filters: ExportFilters = {}) {
  const filename = buildFilename(filters)
  const rows = toRows(data)
  const headers = Object.keys(rows[0] ?? {})
  const csv = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => {
        const v = String((r as Record<string, unknown>)[h] ?? '')
        return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
      }).join(',')
    ),
  ].join('\n')
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`)
  saveHistory({ filename, format: 'csv', rowCount: data.length, filters })
}

export async function exportXLSX(data: Transaction[], filters: ExportFilters = {}) {
  const filename = buildFilename(filters)
  const { utils, writeFile } = await import('xlsx')
  const rows = toRows(data)
  const ws = utils.json_to_sheet(rows)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Transaksi')
  writeFile(wb, `${filename}.xlsx`)
  saveHistory({ filename, format: 'xlsx', rowCount: data.length, filters })
}

export async function exportPDF(data: Transaction[], filters: ExportFilters = {}) {
  const filename = buildFilename(filters)
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ orientation: 'landscape' })
  const rows = toRows(data)
  const headers = Object.keys(rows[0] ?? {})
  autoTable(doc, {
    head: [headers],
    body: rows.map(r => headers.map(h => String((r as Record<string, unknown>)[h] ?? '—'))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [225, 29, 72] },
  })
  doc.save(`${filename}.pdf`)
  saveHistory({ filename, format: 'pdf', rowCount: data.length, filters })
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
