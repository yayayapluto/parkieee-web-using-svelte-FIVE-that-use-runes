<script lang="ts">
  import { formatCurrency } from '$lib/utils/format'
  import { Loader2 } from 'lucide-svelte'
  import type { VehicleTypeTariff } from '$lib/api/fees'

  let {
    tariffs,
    tarifIdx,
    tarifVisible,
  }: {
    tariffs:     VehicleTypeTariff[]
    tarifIdx:    number
    tarifVisible: boolean
  } = $props()

  function getTier1Amount(t: VehicleTypeTariff): number {
    if (!t.fee_config) return 0
    const f = t.fee_config.tiers?.find(x => x.tier_order === 1)
    return (f?.fee_amount ?? t.fee_config.base_fee) + t.fee_config.additional_fee
  }
  function getTier2Amount(t: VehicleTypeTariff): number {
    if (!t.fee_config) return 0
    const s = t.fee_config.tiers?.find(x => x.tier_order === 2)
    const l = t.fee_config.tiers?.find(x => x.is_last_tier)
    return (s?.fee_amount ?? l?.fee_amount ?? t.fee_config.base_fee) + t.fee_config.additional_fee
  }
  function getFeeNotes(t: VehicleTypeTariff): string[] {
    if (!t.fee_config) return []
    const notes: string[] = []
    if (t.fee_config.additional_fee > 0)
      notes.push(`Sudah termasuk biaya zona ${formatCurrency(t.fee_config.additional_fee)}`)
    if (t.fee_config.grace_period_minutes > 0)
      notes.push(`Gratis ${t.fee_config.grace_period_minutes} menit pertama`)
    if (t.minimum_fee > 0)
      notes.push(`Minimum ${formatCurrency(t.minimum_fee)}`)
    return notes
  }

  const currentTarif = $derived(tariffs[tarifIdx] ?? null)
</script>

<div class="flex-1 border-r border-gray-300 flex flex-col">
  <div
    class="flex-1 flex flex-col justify-center px-10 py-8 gap-4 transition-opacity duration-200"
    class:opacity-100={tarifVisible}
    class:opacity-0={!tarifVisible}
  >
    {#if tariffs.length === 0}
      <div class="flex items-center gap-2">
        <Loader2 size={14} class="animate-spin text-gray-400" />
        <span class="text-gray-400 text-[10px] tracking-[0.2em] uppercase">Memuat tarif...</span>
      </div>

    {:else if currentTarif}
      <span class="text-gray-400 text-[11px] tracking-[0.25em] uppercase">
        Tarif Parkir {currentTarif.name}{tariffs.length > 1 ? ` (${tarifIdx + 1}/${tariffs.length})` : ''}
      </span>

      <div class="flex justify-between items-baseline">
        <span class="text-gray-500 text-xl">1 (satu) jam pertama</span>
        <span class="text-gray-900 text-4xl font-bold">{formatCurrency(getTier1Amount(currentTarif))}</span>
      </div>

      <div class="h-px bg-gray-100"></div>

      <div class="flex justify-between items-baseline">
        <span class="text-gray-500 text-xl">Setiap jam berikutnya</span>
        <span class="text-gray-900 text-4xl font-bold">{formatCurrency(getTier2Amount(currentTarif))}</span>
      </div>

      {#if getFeeNotes(currentTarif).length > 0}
        <div class="flex flex-wrap gap-1.5 mt-2">
          {#each getFeeNotes(currentTarif) as note}
            <span class="text-[9px] font-medium tracking-[0.05em] uppercase text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-px leading-relaxed">
              {note}
            </span>
          {/each}
        </div>
      {/if}
    {/if}
  </div>

  <div class="border-t border-gray-100 px-4 py-1.5">
    <span class="text-gray-300 text-[9px] tracking-[0.25em] uppercase">TARIF BERLAKU MULAI 01 JAN 2025</span>
  </div>
</div>
