<script lang="ts">
  let { text }: { text: string } = $props()
</script>

<div class="bg-[#eff6ff] border-b border-gray-300 py-1 px-4 text-center shrink-0">
  <span class="text-[#1a56db] text-base font-semibold tracking-[0.2em] uppercase font-[family-name:var(--font-family-kiosk)]">
    {text}
  </span>
</div>
