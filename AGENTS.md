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
  web/          ← SvelteKit app, semua kode frontend ada di sini
packages/
  config/       ← shared tsconfig (tsconfig.base.json)
  env/          ← shared env validator (@t3-oss/env-core + zod)
```

Semua kode yang gua tulis ada di `apps/web/src/`.

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

### 6.1 Filosofi Visual

- **ERP Enterprise Light** — background putih/off-white, sidebar navy, tabel border tipis.
- **Tabular & Dense** — prioritaskan informasi per pixel. Tidak ada whitespace kosong dramatis.
- **Data First** — elemen dekoratif diminimalkan.
- Border-radius maksimal `rounded` (4px). Tidak ada `rounded-2xl` atau shadow besar.
  Exception: badge status boleh `rounded-full`.

> `app.css` saat ini masih dark mode bawaan Better T Stack — ganti ke enterprise light saat mulai implementasi layout.

### 6.2 Color Token

```
Background utama      : #ffffff
Background muted      : #f8f9fb
Border tabel/divider  : #e2e6ed
Sidebar               : #1e3570 (brand-600)
Sidebar active item   : #2c4a8f (brand-500)
Sidebar text          : #c8d6f0
Primary action        : #2c4a8f
Primary action hover  : #1e3570
Text utama            : #0f172a (slate-900)
Text sekunder         : #475569 (slate-500)
```

### 6.3 Status Badge Color

| Status | Background | Text |
|---|---|---|
| Active / Open | `#dcfce7` | `#166534` |
| Inactive / Closed | `#fee2e2` | `#991b1b` |
| Pending / Warning | `#fef9c3` | `#854d0e` |
| Info / Processing | `#dbeafe` | `#1e40af` |
| Neutral / Draft | `#f1f5f9` | `#475569` |

### 6.4 Typography

- Font utama: **Inter** (Google Fonts)
- Font mono: **JetBrains Mono** — untuk plat nomor, ID, log
- Heading halaman: `text-sm font-semibold text-slate-900`
- Label kolom tabel: `text-xs font-semibold uppercase tracking-wide text-slate-500`
- Data sel: `text-sm text-slate-900`
- Plate number / ID: `font-mono text-sm`

### 6.5 Spacing & Sizing

- Tinggi baris tabel: `h-10` (40px)
- Padding sel: `px-3 py-2`
- Sidebar width: `w-56` (224px)
- Header bar height: `h-12`
- Padding konten halaman: `px-6 py-4`

---

## 7. Struktur Folder (`apps/web/src/`)

```
src/
├── app.html
├── app.css                    # @import tailwindcss + @theme tokens + Inter/JetBrains import
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
│       └── auth.ts            # localStorage token helpers
│
└── routes/
    ├── +layout.svelte         # root layout
    ├── +layout.server.ts      # session check global
    ├── login/
    ├── kiosk/                 # no sidebar, fullscreen
    ├── operator/
    ├── admin/
    ├── monitoring/
    └── engineer/
```

---

## 8. Auth Flow

- Login via `POST /api/v1/auth/login` → terima `access_token`
- Simpan `access_token` di **localStorage** (`key: "parkiye_token"`)
- `$lib/utils/auth.ts` expose: `getToken()`, `setToken(t)`, `clearToken()`, `getRole()`
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
<!-- contoh: apps/web/src/routes/operator/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { getToken, getRole } from '$lib/utils/auth'

  const { children } = $props()

  onMount(() => {
    const token = getToken()
    const role = getRole()
    if (!token || !['operator', 'admin'].includes(role ?? '')) {
      goto('/login')
    }
  })
</script>

{@render children()}
```

### Role-based Access

Role didapat dari JWT payload yang di-decode client-side (tanpa verifikasi signature — verifikasi tetap di backend).

```ts
// $lib/utils/role.ts
export const ROUTE_ROLES: Record<string, string[]> = {
  '/operator':   ['operator', 'admin'],
  '/admin':      ['admin'],
  '/monitoring': ['owner', 'admin'],
  '/engineer':   ['engineer', 'admin'],
  '/kiosk':      ['*'],
}

export function hasRole(required: string[], userRole: string | null): boolean {
  if (required.includes('*')) return true
  if (!userRole) return false
  return required.includes(userRole)
}
```

### Redirect setelah login

| Role | Redirect |
|---|---|
| operator | `/operator/transactions` |
| admin | `/admin/users` |
| owner | `/monitoring/dashboard` |
| engineer | `/engineer/devices` |

---

## 9. API Client (`$lib/api/client.ts`)

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

Didefinisikan di `packages/env/src/web.ts`:

```ts
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'PUBLIC_',
  client: {
    PUBLIC_API_BASE_URL:         z.string().url(),
    PUBLIC_POLL_INTERVAL_FAST:   z.coerce.number().default(5_000),
    PUBLIC_POLL_INTERVAL_NORMAL: z.coerce.number().default(10_000),
    PUBLIC_POLL_INTERVAL_SLOW:   z.coerce.number().default(30_000),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
})
```

`apps/web/.env`:
```env
PUBLIC_API_BASE_URL=http://localhost:8080
PUBLIC_POLL_INTERVAL_FAST=5000
PUBLIC_POLL_INTERVAL_NORMAL=10000
PUBLIC_POLL_INTERVAL_SLOW=30000
```

---

## 15. Urutan Implementasi (Fase)

### Phase 1 — Foundation
- [ ] Install packages (shadcn-svelte, echarts, lucide-svelte, date-fns)
- [ ] Update `app.css` — enterprise light, `@theme` tokens, Inter + JetBrains Mono
- [ ] `packages/env/src/web.ts` — definisikan semua env vars
- [ ] `$lib/utils/auth.ts` — localStorage token helpers
- [ ] `$lib/utils/format.ts` — currency (Rp), date, duration
- [ ] `$lib/utils/plate.ts` — uppercase + trim
- [ ] `$lib/utils/role.ts` — ROUTE_ROLES + hasRole()
- [ ] `$lib/utils/polling.ts` — createPoller
- [ ] `$lib/api/client.ts` — apiFetch
- [ ] `$lib/api/*.ts` — semua typed API functions
- [ ] `$lib/types/api.d.ts` + `domain.d.ts`

### Phase 2 — Layout & Shell
- [ ] `AppShell.svelte`
- [ ] `Sidebar.svelte`
- [ ] `TopBar.svelte`
- [ ] `KioskShell.svelte`
- [ ] Login page (`/login`)
- [ ] Root `+layout.server.ts` — session check

### Phase 3 — Shared UI Components
- [ ] `StatusBadge.svelte`
- [ ] `PageHeader.svelte`
- [ ] `StatCard.svelte`
- [ ] `DataTable.svelte` — sortable, loading skeleton, empty state
- [ ] `FilterBar.svelte`
- [ ] `Pagination.svelte`
- [ ] `ConfirmModal.svelte`
- [ ] `PlateDisplay.svelte`
- [ ] ECharts wrappers: `LineChart.svelte`, `BarChart.svelte`, `HeatmapChart.svelte`

### Phase 4 — Kiosk Journey
- [ ] `/kiosk/zones`
- [ ] `/kiosk/gate-in`
- [ ] `/kiosk/gate-out`

### Phase 5 — Operator Journey
- [ ] `/operator/transactions`
- [ ] `/operator/gates`
- [ ] `/operator/overrides`

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

## 16. Konvensi Kode

- Svelte component: **PascalCase**, file `.svelte`
- Semua utility/helper: **camelCase**, file `.ts`
- API functions: **camelCase verb + noun** — `getZones`, `updateFee`, `createOverride`
- Tidak ada `any` di TypeScript — semua type di `$lib/types/`
- Gunakan Svelte 5 runes — tidak ada `export let`, `$:`, `<slot>`
- Plate number selalu uppercase + hapus spasi sebelum dikirim ke API

---

## 17. Catatan Khusus

- **Kiosk** deploy via Chromium `--kiosk` flag — pastikan tidak ada route yang bisa di-navigate tanpa sengaja.
- **`gate.override` permission** — cek dari JWT payload untuk show/hide tombol override, validasi sesungguhnya tetap di backend.
- **Audit log** di monitoring adalah read-only — tidak ada action apapun.
- **Engineer log viewer** — polling GET dengan cursor/offset, tidak perlu WebSocket di MVP.
- **shadcn-svelte components** di `$lib/components/ui/` di-generate via CLI — jangan diedit manual, kecuali memang perlu custom.
