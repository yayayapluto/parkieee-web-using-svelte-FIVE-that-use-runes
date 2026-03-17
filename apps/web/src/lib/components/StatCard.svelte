<script lang="ts">
  import { Card, CardContent } from '$lib/components/ui/card'
  import type { Component } from 'svelte'

  const { title, value, sub, icon, trend } = $props<{
    title: string
    value: string | number
    sub?: string
    icon?: Component
    trend?: { value: number; label: string }
  }>()

  const trendPositive = $derived((trend?.value ?? 0) >= 0)
</script>

<Card>
  <CardContent class="p-4">
    <div class="flex items-start justify-between">
      <p class="text-[13px] font-medium text-gray-500">{title}</p>
      {#if icon}
        <span class="text-gray-400">
          <icon size={16} strokeWidth={1.75} />
        </span>
      {/if}
    </div>
    <p class="mt-2 text-[22px] font-semibold text-gray-900">{value}</p>
    <div class="mt-1 flex items-center gap-2">
      {#if trend}
        <span class="text-[12px] font-medium {trendPositive ? 'text-green-600' : 'text-red-500'}">
          {trendPositive ? '+' : ''}{trend.value}%
        </span>
        <span class="text-[12px] text-gray-400">{trend.label}</span>
      {:else if sub}
        <span class="text-[12px] text-gray-400">{sub}</span>
      {/if}
    </div>
  </CardContent>
</Card>
