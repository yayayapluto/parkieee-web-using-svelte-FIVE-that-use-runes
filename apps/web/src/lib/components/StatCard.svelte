<script lang="ts">
  import type { Component } from 'svelte'

  const { title, value, sub, icon, trend } = $props<{
    title: string
    value: string | number
    sub?: string
    icon?: Component
    trend?: { value: number; label: string }
  }>()

  const trendPositive = (trend?.value ?? 0) >= 0
</script>

<div class="rounded border border-surface-border bg-surface p-4">
  <div class="flex items-start justify-between">
    <p class="text-xs font-medium text-slate-500">{title}</p>
    {#if icon}
      <span class="text-slate-400">
        <svelte:component this={icon} size={16} strokeWidth={1.75} />
      </span>
    {/if}
  </div>

  <p class="mt-2 text-xl font-semibold text-slate-900">{value}</p>

  <div class="mt-1 flex items-center gap-2">
    {#if trend}
      <span class="text-xs font-medium {trendPositive ? 'text-green-600' : 'text-red-500'}">
        {trendPositive ? '+' : ''}{trend.value}%
      </span>
      <span class="text-xs text-slate-400">{trend.label}</span>
    {:else if sub}
      <span class="text-xs text-slate-400">{sub}</span>
    {/if}
  </div>
</div>
