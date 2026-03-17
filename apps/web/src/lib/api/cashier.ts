import { apiClient } from './client'
import type { ApiResponse } from '$lib/types/api'

export interface PendingCashierRequest {
  transaction_id: string
  transaction_code: string
  calculated_fee: number
  cashier_requested_at: string
}

export interface CashierEvent {
  type: 'cash' | 'qris_fail'
  transaction_id: string
  amount: number
  gate_name: string
  zone_name: string
}

export interface KioskEvent {
  type: 'done' | 'cancel'
  transaction_id: string
}

/**
 * Poll backend setiap 2 detik untuk transaksi awaiting_payment yang belum diproses.
 * Menggantikan SSE karena Cloudflare Tunnel memblokir streaming response.
 *
 * Cara kerja (Opsi A — updated_at based):
 * - Saat pertama load, catat `updated_at` terbaru dari semua tx awaiting_payment
 *   sebagai `cursor`. Ini adalah "garis batas" — semua yang sudah ada sebelum kasir
 *   buka halaman dianggap stale.
 * - Poll berikutnya: cek apakah ada tx awaiting_payment dengan `updated_at > cursor`.
 *   Kalau ada — itu transaksi baru yang baru saja di-exit oleh kiosk — fire event.
 * - Setelah fire, update cursor ke updated_at tx tersebut supaya tidak double-fire.
 * - Fire satu per satu (break setelah event pertama) supaya kasir bisa selesaikan dulu.
 */
export function listenCashierSSE(
  onEvent: (e: CashierEvent) => void,
): { close: () => void; pause: () => void; resume: () => void } {
  let stopped = false
  let paused = false
  // cursor: timestamp updated_at terbaru yang sudah diketahui kasir
  // Transaksi dengan updated_at > cursor dianggap "baru"
  let cursor = 0
  let initialized = false

  async function poll() {
    if (stopped) return

    if (paused) {
      if (!stopped) setTimeout(poll, 2000)
      return
    }

    try {
      // Pakai endpoint dedicated yang filter berdasarkan cashier_requested_at
      const sinceParam = initialized && cursor ? new Date(cursor).toISOString() : ''
      const res = await apiClient.get<{ data: PendingCashierRequest[] }>(
        '/api/v1/payments/cashier/pending',
        { params: sinceParam ? { since: sinceParam } : {} },
      )
      const requests: PendingCashierRequest[] = res.data.data ?? []

      if (!initialized) {
        // Pertama kali: set cursor ke sekarang, semua yang ada diabaikan
        cursor = Date.now()
        initialized = true
        console.log(`[POLL-KASIR] initialized, cursor=${new Date(cursor).toISOString()} (${requests.length} existing ignored)`)
        if (!stopped) setTimeout(poll, 2000)
        return
      }

      if (requests.length > 0) {
        // Ambil yang paling lama (index 0, sudah sorted ASC dari backend)
        const req = requests[0]
        // Update cursor ke cashier_requested_at req ini
        cursor = new Date(req.cashier_requested_at).getTime()
        console.log(`[POLL-KASIR] request detected: ${req.transaction_id} code=${req.transaction_code} fee=${req.calculated_fee} requested_at=${req.cashier_requested_at}`)
        onEvent({ type: 'cash', transaction_id: req.transaction_id, amount: req.calculated_fee, gate_name: '', zone_name: '' })
      }
    } catch (err) {
      console.warn('[POLL-KASIR] poll error (akan retry):', err)
    }

    if (!stopped) setTimeout(poll, 2000)
  }

  console.log('[POLL-KASIR] starting (updated_at cursor strategy)')
  poll()

  return {
    close() {
      stopped = true
      console.log('[POLL-KASIR] stopped')
    },
    pause() {
      paused = true
      console.log('[POLL-KASIR] paused (kasir sedang aktif)')
    },
    resume() {
      paused = false
      console.log('[POLL-KASIR] resumed')
    },
  }
}

export async function notifyCashierDone(transaction_id: string): Promise<void> {
  await apiClient.post<ApiResponse<null>>('/api/v1/payments/cashier/done', {
    type: 'done',
    transaction_id,
  })
}

export async function notifyCashierCancel(transaction_id: string): Promise<void> {
  await apiClient.post<ApiResponse<null>>('/api/v1/payments/cashier/done', {
    type: 'cancel',
    transaction_id,
  })
}
