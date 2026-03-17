<script lang="ts">
  import * as Pagination from '$lib/components/ui/pagination'

  const { page, totalPages, total, pageSize = 20, onPageChange } = $props<{
    page: number
    totalPages: number
    total: number
    pageSize?: number
    onPageChange: (page: number) => void
  }>()
</script>

{#if totalPages > 1}
  <Pagination.Root count={total} perPage={pageSize} page={page} onPageChange={onPageChange}>
    {#snippet children({ pages, currentPage: cp })}
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous class="h-8 text-[13px]" />
        </Pagination.Item>
        {#each pages as p (p.key)}
          {#if p.type === 'ellipsis'}
            <Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
          {:else}
            <Pagination.Item>
              <Pagination.Link
                page={p}
                isActive={cp === p.value}
                class="h-8 w-8 text-[13px] {cp === p.value ? '!bg-[#e11d48] !text-white !border-[#e11d48]' : ''}"
              >
                {p.value}
              </Pagination.Link>
            </Pagination.Item>
          {/if}
        {/each}
        <Pagination.Item>
          <Pagination.Next class="h-8 text-[13px]" />
        </Pagination.Item>
      </Pagination.Content>
    {/snippet}
  </Pagination.Root>
{/if}
