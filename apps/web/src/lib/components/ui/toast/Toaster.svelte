<script lang="ts">
  import { toasts, removeToast } from './store.svelte'
  import { X, CheckCircle, AlertCircle, Info } from 'lucide-svelte'
</script>

<div class="fixed bottom-4 right-4 z-[500] flex flex-col gap-2 pointer-events-none">
  {#each toasts as t (t.id)}
    <div
      class="pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg text-[13px] min-w-[280px] max-w-[360px] animate-in slide-in-from-right-4 fade-in duration-200
        {t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
         t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
         'bg-white border-gray-200 text-gray-800'}"
    >
      <span class="mt-0.5 flex-shrink-0">
        {#if t.type === 'error'}
          <AlertCircle size={15} class="text-red-500" />
        {:else if t.type === 'success'}
          <CheckCircle size={15} class="text-emerald-500" />
        {:else}
          <Info size={15} class="text-gray-400" />
        {/if}
      </span>
      <span class="flex-1 leading-snug">{t.message}</span>
      <button onclick={() => removeToast(t.id)} class="flex-shrink-0 opacity-50 hover:opacity-100 mt-0.5">
        <X size={13} />
      </button>
    </div>
  {/each}
</div>
