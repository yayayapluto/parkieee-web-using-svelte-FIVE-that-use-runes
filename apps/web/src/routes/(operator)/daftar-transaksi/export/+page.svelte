<script lang="ts">
  import { onMount } from 'svelte'
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'
  import { getExportHistory, clearExportHistory, type ExportHistoryItem } from '../data-table/export-utils'
  import { formatDateTime } from '$lib/utils/format'
  import { Trash2, FileText, FileSpreadsheet, File } from 'lucide-svelte'

  let history = $state<ExportHistoryItem[]>([])

  onMount(() => {
    history = getExportHistory()
  })

  function handleClear() {
    clearExportHistory()
    history = []
  }

  const FORMAT_CONFIG: Record<string, { label: string; class: string }> = {
    csv:  { label: 'CSV',  class: 'bg-green-100 text-green-700 hover:bg-green-100' },
    xlsx: { label: 'XLSX', class: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
    pdf:  { label: 'PDF',  class: 'bg-red-100 text-red-700 hover:bg-red-100' },
  }

  function filterTags(item: ExportHistoryItem): string[] {
    const tags: string[] = []
    if (item.filters.status)   tags.push(item.filters.status)
    if (item.filters.method)   tags.push(item.filters.method!.toUpperCase())
    if (item.filters.dateFrom) tags.push(`dari ${item.filters.dateFrom}`)
    if (item.filters.dateTo)   tags.push(`s/d ${item.filters.dateTo}`)
    return tags
  }
</script>

<div class="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
  <div class="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
    <div class="flex items-baseline gap-2">
      <h1 class="text-[15px] font-semibold text-gray-900">Riwayat Export</h1>
      {#if history.length > 0}
        <span class="text-[12px] text-gray-400">({history.length} entri)</span>
      {/if}
    </div>
    {#if history.length > 0}
      <Button
        variant="outline"
        class="h-8 gap-1.5 px-3 text-[13px] text-gray-500 hover:text-red-600"
        onclick={handleClear}
      >
        <Trash2 size={13} />
        Hapus semua
      </Button>
    {/if}
  </div>

  {#if history.length === 0}
    <div class="flex flex-1 flex-col items-center justify-center gap-2 text-gray-400">
      <FileText size={32} stroke-width={1.2} />
      <p class="text-[13px]">Belum ada riwayat export</p>
      <a href="/operator/transactions" class="text-[12px] text-[#e11d48] hover:underline">
        Kembali ke Transaksi →
      </a>
    </div>
  {:else}
    <div class="flex-1 overflow-y-auto">
      <table class="w-full text-[13px]">
        <thead class="sticky top-0 z-10 bg-white">
          <tr class="border-b border-gray-100">
            <th class="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Nama File</th>
            <th class="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Format</th>
            <th class="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Filter Aktif</th>
            <th class="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">Baris</th>
            <th class="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">Waktu</th>
          </tr>
        </thead>
        <tbody>
          {#each history as item (item.id)}
            <tr class="border-b border-gray-50 hover:bg-gray-50">
              <td class="px-4 py-2.5">
                <span class="font-mono text-[12px] text-gray-700">{item.filename}.{item.format}</span>
              </td>
              <td class="px-4 py-2.5">
                <Badge class={FORMAT_CONFIG[item.format]?.class ?? ''}>{FORMAT_CONFIG[item.format]?.label ?? item.format}</Badge>
              </td>
              <td class="px-4 py-2.5">
                <div class="flex flex-wrap gap-1">
                  {#each filterTags(item) as tag}
                    <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">{tag}</span>
                  {/each}
                  {#if filterTags(item).length === 0}
                    <span class="text-[12px] text-gray-300">Semua data</span>
                  {/if}
                </div>
              </td>
              <td class="px-4 py-2.5 text-right tabular-nums text-gray-600">{item.rowCount}</td>
              <td class="px-4 py-2.5 text-right text-[12px] text-gray-400">{formatDateTime(item.exportedAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
