<script lang="ts">
  import KioskShell from '$lib/components/layout/KioskShell.svelte'

  const { children } = $props()
</script>

<KioskShell>
  {@render children()}
</KioskShell>
