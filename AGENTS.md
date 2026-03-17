# AGENTS.md — Parkiye Web

Web client untuk sistem manajemen parkir Parkiye.
Mengonsumsi Go REST API. Baca seluruh dokumen sebelum menulis satu baris kode pun.

---

## 1. Konteks Sistem

Parkiye adalah sistem manajemen parkir **single-tenant** berbasis REST API (Go + Fiber).
Frontend ini adalah web client yang mengonsumsi API tersebut.
Tidak ada multi-tenancy — semua user adalah internal staf atau kiosk display.

Backend base URL dikonfigurasi via `packages/env`.
Auth menggunakan JWT (access token) yang disimpan di **localStorage**.

---

## 2. Scaffold & Tooling

Project ini di-generate oleh **Better T Stack** (`bts.jsonc` di root).
Reproducible command:
```
bun create better-t-stack@latest . --frontend svelte --addons turborepo --package-manager bun
```

Turborepo di sini hanya untuk task orchestration (`turbo dev`, `turbo build`) — ini **satu repo**,
bukan multi-app monorepo. Struktur workspace:

```
apps/
  web/          ← SvelteKit app utama (operator/admin/monitoring/engineer dashboard)
  kiosk/        ← SvelteKit app terpisah khusus kiosk gate (port 5174)
packages/
  config/       ← shared tsconfig (tsconfig.base.json)
  env/          ← shared env validator (@t3-oss/env-core + zod)
```

Kode dashboard ada di `apps/web/src/`. Kode kiosk ada di `apps/kiosk/src/`.

### apps/kiosk — App Terpisah

`apps/kiosk` adalah SvelteKit app mandiri dengan stack sendiri:
- Port: `5174` (via `vite dev --port 5174`)
- Auth: gate token (bukan JWT user), disimpan di localStorage
- Routing: `/setup`, `/gate/[gate_id]`, `/simulate`
- QR scanner: jsQR via Web Worker blob (`$lib/workers/qr-scanner.worker.ts`)
- Tunnel: `pnpm tunnel` = `cloudflared tunnel --url http://localhost:5174`
- Vite config: `allowedHosts: 'all'`, `host: true` — wajib untuk cloudflared

Struktur `apps/kiosk/src/`:
```
lib/
  api/          # client.ts, transactions.ts, payments.ts, fees.ts, gates.ts, vehicles.ts
  components/
    EntryGate.svelte          # komponen gate masuk (QR scan + RFID + tiket modal)
    ExitGate.svelte           # komponen gate keluar (QR/RFID + payment modal + camera preview)
    kiosk/                    # sub-komponen: Header, SubHeader, StatusBar, Modal, dll
    payment/                  # PaymentSelect, PaymentQRIS, PaymentCash, dll
  types/        # api.d.ts, domain.d.ts (PaymentStatus: pending|completed|failed|expired|refunded)
  utils/        # auth.ts (gate token helpers), format.ts, polling.ts
  workers/
    qr-scanner.worker.ts      # jsQR Web Worker untuk scan QR dari kamera
routes/
  +layout.svelte / +layout.ts  # ssr = false
  +page.svelte                 # redirect ke /gate/[id] atau /setup
  setup/                       # auth gate via gate_token
  gate/[gate_id]/              # halaman utama gate (entry/exit auto-detect dari gate_type)
  gate/[gate_id]/payment/      # payment page (post-exit)
  gate/[gate_id]/success/      # success screen
  simulate/                    # dev tool: backdate entry_at transaksi open
```

### Kiosk — Konvensi Penting

- **PaymentStatus** di kiosk: Go API kini return `'paid'` sebagai status canonical. `'completed'` adalah alias lama — gunakan `'paid'` untuk kode baru
- **RFID**: global `document.addEventListener('keydown')` — tidak pakai hidden input, karena focus bisa hilang
- **QR Camera**: `jsQR` via Web Worker blob, scan setiap 250ms, cooldown 3s setelah berhasil scan
- **QRIS polling**: `GET /gate/payments/:id/poll` tiap 3s — hit Midtrans API langsung (bukan cuma cek DB)
- **Camera debug preview**: tombol kamera pojok kanan bawah ExitGate — toggle preview overlay + scanline animation
- **Sim page** (`/sim`): menggantikan `/simulate` — dropdown transaksi open, set durasi backdate, pakai `PATCH /gate/transactions/:id/simulate`
- **Idle reset**: 60s di gate → `window.location.reload()`
- RFID exit fallback: kalau transaksi `awaiting_payment` (kartu ditempel ulang), skip `recordExit`, langsung payment modal

---

## 3. Tech Stack

| Layer | Pilihan | Keterangan |
|---|---|---|
| Framework | **SvelteKit** | SSR + file-based routing |
| Language | **TypeScript** | strict mode, config dari `packages/config` |
| Svelte version | **Svelte 5** | runes syntax — `$state`, `$props`, `$derived`, `$effect`, `{@render}` |
| Styling | **Tailwind CSS v4** | via `@tailwindcss/vite` — tidak ada `tailwind.config.ts` |
| Component Library | **shadcn-svelte** | Svelte 5 + Tailwind v4 compatible, komponen di `$lib/components/ui/` |
| Charts | **echarts** (raw) | wrapper Svelte dibuat sendiri di `$lib/components/charts/` |
| Icons | **lucide-svelte** | tree-shakeable |
| HTTP Client | **axios** | wrapped di `$lib/api/client.ts` |
| State | **Svelte 5 runes** | `$state`, `$derived` — tidak perlu store eksternal |
| Form | **`$state` + Zod** | validasi manual, Zod sudah ada di workspace catalog |
| Env validation | **`@t3-oss/env-core`** | didefinisikan di `packages/env/src/web.ts` |
| Date/Time | **date-fns** | formatting timestamp |
| Polling | **`setInterval`** | default realtime — tidak ada WebSocket di MVP |
| Package Manager | **bun** | |

### Install command (dari root)
```bash
cd apps/web
bunx shadcn-svelte@latest init
bun add echarts lucide-svelte date-fns axios
```

---

## 4. Tailwind v4 — Aturan Wajib

Tailwind v4 tidak pakai `tailwind.config.ts`. Konfigurasi dilakukan via CSS:

```css
/* app.css */
@import "tailwindcss";

@theme {
  --color-brand-50: #f0f4ff;
  --color-brand-100: #dce6ff;
  --color-brand-500: #2c4a8f;
  --color-brand-600: #1e3570;
  --color-brand-700: #152660;
  --color-brand-900: #0b1840;

  --color-surface: #ffffff;
  --color-surface-muted: #f8f9fb;
  --color-surface-border: #e2e6ed;

  --font-family-sans: 'Inter', system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;
}
```

Jangan buat `tailwind.config.ts` — tidak dipakai di v4.
Jangan install `autoprefixer` atau `postcss` secara manual — sudah di-handle `@tailwindcss/vite`.

---

## 5. Svelte 5 — Aturan Wajib

Project ini Svelte 5. Jangan pakai syntax Svelte 4.

```svelte
<!-- ✅ Svelte 5 -->
<script lang="ts">
  let count = $state(0)
  const double = $derived(count * 2)
  const { label, onClick } = $props<{ label: string; onClick: () => void }>()
</script>

<!-- ❌ Svelte 4 — jangan pakai -->
<script lang="ts">
  export let label: string
  $: double = count * 2
</script>
```

Layout pakai `{@render children()}`, bukan `<slot>`:
```svelte
<script lang="ts">
  const { children } = $props()
</script>
{@render children()}
```

---

## 6. Design System

Lihat `style-admin-panel.md` untuk spesifikasi visual lengkap (font, warna, spacing, komponen).

Ringkasan keputusan desain utama:

- **Layout Vantus ERP style**: topbar (h-16) + sidebar (w-56) + main content
- **Satu card putih** per halaman: berisi page title → filter → tabel → pagination
- **Background body**: `#f4f4f5`, card punya `margin p-6` dari semua sisi
- **Font**: DM Sans saja
- **Primary accent**: `#e11d48` (rose-600)
- **Spacing kelipatan 8** — 8/16/24/32px. Tidak ada nilai ganjil.
- **User info ada di footer sidebar** — bukan di topbar. Topbar hanya logo + breadcrumb + notif.

---

## 7. Struktur Folder (`apps/web/src/`)

```
src/
├── app.html
├── app.css                    # @import tailwindcss + @theme tokens + DM Sans import
├── app.d.ts
│
├── lib/
│   ├── api/
│   │   ├── client.ts          # fetch wrapper — auto-inject JWT, handle 401
│   │   ├── auth.ts
│   │   ├── zones.ts
│   │   ├── gates.ts
│   │   ├── vehicles.ts
│   │   ├── rfid.ts
│   │   ├── fees.ts
│   │   ├── transactions.ts
│   │   ├── payments.ts
│   │   ├── overrides.ts
│   │   ├── ocr.ts
│   │   └── audit.ts
│   │
│   ├── components/
│   │   ├── ui/                # shadcn-svelte components (auto-generated, jangan edit manual)
│   │   ├── charts/            # ECharts wrapper components (buat sendiri)
│   │   │   └── LineChart.svelte
│   │   └── layout/
│   │       ├── AppShell.svelte
│   │       ├── Sidebar.svelte
│   │       ├── TopBar.svelte
│   │       └── KioskShell.svelte
│   │
│   ├── types/
│   │   ├── api.d.ts           # response shape dari backend
│   │   └── domain.d.ts        # Zone, Gate, Transaction, dll
│   │
│   └── utils/
│       ├── format.ts          # currency, date, duration formatters
│       ├── plate.ts           # normalisasi plat nomor
│       ├── role.ts            # role check helpers + ROUTE_ROLES
│       └── auth.ts            # localStorage token helpers + getPermissions()
│
└── routes/
    ├── +layout.svelte         # root layout
    ├── +layout.ts             # ssr = false
    ├── +page.svelte           # redirect by role
    ├── masuk/                 # halaman login
    ├── (operator)/            # route group operator — guard ['operator','admin']
    ├── (cashier)/             # route group kasir — guard can('cashier.ability')
    ├── (admin)/               # route group admin — guard ['admin']
    ├── (monitoring)/          # route group monitoring — guard ['owner','admin']
    └── (engineer)/            # route group engineer — guard ['engineer','admin']
```

---

## 8. Auth Flow

- Login via `POST /api/v1/auth/login` → terima `access_token`
- Simpan `access_token` di **localStorage** (`key: "parkiye_token"`)
- `$lib/utils/auth.ts` expose: `getToken()`, `setToken(t)`, `clearToken()`, `getRole()`, `getPermissions()`
- Setiap request lewat axios interceptor yang auto-inject `Authorization: Bearer <token>`
- Response `401` → axios interceptor clear token + `goto('/login')` otomatis

### Data Fetching

Semua data fetching dilakukan **client-side di `+page.svelte`** via `onMount` + axios.
Tidak ada `+page.server.ts` untuk fetching — server tidak bisa baca localStorage.
`+page.server.ts` tidak dipakai sama sekali.

### Route Guard

Guard dilakukan **client-side di `+layout.svelte`** masing-masing journey via `onMount`.
Tidak ada server-side guard. Dua lapis proteksi:

1. `+layout.svelte` tiap journey — cek token + role di `onMount`, redirect ke `/login` kalau tidak valid
2. Axios interceptor — kalau API return 401, auto clear token + redirect ke `/login`

```svelte
<!-- contoh: apps/web/src/routes/(operator)/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { getToken, getRole } from '$lib/utils/auth'
  import { hasRole } from '$lib/utils/role'

  const { children } = $props()

  onMount(() => {
    if (!getToken() || !hasRole(['operator', 'admin'], getRole())) {
      goto('/masuk')
    }
  })
</script>

{@render children()}
```

`(cashier)/+layout.svelte` menggunakan permission bukan role:
```svelte
onMount(() => {
  if (!getToken() || !can('cashier.ability')) goto('/masuk')
})
```

### Role-based Access (Route Level)

Role didapat dari JWT payload yang di-decode client-side (tanpa verifikasi signature — verifikasi tetap di backend).

```ts
// $lib/utils/role.ts
export const ROUTE_ROLES: Record<string, string[]> = {
  '/daftar-transaksi': ['operator', 'admin'],
  '/atur-gerbang':     ['operator', 'admin'],
  '/tindakan':         ['operator', 'admin'],
  '/kasir':            ['cashier', 'admin'],
  '/admin':            ['admin'],
  '/monitoring':       ['owner', 'admin'],
  '/engineer':         ['engineer', 'admin'],
  '/kiosk':            ['*'],
}

export function hasRole(required: string[], userRole: string | null): boolean {
  if (required.includes('*')) return true
  if (!userRole) return false
  return required.includes(userRole)
}
```

### Permission-based Access (UI Element Level)

**Semua kontrol visibilitas elemen UI (tombol, aksi, bulk bar) menggunakan permission, bukan role.**

Ini konsisten dengan cara Go API backend enforce akses — middleware `RequirePermission("gate.override")`
sudah permission-based, bukan role-based. Frontend mengikuti pola yang sama.

**Mengapa permission, bukan role:**
- Role bersifat label — permission adalah kemampuan nyata
- Satu permission bisa dimiliki banyak role (`gate.override` dimiliki operator DAN admin)
- Kalau pakai role: `if role === "operator" || role === "admin"` — rapuh, drift kalau matrix berubah
- Kalau pakai permission: `if permissions.includes("gate.override")` — benar secara semantik, tidak perlu update frontend kalau matrix berubah di DB

**Permission matrix (dari Go API seed):**
```
operator  → gate.override
admin     → gate.override, fee.edit, report.view, user.manage, zone.manage, rfid.manage, config.edit
owner     → report.view, fee.edit, zone.manage, config.edit
engineer  → audit.read, config.edit
```

**JWT payload** berisi:
```json
{
  "sub": "uuid",
  "email": "user@example.com",
  "role": "operator",
  "permissions": ["gate.override"],
  "exp": 1234567890
}
```

**Helper di `$lib/utils/auth.ts`:**
```ts
// Decode JWT payload (tanpa verifikasi signature)
export function getPermissions(): string[] {
  const token = getToken()
  if (!token) return []
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.permissions ?? []
  } catch {
    return []
  }
}

export function can(node: string): boolean {
  return getPermissions().includes(node)
}
```

**Penggunaan di Svelte component:**
```svelte
<script lang="ts">
  import { can } from '$lib/utils/auth'
</script>

{#if can('gate.override')}
  <button>Override Fee</button>
{/if}
```

**Role hanya dipakai untuk:**
1. Route guard di `+layout.svelte` — cek apakah user boleh akses journey ini
2. Label display di UI — "Logged in as: Operator"
3. Sidebar nav items — show/hide menu berdasarkan role (bisa juga diganti permission kalau lebih granular)

**Jangan** hide/show tombol atau aksi berdasarkan role — selalu gunakan permission.

### Redirect setelah login

| Role | Redirect |
|---|---|
| operator | `/daftar-transaksi` |
| admin | `/admin/users` |
| owner | `/monitoring/dashboard` |
| engineer | `/engineer/devices` |
| cashier | `/kasir` |

---

## 9. API Client (`$lib/api/client.ts`)

> **Penting:** Di SvelteKit, env vars TIDAK bisa diakses via `import.meta.env`. Gunakan `$env/static/public` untuk PUBLIC_* vars. `import.meta.env` akan return `undefined` dan axios akan fallback ke relative URL (localhost).

```ts
import axios from 'axios'
import { getToken, clearToken } from '$lib/utils/auth'
import { goto } from '$app/navigation'

export const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken()
      goto('/login')
    }
    const message = err.response?.data?.meta?.message ?? err.message
    return Promise.reject(new Error(message))
  }
)
```

Setiap file `$lib/api/*.ts` export typed functions yang pakai `apiClient`:

```ts
// $lib/api/zones.ts
export async function getZones(params?: { active?: boolean }): Promise<PaginatedResponse<Zone>> {
  const res = await apiClient.get('/api/v1/zones', { params })
  return res.data
}
```

---

## 10. Backend Response Shape

Backend selalu return shape ini (dari `pkg/response`):

```ts
// $lib/types/api.d.ts
interface ApiResponse<T> {
  success: boolean
  meta: { code: string; message: string }
  data: T
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
    prev: string | null
    next: string | null
  }
}
```

Jangan assume shape lain — semua endpoint Go API return salah satu dari dua ini.

---

## 11. ECharts Wrapper

Buat wrapper sendiri di `$lib/components/charts/`. Pola dasarnya:

```svelte
<!-- $lib/components/charts/LineChart.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import * as echarts from 'echarts'

  const { option } = $props<{ option: echarts.EChartsOption }>()

  let el = $state<HTMLDivElement | null>(null)
  let chart: echarts.ECharts | null = null

  onMount(() => {
    if (!el) return
    chart = echarts.init(el)
    chart.setOption(option)
  })

  onDestroy(() => chart?.dispose())

  $effect(() => {
    chart?.setOption(option)
  })
</script>

<div bind:this={el} class="w-full h-full"></div>
```

Buat satu wrapper per jenis chart yang dipakai (Line, Bar, Heatmap).

---

## 12. Form Handling

Tidak ada form library. Pakai `$state` + Zod langsung:

```svelte
<script lang="ts">
  import { z } from 'zod'

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  })

  let values = $state({ email: '', password: '' })
  let errors = $state<Record<string, string>>({})
  let loading = $state(false)

  async function handleSubmit() {
    const result = schema.safeParse(values)
    if (!result.success) {
      errors = Object.fromEntries(
        result.error.issues.map(i => [i.path[0], i.message])
      )
      return
    }
    errors = {}
    loading = true
    try {
      await login(result.data)
    } finally {
      loading = false
    }
  }
</script>
```

---

## 13. Polling

```ts
// $lib/utils/polling.ts
export function createPoller(fn: () => Promise<void>, intervalMs: number) {
  let timer: ReturnType<typeof setInterval> | null = null
  return {
    start() { fn(); timer = setInterval(fn, intervalMs) },
    stop()  { if (timer) clearInterval(timer) },
  }
}
```

Pakai di `onMount` / `onDestroy`:
```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { createPoller } from '$lib/utils/polling'

  const poller = createPoller(fetchData, 10_000)
  onMount(() => poller.start())
  onDestroy(() => poller.stop())
</script>
```

---

## 14. Environment Variables

Didefinisikan di `apps/web/.env`:
```env
PUBLIC_API_BASE_URL=https://api.yyypluto.my.id
PUBLIC_POLL_INTERVAL_FAST=5000
PUBLIC_POLL_INTERVAL_NORMAL=10000
PUBLIC_POLL_INTERVAL_SLOW=30000
```

Akses di app code **selalu** via SvelteKit's `$env/static/public` — JANGAN pakai `import.meta.env`:

```ts
import { PUBLIC_API_BASE_URL, PUBLIC_POLL_INTERVAL_FAST } from '$env/static/public'
```

`packages/env/src/web.ts` ada sebagai schema validation saja — tidak dipakai langsung di app code karena `import.meta.env` tidak bekerja di SvelteKit context.

---

## 15. Urutan Implementasi (Fase)

### Phase 1 — Foundation ✅
- [x] Install packages — `shadcn-svelte@1.1.1`, `echarts@6.0.0`, `lucide-svelte@0.576.0`, `date-fns@4.1.0`, `axios@1.13.6`
- [x] `app.css` — shadcn slate base (oklch vars) + brand tokens `--color-brand-*` + Inter/JetBrains Mono via Google Fonts
- [x] `packages/env/src/web.ts` — `PUBLIC_API_BASE_URL`, `PUBLIC_POLL_INTERVAL_FAST/NORMAL/SLOW`
- [x] `$lib/utils/auth.ts` — `getToken`, `setToken`, `clearToken`, `getRole`, `getUserID`, `getPermissions`, `can`
- [x] `$lib/utils/format.ts` — `formatCurrency` (Intl.NumberFormat IDR), `formatDate`, `formatDateTime`, `formatTime`, `formatDurationMinutes`
- [x] `$lib/utils/plate.ts` — `normalizePlate` (uppercase + strip whitespace)
- [x] `$lib/utils/role.ts` — `ROUTE_ROLES`, `ROLE_REDIRECT`, `hasRole`
- [x] `$lib/utils/polling.ts` — `createPoller` (start/stop wrapper)
- [x] `$lib/api/client.ts` — axios instance + request interceptor (inject JWT) + response interceptor (401 → clear + redirect)
- [x] `$lib/api/*.ts` — `auth`, `zones`, `gates`, `vehicles`, `rfid`, `fees`, `transactions`, `payments`, `overrides`, `audit`
- [x] `$lib/types/api.d.ts` — `ApiResponse<T>`, `PaginatedResponse<T>`, `Pagination`
- [x] `$lib/types/domain.d.ts` — semua domain types dari Go API DTOs

### Phase 2 — Layout & Shell ✅
- [x] Root `+layout.svelte` — import app.css, render children
- [x] Root `+page.svelte` — redirect ke journey berdasarkan role (onMount)
- [x] `AppShell.svelte` — sidebar + topbar + main content wrapper
- [x] `Sidebar.svelte` — sidebar putih, nav items, active state, user info di footer sidebar
- [x] `TopBar.svelte` — logo kiri + breadcrumb tengah + notif kanan (user info dipindah ke sidebar)
- [x] `KioskShell.svelte` — fullscreen dark wrapper tanpa sidebar
- [x] `/masuk/+page.svelte` — form email/password, Zod validation, redirect by role
- [x] `(operator)/+layout.svelte` — guard `['operator','admin']` + nav Transaksi/Gerbang/Tindakan
- [x] `(cashier)/+layout.svelte` — guard `can('cashier.ability')`
- [x] `(admin)/+layout.svelte` — guard `['admin']` + nav Pengguna/Zona/Gerbang/RFID/Tarif/Izin
- [x] `(monitoring)/+layout.svelte` — guard `['owner','admin']` + nav Dashboard/Pendapatan/Okupansi/Audit
- [x] `(engineer)/+layout.svelte` — guard `['engineer','admin']` + nav Perangkat/OCR/RFID/Log

### Phase 3 — Shared UI Components ✅
- [x] `StatusBadge.svelte`
- [x] `PageHeader.svelte`
- [x] `StatCard.svelte`
- [x] `Pagination.svelte`
- [x] `DataTable.svelte`
- [x] `FilterBar.svelte`
- [x] `ConfirmModal.svelte`
- [x] `PlateDisplay.svelte`
- [x] `charts/LineChart.svelte`, `charts/BarChart.svelte`, `charts/HeatmapChart.svelte`

### Phase 4 — Kiosk Journey ✅ (migrated to apps/kiosk)

> Kiosk telah **dipindah ke `apps/kiosk`** — app SvelteKit terpisah dengan port 5174.

- [x] `/setup`, `/gate/[gate_id]/`, payment flow, `/sim` (dev simulator, menggantikan `/simulate`), camera debug preview
- [x] `apps/kiosk/vite.config.ts` — `allowedHosts: 'all'`, `host: true` untuk cloudflared tunnel
- [x] `pnpm tunnel` script

### Phase 4.5 — Cashier Journey ✅
- [x] `/kasir` — panel kasir: polling kiosk request, cash & QRIS payment, QRIS sandbox simulator, antrian manual
- [x] `$lib/api/cashier.ts` — `listenCashierSSE` (polling 2s), `notifyCashierDone`, `notifyCashierCancel`

### Phase 5 — Operator Journey
- [x] `/daftar-transaksi` — tabel transaksi, filter (status/metode/date range), export CSV/XLSX/PDF, detail dialog + log, override dialog, cancel dialog
- [ ] `/atur-gerbang`
- [ ] `/tindakan`

> **Catatan Phase 5:**
> - Kontrol visibilitas tombol aksi (Cancel, Override Fee) → gunakan `can('gate.override')`, bukan cek role
> - Nav sidebar → show/hide item berdasarkan role (operator tidak lihat menu admin)
> - Satu halaman per route, elemen conditional berdasarkan permission dari JWT

### Phase 6 — Admin Journey
- [ ] `/admin/users`
- [ ] `/admin/zones` + `/admin/zones/[id]`
- [ ] `/admin/gates`
- [ ] `/admin/rfid`
- [ ] `/admin/fees`
- [ ] `/admin/permissions`

### Phase 7 — Monitoring Journey
- [ ] `/monitoring/dashboard`
- [ ] `/monitoring/revenue`
- [ ] `/monitoring/occupancy`
- [ ] `/monitoring/audit`

### Phase 8 — Engineer Journey
- [ ] `/engineer/devices`
- [ ] `/engineer/ocr`
- [ ] `/engineer/rfid`
- [ ] `/engineer/logs`

---

## 16. Aturan Komponen UI — WAJIB DIIKUTI

**SEMUA elemen UI di `apps/web` HARUS menggunakan shadcn-svelte component.** Tidak ada pengecualian.

Jangan pernah pakai HTML native untuk UI elements yang sudah ada shadcn-nya:

| ❌ Jangan | ✅ Pakai |
|---|---|
| `<button>` | `<Button>` dari `$lib/components/ui/button` |
| `<input>` | `<Input>` dari `$lib/components/ui/input` |
| `<select>` / `<NativeSelect>` | `* as Select` dari `$lib/components/ui/select` |
| `<textarea>` | `<Textarea>` dari `$lib/components/ui/textarea` |
| `<label>` | `<Label>` dari `$lib/components/ui/label` |
| `<input type="checkbox">` | `<Checkbox>` dari `$lib/components/ui/checkbox` |
| custom modal/dialog div | `* as AlertDialog` atau `* as Dialog` |
| custom dropdown div | `* as DropdownMenu` dari `$lib/components/ui/dropdown-menu` |
| custom table HTML | `* as Table` dari `$lib/components/ui/table` |
| custom badge/pill span | `<Badge>` dari `$lib/components/ui/badge` |
| custom card div | `* as Card` dari `$lib/components/ui/card` |
| custom side panel | `* as Sheet` dari `$lib/components/ui/sheet` |
| `<input type="date">` | `<Calendar>` + `* as Popover` + `@internationalized/date` |
| custom breadcrumb | `* as Breadcrumb` dari `$lib/components/ui/breadcrumb` |
| custom pagination | `* as Pagination` dari `$lib/components/ui/pagination` |
| loading div/spinner | `<Skeleton>` dari `$lib/components/ui/skeleton` |
| custom separator hr | `<Separator>` dari `$lib/components/ui/separator` |

### shadcn components yang sudah terinstall di `apps/web`:
```
alert-dialog, badge, breadcrumb, button, calendar, card, checkbox,
data-table (@tanstack/table-core), dialog, dropdown-menu, input, label,
native-select, pagination, popover, select, separator, sheet, skeleton,
table, textarea
```

### Import pattern:
```ts
import { Button } from '$lib/components/ui/button'
import { Badge } from '$lib/components/ui/badge'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { Checkbox } from '$lib/components/ui/checkbox'
import { Skeleton } from '$lib/components/ui/skeleton'
import { Separator } from '$lib/components/ui/separator'
import { Calendar } from '$lib/components/ui/calendar'
import * as Select from '$lib/components/ui/select'
import * as Dialog from '$lib/components/ui/dialog'
import * as AlertDialog from '$lib/components/ui/alert-dialog'
import * as Sheet from '$lib/components/ui/sheet'
import * as Popover from '$lib/components/ui/popover'
import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
import * as Pagination from '$lib/components/ui/pagination'
import * as Breadcrumb from '$lib/components/ui/breadcrumb'
import * as Card from '$lib/components/ui/card'
import * as Table from '$lib/components/ui/table'
```

### NativeSelect — kapan boleh dipakai:
`NativeSelect` hanya boleh dipakai untuk filter bar sederhana di luar form. Untuk form/modal/sheet, selalu pakai `Select` dari shadcn.

---

## 17. Konvensi Kode

- Svelte component: **PascalCase**, file `.svelte`
- Semua utility/helper: **camelCase**, file `.ts`
- API functions: **camelCase verb + noun** — `getZones`, `updateFee`, `createOverride`
- Tidak ada `any` di TypeScript — semua type di `$lib/types/`
- Gunakan Svelte 5 runes — tidak ada `export let`, `$:`, `<slot>`
- Plate number selalu uppercase + hapus spasi sebelum dikirim ke API

---

## 17. Catatan Khusus

- **Kiosk** deploy via Chromium `--kiosk` flag — pastikan tidak ada route yang bisa di-navigate tanpa sengaja.
- **Permission vs Role untuk UI control** — selalu gunakan permission (`can('gate.override')`) untuk show/hide elemen UI. Role hanya untuk route guard dan label display.
- **Audit log** di monitoring adalah read-only — tidak ada action apapun.
- **Engineer log viewer** — polling GET dengan cursor/offset, tidak perlu WebSocket di MVP.
- **shadcn-svelte components** di `$lib/components/ui/` di-generate via CLI — jangan diedit manual, kecuali memang perlu custom.
