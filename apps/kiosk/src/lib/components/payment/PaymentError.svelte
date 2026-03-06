<script lang="ts">
  import { XCircle } from 'lucide-svelte'
  let {
    errorMsg,
    onRetry,
    onHome,
  }: {
    errorMsg: string
    onRetry:  () => void
    onHome:   () => void
  } = $props()
</script>

<div class="flex flex-col items-center gap-5 text-center max-w-[360px]">
  <XCircle size={48} class="text-red-500" strokeWidth={1.25} />
  <p class="text-base font-bold text-red-600">Pembayaran Gagal</p>
  <p class="text-sm text-gray-500">{errorMsg}</p>
  <div class="flex gap-3">
    <button
      onclick={onRetry}
      class="border border-gray-300 bg-white px-6 py-2.5 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      Coba Lagi
    </button>
    <button
      onclick={onHome}
      class="border border-gray-300 bg-white px-6 py-2.5 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      Kembali
    </button>
  </div>
</div>
