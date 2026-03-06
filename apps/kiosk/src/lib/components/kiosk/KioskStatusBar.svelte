<script lang="ts">
  let {
    statusText,
    rightText  = '',
    rightColor = '#16a34a',
  }: {
    statusText: string
    rightText?: string
    rightColor?: string
  } = $props()
</script>

<div class="border-t border-gray-200 px-4 py-1.5 flex justify-between items-center shrink-0">
  <span class="text-gray-500 text-[13px] tracking-[0.2em] uppercase font-[family-name:var(--font-family-kiosk)]">
    {statusText}
  </span>
  {#if rightText}
    <span
      class="text-[13px] tracking-[0.2em] uppercase font-bold font-[family-name:var(--font-family-kiosk)]"
      style="color:{rightColor};"
    >
      {rightText}
    </span>
  {/if}
</div>
