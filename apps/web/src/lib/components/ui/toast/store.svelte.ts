type ToastType = 'error' | 'success' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

let toasts = $state<Toast[]>([])
let nextId = 0

export function addToast(message: string, type: ToastType = 'info', duration = 4000) {
  const id = ++nextId
  toasts.push({ id, message, type })
  setTimeout(() => removeToast(id), duration)
}

export function removeToast(id: number) {
  const idx = toasts.findIndex(t => t.id === id)
  if (idx !== -1) toasts.splice(idx, 1)
}

export function toast(message: string) { addToast(message, 'info') }
export function toastError(message: string) { addToast(message, 'error', 5000) }
export function toastSuccess(message: string) { addToast(message, 'success') }

export { toasts }
