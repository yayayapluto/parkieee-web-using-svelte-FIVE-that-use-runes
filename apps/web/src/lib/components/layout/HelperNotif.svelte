<script lang="ts">
    import {helperNotif} from '$lib/utils/notif'
    import {CheckCircle, Info, X, XCircle} from 'lucide-svelte'

    const icons = {
        success: CheckCircle,
        error: XCircle,
        info: Info,
    }

    const colors = {
        success: 'text-emerald-500',
        error: 'text-red-500',
        info: 'text-blue-500',
    }

    const actionColors = {
        success: 'text-emerald-600 hover:text-emerald-700',
        error: 'text-red-600 hover:text-red-700',
        info: 'text-[#e11d48] hover:text-[#be123c]',
    }
</script>

{#if $helperNotif.length > 0}
    <div class="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        {#each $helperNotif as notif (notif.id)}
            <div
                    class="pointer-events-auto flex w-[360px] items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg"
            >
                <svelte:component
                        this={icons[notif.type]}
                        size={18}
                        class="mt-0.5 flex-shrink-0 {colors[notif.type]}"
                />
                <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-semibold text-gray-900">{notif.title}</p>
                    {#if notif.description}
                        <p class="mt-0.5 text-[12px] text-gray-500">{notif.description}</p>
                    {/if}
                </div>
                {#if notif.actionLabel && notif.onAction}
                    <button
                            onclick={notif.onAction}
                            class="flex-shrink-0 text-[13px] font-semibold {actionColors[notif.type]} focus:outline-none"
                    >
                        {notif.actionLabel}
                    </button>
                {/if}
                <button
                        onclick={() => helperNotif.dismiss(notif.id)}
                        class="flex-shrink-0 text-gray-300 hover:text-gray-500 focus:outline-none"
                        aria-label="Tutup"
                >
                    <X size={14}/>
                </button>
            </div>
        {/each}
    </div>
{/if}
