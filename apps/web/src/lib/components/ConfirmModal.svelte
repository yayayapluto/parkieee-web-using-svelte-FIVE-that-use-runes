<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog'

  const {
    open = false,
    title,
    description,
    confirmLabel = 'Konfirmasi',
    cancelLabel = 'Batal',
    variant = 'default',
    loading = false,
    onConfirm,
    onCancel,
  } = $props<{
    open?: boolean
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'default' | 'danger'
    loading?: boolean
    onConfirm: () => void
    onCancel: () => void
  }>()

  const confirmClass = variant === 'danger'
    ? 'bg-red-500 text-white hover:bg-red-600'
    : 'bg-brand-500 text-white hover:bg-brand-600'
</script>

<Dialog.Root {open} onOpenChange={(o) => !o && onCancel()}>
  <Dialog.Content class="max-w-sm">
    <Dialog.Header>
      <Dialog.Title class="text-sm font-semibold text-slate-900">{title}</Dialog.Title>
      <Dialog.Description class="text-xs text-slate-500">{description}</Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer class="mt-4 flex justify-end gap-2">
      <button
        onclick={onCancel}
        disabled={loading}
        class="rounded border border-surface-border px-4 py-1.5 text-xs text-slate-600
          hover:bg-surface-muted disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        onclick={onConfirm}
        disabled={loading}
        class="rounded px-4 py-1.5 text-xs font-medium transition-colors
          disabled:cursor-not-allowed disabled:opacity-50 {confirmClass}"
      >
        {loading ? 'Memproses...' : confirmLabel}
      </button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
