# Parkiye — Frontend Monorepo

Frontend monorepo untuk sistem manajemen parkir Parkiye.
Dibangun dengan SvelteKit + Tailwind CSS v4 + shadcn-svelte, dikonsumsi dari Go REST API.

## Workspace

```
apps/
  web/      # Dashboard utama — operator / admin / monitoring / engineer (port 5173)
  kiosk/    # Kiosk gate — entry & exit terminal (port 5174)
packages/
  config/   # Shared tsconfig
  env/      # Shared env schema (@t3-oss/env-core + zod)
```

## Tech Stack

| | web | kiosk |
|---|---|---|
| Framework | SvelteKit | SvelteKit |
| Language | TypeScript (strict) | TypeScript (strict) |
| Svelte | v5 (runes) | v5 (runes) |
| Styling | Tailwind CSS v4 | Tailwind CSS v4 |
| UI Components | shadcn-svelte | bits-ui |
| Icons | lucide-svelte | lucide-svelte |
| HTTP | axios | axios |
| Package Manager | bun | bun |

## Quick Start

```bash
bun install

# Jalankan semua apps
bun run dev

# Jalankan per app
bun run dev:web      # port 5173
bun run dev:kiosk    # port 5174
```

## Environment

### apps/web

```env
# apps/web/.env
PUBLIC_API_BASE_URL=http://localhost:8080
PUBLIC_POLL_INTERVAL_FAST=5000
PUBLIC_POLL_INTERVAL_NORMAL=10000
PUBLIC_POLL_INTERVAL_SLOW=30000
```

### apps/kiosk

```env
# apps/kiosk/.env
PUBLIC_API_BASE_URL=http://localhost:8080
```

## Auth

- **web**: JWT user token — disimpan di localStorage, inject via axios interceptor
- **kiosk**: Gate token — disimpan di localStorage via `getGateToken()`, client terpisah (`kioskClient`)

## Kiosk

App terpisah (`apps/kiosk`) yang berjalan di port 5174. Dirancang untuk display kiosk gate parkir.

```
/setup                  # Auth via gate_token
/gate/[gate_id]/        # Halaman utama gate (EntryGate / ExitGate)
/gate/[gate_id]/payment # Payment post-exit
/gate/[gate_id]/success # Success screen
/simulate               # Dev tool: backdate entry_at
```

### Fitur kiosk

- QR scan via kamera (jsQR Web Worker, 250ms interval)
- RFID via global `keydown` listener (HID emulation)
- QRIS payment: poll `/gate/payments/:id/poll` tiap 3s (pull Midtrans langsung)
- Tunai: tampilkan instruksi kasir + countdown
- Camera debug preview: toggle overlay + scanline animation (pojok kanan bawah ExitGate)
- Simulate panel: backdate `entry_at` untuk testing tarif

### Tunnel (development)

```bash
# Backend
cloudflared tunnel run parkir-api

# Kiosk frontend — dari apps/kiosk atau root
bun run --filter kiosk tunnel
# atau: cloudflared tunnel --url http://localhost:5174
```

Vite config kiosk menggunakan `allowedHosts: 'all'` dan `host: true` — wajib untuk cloudflared.

## Scripts

| Perintah | Deskripsi |
|---|---|
| `bun run dev` | Jalankan semua apps (turbo) |
| `bun run dev:web` | Hanya web (port 5173) |
| `bun run dev:kiosk` | Hanya kiosk (port 5174) |
| `bun run build` | Build semua apps |
| `bun run check-types` | TypeScript check semua apps |

## Konvensi

- Svelte 5 runes wajib — tidak ada `export let`, `$:`, `<slot>`
- Semua response API ikut shape `ApiResponse<T>` / `PaginatedResponse<T>`
- `PaymentStatus`: `pending | completed | failed | expired | refunded` (bukan `paid`)
- RFID: global `keydown` listener — tidak pakai hidden input
- Kiosk idle reset: 60s → `window.location.reload()`
