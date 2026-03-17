<script lang="ts">
  import * as AlertDialog from '$lib/components/ui/alert-dialog'
  import { Button } from '$lib/components/ui/button'

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
</script>

<AlertDialog.Root {open} onOpenChange={(o) => !o && onCancel()}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{title}</AlertDialog.Title>
      <AlertDialog.Description>{description}</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={onCancel} disabled={loading}>
        {cancelLabel}
      </AlertDialog.Cancel>
      <AlertDialog.Action
        onclick={onConfirm}
        disabled={loading}
        class={variant === 'danger' ? '!bg-[#ef4444] !text-white hover:!bg-[#dc2626]' : '!bg-[#e11d48] !text-white hover:!bg-[#be123c]'}
      >
        {loading ? 'Memproses...' : confirmLabel}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
