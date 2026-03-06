<script lang="ts">
  let {
    clockStr  = '',
    gateLabel = '',
    title     = 'SMK Taruna Bhakti',
  }: {
    clockStr:  string
    gateLabel: string
    title?:    string
  } = $props()
</script>

<div class="flex items-center border-b border-gray-300 shrink-0">
  <div class="bg-[#1a56db] px-5 py-3 flex items-center gap-2 shrink-0">
    <div class="w-3 h-3 rounded-full bg-white/80"></div>
    <span class="text-white text-sm font-bold tracking-[0.2em] uppercase">parkieee</span>
  </div>
  <div class="flex-1 text-center">
    <span class="text-gray-900 text-xl font-bold tracking-[0.15em] uppercase font-[family-name:var(--font-family-kiosk)]">{title}</span>
  </div>
  <div class="text-right px-5 py-3 shrink-0">
    <span class="text-gray-400 text-[13px] block">{clockStr}</span>
    <span class="text-gray-400 text-[13px] block">{gateLabel}</span>
  </div>
</div>
