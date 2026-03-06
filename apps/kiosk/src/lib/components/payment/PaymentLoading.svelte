<script lang="ts">
  import { Loader2 } from 'lucide-svelte'
  let { message }: { message: string } = $props()
</script>

<div class="flex flex-col items-center gap-4">
  <Loader2 size={36} class="animate-spin text-[#1a56db]" />
  <p class="text-gray-400 text-sm">{message}</p>
</div>
