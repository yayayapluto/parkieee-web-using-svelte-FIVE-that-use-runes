<script lang="ts">
    import type {Snippet} from 'svelte'
    import {Separator} from '$lib/components/ui/separator'

    const {title, description, actions, filters, children} = $props<{
        title: string
        description?: string
        actions?: Snippet
        filters?: Snippet
        children: Snippet
    }>()
</script>

<div class="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">

    <div class="flex flex-shrink-0 items-start justify-between px-6 pt-4 pb-4">
        <div>
            <h1 class="text-[18px] font-semibold text-gray-900">{title}</h1>
            {#if description}
                <p class="mt-0.5 text-[13px] text-gray-400">{description}</p>
            {/if}
        </div>
        {#if actions}
            <div class="flex items-center gap-2">
                {@render actions()}
            </div>
        {/if}
    </div>

    {#if filters}
        <Separator/>
        <div class="flex flex-shrink-0 flex-col gap-3 px-6 py-3">
            {@render filters()}
        </div>
    {/if}

    <Separator/>

    <div class="flex flex-1 flex-col overflow-hidden">
        {@render children()}
    </div>

</div>
