# Style Guide — Admin Panel (apps/web)

Design language: **data-dense ERP admin UI**. Setiap elemen ada tujuannya. Tidak ada dekorasi yang tidak berfungsi. Semua keputusan visual diabdikan untuk keterbacaan dan efisiensi operasional.

Referensi visual: **Vantus ERP** — satu card putih per halaman, background body abu zinc-100, user info di footer sidebar.

---

## 1. Fondasi

### Font

```
DM Sans — satu-satunya typeface yang dipakai di seluruh sistem.
```

Import sudah ada di `apps/web/src/app.html` via Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
```

Tailwind config (v4 via `@theme` di `app.css`) — sudah dikonfigurasi:

```css
@theme {
  --font-family-sans: "DM Sans", system-ui, sans-serif;
  --font-family-mono: "JetBrains Mono", monospace;
  --font-size-2xs: 0.65rem;   /* ekstra kecil untuk meta label */
}
```

### Skala Font

| Konteks | Size | Weight | Warna |
|---|---|---|---|
| Page title | `15px` | 600 | `#111827` |
| Page subtitle | `12px` | 400 | `#9ca3af` |
| Nav item | `13.5px` | 400/600 (active) | `#4b5563` / `#e11d48` |
| Table header | `11.5px` | 600 | `#6b7280` |
| Table cell | `13.5px` | 400 | `#374151` |
| Kode transaksi | `12.5px` | 400 | `#374151`, font-mono |
| Button primary | `13px` | 600 | `#fff` |
| Button outline | `13px` | 500 | `#374151` |
| Badge | `12px` | 500 | sesuai jenis |
| Meta/subtext | `11px` | 400 | `#9ca3af` |
| Nav group label | `11px` | 600 | `#9ca3af`, uppercase, tracking-widest |
| Breadcrumb | `13px` | 400/500 | `#9ca3af` / `#374151` |

### Palet Warna

```
Primary accent  : #e11d48  (rose-600) — tombol utama, active state
Primary hover   : #be123c  (rose-700)

Background body : #f4f4f5  (zinc-100) — background di luar card
Surface white   : #ffffff  — topbar, sidebar, card, modal
Surface subtle  : #f9fafb  (gray-50)  — input bg, button hover, toolbar
Surface muted   : #f3f4f6  (gray-100) — bulk chip, separator alt

Border default  : #e5e7eb  (gray-200) — border card, topbar, sidebar
Border subtle   : #f3f4f6  (gray-100) — separator dalam surface putih (row tabel, section divider)

Text primary    : #111827  (gray-900)
Text secondary  : #374151  (gray-700)
Text muted      : #6b7280  (gray-500)
Text placeholder: #9ca3af  (gray-400)

Success green   : bg #dcfce7, text #16a34a   — badge Open/Active
Info blue       : bg #dbeafe, text #1d4ed8   — badge Paid
Warning yellow  : bg #fef9c3, text #92400e   — badge Awaiting
Neutral gray    : bg #f3f4f6, text #6b7280   — badge Cancelled/Neutral
Danger red      : #ef4444 / hover #dc2626    — tombol Delete/Cancel

Badge QR        : bg #f3f4f6 (#gray-100), text #4b5563 (gray-600)
Badge RFID      : bg #fff1f2, text #e11d48
Fee text        : font-bold, color #e11d48

Selected row bg : #fff5f6  — baris tabel yang dicentang
Active nav bg   : #fff1f2  — nav item sedang aktif
Focus ring      : #fda4af  (rose-300) — border input saat focus
```

### Border Radius

```
Tombol, input, select : rounded-md (6px)
Card utama            : rounded-lg (8px)
Modal                 : rounded-lg (8px)
Badge status          : rounded (4px)
Avatar                : rounded-full (50%)
```

### Spacing — Kelipatan 8

**Wajib** — semua spacing harus kelipatan 8px. Tidak ada nilai ganjil seperti `py-[7px]` atau `px-[14px]`.

```
8px  = p-2
16px = p-4
24px = p-6
32px = p-8
```

Gunakan Tailwind utility standar: `p-2`, `p-4`, `p-6`, `gap-2`, `gap-4`, dst.

### Scrollbar

```css
::-webkit-scrollbar       { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
```

> Belum diimplementasi di `app.css` — tambahkan di `@layer base` kalau diperlukan.

---

## 2. Layout Struktur

Seluruh app adalah **full viewport, no scroll di level body**. Diimplementasi via `AppShell.svelte` + shadcn `SidebarProvider` + `SidebarInset`. Struktur dari luar ke dalam:

```
┌─────────────────────────────────────────────────────┐
│                  TOPBAR (h-16 / 64px)               │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│   SIDEBAR    │   p-6 (dari semua sisi)               │
│   (w-56 /    │   ┌─────────────────────────────┐    │
│   224px)     │   │  CARD PUTIH (flex-1)         │    │
│              │   │  rounded-lg border           │    │
│  [nav items] │   │  overflow-hidden             │    │
│              │   └─────────────────────────────┘    │
│  [user info] │                                       │
│  [footer]    │                                       │
└──────────────┴──────────────────────────────────────┘
```

**Background body:** `#f4f4f5` — card punya margin dari semua sisi via `p-6` di `<main>`.

```svelte
<!-- AppShell.svelte (implementasi aktual) -->
<SidebarProvider
  style="--sidebar-width: 14rem;"
  class="!h-[100dvh] !min-h-0 !w-full overflow-hidden !bg-[#f4f4f5]"
>
  <Sidebar {navItems} />
  <SidebarInset class="!flex !min-w-0 flex-1 flex-col !overflow-hidden !bg-[#f4f4f5]" style="height: 100dvh;">
    <TopBar {title} />
    <main class="flex flex-1 flex-col overflow-hidden p-6">
      {@render children()}
    </main>
  </SidebarInset>
</SidebarProvider>
```

Sidebar menggunakan shadcn Sidebar component (`$lib/components/ui/sidebar`) dengan `collapsible="icon"`.

---

## 3. Topbar

**Height:** `h-12` (48px) — fixed, tidak ikut scroll. *(Implementasi aktual menggunakan h-12, bukan h-16)*

Terdiri dari **tiga zona** horizontal:

**Zona kiri — Logo** (lebar sama sidebar: `w-56`, `flex-shrink-0`)
- Dipisahkan dari zona tengah dengan `border-r border-gray-100`
- Logo icon: `w-8 h-8`, `bg-[#e11d48]`, `rounded-lg`
- App name: `13px font-bold text-gray-900`
- Subtext: `11px text-gray-400`

**Zona tengah — Breadcrumb** (`flex-1`, `pl-6`)
- Format: `Parent / Page Name`
- Parent: `13px text-gray-400`, hover `text-gray-700`, cursor-pointer
- Separator: `/` 12px text-gray-300
- Current: `13px font-medium text-gray-800`

**Zona kanan — Utilities** (`flex-shrink-0`, `pr-6`, `gap-4`)
- Notif bell icon: `w-5 h-5 stroke-gray-400` + dot indicator `7px bg-[#e11d48]` absolute
- **Tidak ada user info di topbar** — user info ada di footer sidebar

```svelte
<header class="h-16 bg-white border-b border-gray-200 flex items-center flex-shrink-0 z-10">
  <!-- Logo zone -->
  <div class="w-56 flex-shrink-0 flex items-center gap-3 px-4 border-r border-gray-100 h-full">
    <div class="w-8 h-8 bg-[#e11d48] rounded-lg ..."><!-- icon --></div>
    <div>
      <div class="text-[13px] font-bold text-gray-900 leading-tight">Parkiye</div>
      <div class="text-[11px] text-gray-400 leading-tight">ERP Parkir</div>
    </div>
  </div>
  <!-- Breadcrumb zone -->
  <div class="flex items-center gap-1 pl-6 text-[13px]">
    <span class="text-gray-400 hover:text-gray-700 cursor-pointer">Operator</span>
    <span class="text-gray-300 mx-1">/</span>
    <span class="text-gray-800 font-medium">Transaksi</span>
  </div>
  <!-- Utilities zone -->
  <div class="ml-auto flex items-center gap-4 pr-6">
    <div class="relative cursor-pointer"><!-- bell icon + dot --></div>
  </div>
</header>
```

---

## 4. Sidebar

**Width:** `w-56` (224px) — fixed, tidak collapse.

**Background:** `#ffffff`, `border-r border-gray-200`.

### Nav Group Label

```
font-size      : 11px
font-weight    : 600
color          : #9ca3af
text-transform : uppercase
letter-spacing : widest (tracking-widest)
padding        : pt-4 pb-2 px-4
```

### Nav Item

```
padding        : py-2 px-4
font-size      : 13.5px
color default  : #4b5563 (gray-600)
gap icon-label : gap-2
```

Hover: `bg-gray-50 text-gray-900`

Active:
```
background   : #fff1f2
color        : #e11d48
font-weight  : 600
border-right : 2px solid #e11d48
```

### Sidebar Footer — User Info

**User info ada di sini, bukan di topbar.** Di bawah nav, setelah `flex-1`:

```
padding        : p-4
border-top     : border-gray-100
```

Struktur:
- Avatar circle `w-8 h-8 bg-[#e11d48] rounded-full` + inisial `text-[11px] font-bold text-white`
- Nama: `text-[13px] font-semibold text-gray-900`
- Role: `text-[11px] text-gray-400`
- Tombol Keluar: `text-[12.5px] text-gray-400`, hover `text-gray-700`, full width, text-left

```svelte
<aside class="w-56 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col overflow-y-auto">
  <nav class="flex-1 py-2">
    <div class="px-4 pt-4 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
      Menu
    </div>
    <!-- nav items -->
  </nav>
  <!-- User info footer -->
  <div class="p-4 border-t border-gray-100">
    <div class="flex items-center gap-2 mb-3">
      <div class="w-8 h-8 bg-[#e11d48] rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
        FA
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-[13px] font-semibold text-gray-900 leading-tight truncate">Farras Admin</div>
        <div class="text-[11px] text-gray-400 leading-tight">operator</div>
      </div>
    </div>
    <button class="w-full text-left text-[12.5px] text-gray-400 hover:text-gray-700 transition-colors">
      Keluar
    </button>
  </div>
</aside>
```

---

## 5. Card Utama (Satu per Halaman)

Setiap route menampilkan **satu card putih** yang mengisi seluruh area `<main>` (dengan margin `p-6` dari main).

```svelte
<div class="bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden flex-1">
  <!-- Card header -->
  <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
    <div>
      <h1 class="text-[15px] font-semibold text-gray-900">Page Title</h1>
      <p class="text-[12px] text-gray-400 mt-0.5">Subtitle / count info</p>
    </div>
    <div class="flex items-center gap-2">
      <!-- secondary actions + primary button -->
    </div>
  </div>

  <!-- Filter bar -->
  <div class="flex items-center gap-3 px-6 py-3 border-b border-gray-100 flex-wrap">
    <!-- selects, date inputs, search, reset -->
  </div>

  <!-- Bulk action bar (conditional) -->
  {#if selectedCount > 0}
  <div class="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-[#fff5f6]">
    <!-- bulk actions -->
  </div>
  {/if}

  <!-- Table (flex-1, overflow-auto) -->
  <div class="flex-1 overflow-auto">
    <table class="w-full border-collapse">...</table>
  </div>

  <!-- Pagination (flex-shrink-0) -->
  <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
    <!-- pagination -->
  </div>
</div>
```

Tidak ada halaman yang punya dua card sejajar atau grid card — satu halaman satu card.

---

## 6. Tabel Data

Seluruh area card (selain header, filter, bulk bar, pagination) diisi tabel yang bisa di-scroll.

### Table Header (`<th>`)

```
padding        : px-4 py-3
font-size      : 11.5px
font-weight    : 600
letter-spacing : tracking-wide (0.05em)
text-transform : uppercase
color          : #6b7280 (gray-500)
border-bottom  : border-b border-gray-200 (1.5px)
background     : #ffffff
position       : sticky top-0
```

Hover: `color: #111827`

### Table Cell (`<td>`)

```
padding        : px-4 py-3
font-size      : 13.5px
color          : #374151 (gray-700)
border-bottom  : border-b border-gray-100
white-space    : nowrap
```

### Row States

```
default  : background white
hover    : background #fafafa
selected : background #fff5f6
```

Checkbox: `accent-color #e11d48`, `w-[14px] h-[14px]`

### Kolom Kode Transaksi

```svelte
<span class="font-mono text-[12.5px] text-gray-700">TRX-0313-0042</span>
```

### Badge Metode

```svelte
<!-- QR -->
<span class="inline-block px-2.5 py-0.5 rounded text-[12px] font-medium bg-gray-100 text-gray-600">QR</span>
<!-- RFID -->
<span class="inline-block px-2.5 py-0.5 rounded text-[12px] font-medium bg-[#fff1f2] text-[#e11d48]">RFID</span>
```

### Badge Status Transaksi

```svelte
<!-- Open -->
<span class="... bg-green-100 text-green-700">Open</span>
<!-- Paid -->
<span class="... bg-blue-100 text-blue-700">Paid</span>
<!-- Awaiting -->
<span class="... bg-yellow-100 text-yellow-800">Awaiting</span>
<!-- Cancelled -->
<span class="... bg-gray-100 text-gray-500">Cancelled</span>
```

### Fee / Angka Penting

```svelte
<span class="font-bold text-[#e11d48]">Rp 10.000</span>
```

---

## 7. Filter Bar

Di dalam card, antara card header dan tabel. `border-b border-gray-100`.

```
padding   : px-6 py-3
display   : flex, items-center, gap-3, flex-wrap
```

Elemen filter:
- **Select**: `border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-700 bg-gray-50`
- **Date input**: sama dengan select
- **Reset button**: `text-[13px] text-gray-400 hover:text-gray-700`
- **Search box** (di kanan, `ml-auto`): dengan icon search absolute kiri, `w-48`

Semua input/select: padding `py-2`, sehingga tinggi konsisten.

---

## 8. Bulk Action Bar

Muncul kondisional antara filter bar dan tabel saat ada row yang diselect.

```
background  : #fff5f6
border-b    : border-gray-100
padding     : px-6 py-3
display     : flex, items-center, gap-2
```

Elemen dari kiri ke kanan:
1. **Chip count** — `text-[12.5px] font-semibold bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-md`
2. **Aksi bulk** (Batalkan, Override Fee, dll)
3. **Row count** — `ml-auto text-[12px] text-gray-400` — "N / Total baris"

---

## 9. Tombol

### btn-primary

```
background    : #e11d48
color         : #ffffff
font-size     : 13px
font-weight   : 600
padding       : px-4 py-2
border-radius : rounded-md
hover         : #be123c
```

### btn-outline

```
background    : #ffffff
border        : border border-gray-200
color         : #374151
font-size     : 13px
font-weight   : 500
padding       : px-3 py-2
border-radius : rounded-md
hover         : bg-gray-50
display       : flex, items-center, gap-1.5
```

### btn-danger

```
background    : #ef4444
color         : #ffffff
font-size     : 12.5px
font-weight   : 500
padding       : px-3 py-1.5
border-radius : rounded-md
hover         : #dc2626
```

### Aksi Tabel (inline per row)

```svelte
<button class="text-[12px] font-medium border border-gray-200 rounded-md px-3 py-1 hover:bg-gray-50 text-gray-700">
  Detail
</button>
<button class="text-[12px] font-medium border border-red-200 text-red-500 rounded-md px-3 py-1 hover:bg-red-50">
  Cancel
</button>
```

---

## 10. Form & Input

### Input / Select

```
border        : border border-gray-200
border-radius : rounded-md
padding       : px-3 py-2
font-size     : 13.5px
color         : #111827
background    : #f9fafb (gray-50)
focus         : border-[#fda4af], bg-white
```

### Search Box

Sama dengan input, plus:
- Icon SVG `w-3.5 h-3.5` absolute kiri (`left-3 top-1/2 -translate-y-1/2`)
- `pl-8` di input
- Default width `w-48`

---

## 11. Modal

```
backdrop      : bg-black/40, fixed inset-0, z-50, flex center
box           : bg-white rounded-lg w-[520px] max-w-[95vw] shadow-xl overflow-hidden
header        : px-6 py-[18px] border-b border-gray-100 — title 15px 600 + close btn
body          : p-6
footer        : flex justify-end gap-2 mt-6
```

---

## 12. Pagination

```
background  : bg-white
border-top  : border-t border-gray-100
padding     : px-6 py-4
display     : flex, items-center, justify-between, flex-shrink-0
```

Kiri: `"Page N dari Total · X transaksi"`, `text-[13px] text-gray-500`

Kanan: Prev + numbered pages + Next

Active page: `bg-[#e11d48] text-white`
Inactive page: `border border-gray-200 text-gray-600 hover:bg-gray-50`

---

## 13. Permission-based UI Control

Tombol dan aksi di UI dikontrol oleh **permission dari JWT**, bukan role.

```svelte
<script lang="ts">
  import { can } from '$lib/utils/auth'
</script>

{#if can('gate.override')}
  <button class="btn-outline">Override Fee</button>
{/if}
```

Permission yang relevan untuk operator journey:
- `gate.override` — tombol Override Fee, bulk Override, force open gate

Role hanya dipakai untuk:
- Route guard (`operator`, `admin`, dll)
- Label display ("operator") di footer sidebar

Jangan gunakan `role === "admin"` untuk show/hide tombol — gunakan permission.

---

## 14. Aturan Desain — Jangan Dilanggar

1. **Font hanya DM Sans** — jangan Inter, Poppins, dsb.
2. **Spacing kelipatan 8** — tidak ada `py-[7px]`, `px-[14px]`, atau nilai ganjil lainnya.
3. **User info di sidebar footer, bukan topbar** — topbar hanya logo + breadcrumb + notif.
4. **Satu card putih per halaman** — tidak ada grid card sejajar.
5. **Card punya margin dari semua sisi** — via `p-6` di `<main>`. Card tidak mentok ke edge.
6. **Body tidak pernah scroll** — `h-screen overflow-hidden`, scroll hanya di dalam tabel.
7. **Tidak ada `rounded-xl` atau lebih** — maksimal `rounded-lg` (8px) untuk card/modal.
8. **Tidak ada shadow besar di card** — shadow hanya untuk modal dan dropdown.
9. **Primary accent hanya rose-600 (#e11d48)** — tidak ada biru, ungu, dsb untuk aksi utama.
10. **Table header selalu uppercase + tracking-wide** — jangan title case untuk `<th>`.
11. **Bulk bar selalu di dalam card, antara filter dan tabel** — conditional, background `#fff5f6`.
12. **Tombol primary hanya satu per section** — satu aksi utama, sisanya outline.
13. **Aksi tombol di tabel** — pakai inline small button (`rounded-md px-3 py-1`), bukan icon-only.
14. **Fee dan angka penting** — `font-bold text-[#e11d48]`, bukan warna lain.
