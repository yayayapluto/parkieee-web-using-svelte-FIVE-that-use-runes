<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Search, X } from 'lucide-svelte'

  export interface FilterField {
    key: string
    label: string
    type: 'text' | 'select' | 'date'
    options?: { value: string; label: string }[]
    placeholder?: string
  }

  const { fields, values, onChange, onReset, actions } = $props<{
    fields: FilterField[]
    values: Record<string, string>
    onChange: (key: string, value: string) => void
    onReset: () => void
    actions?: Snippet
  }>()

  const hasActiveFilter = $derived(
    Object.values(values).some(v => v !== '' && v !== undefined)
  )
</script>

<div class="flex flex-wrap items-end gap-2 rounded border border-surface-border bg-surface px-4 py-3">
  {#each fields as field}
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-slate-500">{field.label}</label>

      {#if field.type === 'select'}
        <select
          value={values[field.key] ?? ''}
          onchange={(e) => onChange(field.key, (e.target as HTMLSelectElement).value)}
          class="h-8 rounded border border-surface-border px-2 text-xs text-slate-900
            outline-none focus:border-brand-500"
        >
          <option value="">Semua</option>
          {#each field.options ?? [] as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>

      {:else if field.type === 'date'}
        <input
          type="date"
          value={values[field.key] ?? ''}
          oninput={(e) => onChange(field.key, (e.target as HTMLInputElement).value)}
          class="h-8 rounded border border-surface-border px-2 text-xs text-slate-900
            outline-none focus:border-brand-500"
        />

      {:else}
        <div class="relative">
          <Search size={12} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={field.placeholder ?? `Cari ${field.label.toLowerCase()}...`}
            value={values[field.key] ?? ''}
            oninput={(e) => onChange(field.key, (e.target as HTMLInputElement).value)}
            class="h-8 rounded border border-surface-border pl-7 pr-3 text-xs text-slate-900
              outline-none focus:border-brand-500"
          />
        </div>
      {/if}
    </div>
  {/each}

  <div class="flex items-end gap-1.5">
    {#if hasActiveFilter}
      <button
        onclick={onReset}
        class="flex h-8 items-center gap-1.5 rounded border border-surface-border px-3
          text-xs text-slate-500 hover:bg-surface-muted"
      >
        <X size={12} />
        Reset
      </button>
    {/if}

    {#if actions}
      {@render actions()}
    {/if}
  </div>
</div>
