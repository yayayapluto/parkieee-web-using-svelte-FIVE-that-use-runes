<script lang="ts">
  import * as Popover from '$lib/components/ui/popover'
  import { Button } from '$lib/components/ui/button'
  import RangeCalendar from '$lib/components/ui/range-calendar/range-calendar.svelte'
  import { CalendarIcon, ChevronDown } from 'lucide-svelte'
  import {
    DateFormatter,
    getLocalTimeZone,
    today,
    type DateValue,
  } from '@internationalized/date'
  import type { DateRange } from 'bits-ui'

  let {
    value = $bindable<DateRange | undefined>(undefined),
    onValueChange,
    placeholder = 'Rentang tanggal',
    locale = 'id-ID',
  } = $props<{
    value?: DateRange | undefined
    onValueChange?: (v: DateRange | undefined) => void
    placeholder?: string
    locale?: string
  }>()

  const df = new DateFormatter(locale, { dateStyle: 'medium' })
  let open = $state(false)
  const tz = getLocalTimeZone()
  const todayDate = today(tz)
  const presets: { label: string; start: DateValue; end: DateValue }[] = [
    { label: 'Hari ini',    start: todayDate,                                               end: todayDate },
    { label: '7 hari',      start: todayDate.subtract({ days: 6 }),                        end: todayDate },
    { label: '30 hari',     start: todayDate.subtract({ days: 29 }),                       end: todayDate },
    { label: 'Bulan ini',   start: todayDate.set({ day: 1 }),                              end: todayDate },
    { label: 'Bulan lalu',  start: todayDate.subtract({ months: 1 }).set({ day: 1 }),      end: todayDate.set({ day: 1 }).subtract({ days: 1 }) },
  ]

  function applyPreset(preset: typeof presets[0]) {
    value = { start: preset.start, end: preset.end }
    onValueChange?.(value)
    open = false
  }

  function handleChange(v: DateRange | undefined) {
    value = v
    if (v?.start && v?.end) {
      onValueChange?.(v)
      open = false
    }
  }

  const label = $derived.by(() => {
    if (value?.start && value?.end) {
      return `${df.format(value.start.toDate(tz))} – ${df.format(value.end.toDate(tz))}`
    }
    if (value?.start) {
      return `${df.format(value.start.toDate(tz))} – ...`
    }
    return placeholder
  })
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="outline"
        class="w-full justify-start gap-1.5 text-[13px] font-normal {!value?.start ? 'text-muted-foreground' : ''}"
      >
        <CalendarIcon size={13} class="flex-shrink-0" />
        <span class="flex-1 truncate text-left">{label}</span>
        <ChevronDown size={13} class="ml-auto flex-shrink-0 opacity-50" />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-auto overflow-hidden p-0 !z-[200]" align="end">
    <div class="flex">
      <!-- Calendar kiri: 2 bulan + dropdown -->
      <RangeCalendar
        bind:value
        onValueChange={handleChange}
        numberOfMonths={1}
        captionLayout="dropdown"
        {locale}
        class="p-3"
      />
      <!-- Presets kanan -->
      <div class="flex flex-col gap-1 border-l border-gray-100 p-2">
        <p class="mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Preset</p>
        {#each presets as preset}
          <Button
            variant="outline"
            class="h-9 w-full justify-start px-3 text-[13px] text-gray-700"
            onclick={() => applyPreset(preset)}
          >
            {preset.label}
          </Button>
        {/each}
        {#if value?.start || value?.end}
          <Button
            variant="ghost"
            class="mt-auto h-8 w-full px-3 text-[12px] text-gray-400 hover:text-gray-700"
            onclick={() => { value = undefined; onValueChange?.(undefined) }}
          >
            Reset
          </Button>
        {/if}
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
