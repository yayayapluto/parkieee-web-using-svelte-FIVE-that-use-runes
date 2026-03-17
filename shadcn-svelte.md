# shadcn-svelte — Project Reference

> Versi yang dipakai di project ini: **shadcn-svelte 1.1.1** (Svelte 5 + Tailwind v4 compatible)
> Diinisialisasi via `bunx shadcn-svelte@latest init` di `apps/web`.

---

## Versi & Kompatibilitas

| Package | Versi |
|---|---|
| shadcn-svelte | 1.1.1 |
| svelte | ^5.38.1 |
| bits-ui | ^2.14.4 |
| tailwindcss | ^4.1.12 |
| @tailwindcss/vite | ^4.1.12 |
| tw-animate-css | ^1.4.0 |

shadcn-svelte v1+ menggunakan **oklch CSS variables** untuk theming (bukan hex/hsl seperti versi lama).
Config ada di `apps/web/src/app.css` — tidak ada `shadcn.config.ts` atau `tailwind.config.ts`.

---

## Theming di Project Ini

CSS variables didefinisikan di `apps/web/src/app.css` dalam dua blok:

1. **shadcn base vars** (`:root` / `.dark`) — oklch values untuk `--background`, `--foreground`, `--primary`, `--sidebar-*`, dll.
2. **Brand tokens** (`@theme`) — warna brand Parkiye, font, dan ukuran custom

```css
/* Sidebar accent sudah dikustomisasi ke rose (primary accent Parkiye) */
--sidebar-primary: oklch(0.5 0.22 15);          /* rose-600 equivalent */
--sidebar-accent: oklch(0.97 0.005 15);          /* rose-50 equivalent */
--sidebar-accent-foreground: oklch(0.5 0.22 15); /* rose-600 */

/* Brand tokens di @theme */
--font-family-sans: "DM Sans", system-ui, sans-serif;
--font-family-mono: "JetBrains Mono", monospace;
```

**Penting:** Jangan override `--primary` untuk aksi utama Parkiye — primary shadcn dipakai untuk komponen shadcn internal (focus ring, dll). Aksi utama Parkiye pakai `bg-[#e11d48]` hardcoded.

---

## Komponen yang Terinstall (`apps/web`)

Install via `bunx shadcn-svelte@latest add <component>`.

### Form & Input
| Komponen | Import |
|---|---|
| Button | `import { Button } from '$lib/components/ui/button'` |
| Input | `import { Input } from '$lib/components/ui/input'` |
| Label | `import { Label } from '$lib/components/ui/label'` |
| Textarea | `import { Textarea } from '$lib/components/ui/textarea'` |
| Checkbox | `import { Checkbox } from '$lib/components/ui/checkbox'` |
| Select | `import * as Select from '$lib/components/ui/select'` |
| NativeSelect | `import { NativeSelect } from '$lib/components/ui/native-select'` |
| Calendar | `import { Calendar } from '$lib/components/ui/calendar'` |

### Layout & Navigation
| Komponen | Import |
|---|---|
| Separator | `import { Separator } from '$lib/components/ui/separator'` |
| Breadcrumb | `import * as Breadcrumb from '$lib/components/ui/breadcrumb'` |
| Sidebar | `import * as Sidebar from '$lib/components/ui/sidebar'` (shadcn sidebar) |
| Accordion | `import * as Accordion from '$lib/components/ui/accordion'` |

### Overlay & Dialog
| Komponen | Import |
|---|---|
| Dialog | `import * as Dialog from '$lib/components/ui/dialog'` |
| AlertDialog | `import * as AlertDialog from '$lib/components/ui/alert-dialog'` |
| Sheet | `import * as Sheet from '$lib/components/ui/sheet'` |
| Popover | `import * as Popover from '$lib/components/ui/popover'` |
| DropdownMenu | `import * as DropdownMenu from '$lib/components/ui/dropdown-menu'` |
| Tooltip | `import * as Tooltip from '$lib/components/ui/tooltip'` |

### Display & Feedback
| Komponen | Import |
|---|---|
| Badge | `import { Badge } from '$lib/components/ui/badge'` |
| Card | `import * as Card from '$lib/components/ui/card'` |
| Table | `import * as Table from '$lib/components/ui/table'` |
| Skeleton | `import { Skeleton } from '$lib/components/ui/skeleton'` |
| Toast | `import { Toaster, toastSuccess, toastError } from '$lib/components/ui/toast'` |
| SmallCard | `import { SmallCard } from '$lib/components/ui/small-card'` |

### Data & Tanggal (custom/extended)
| Komponen | Import |
|---|---|
| DataTable | `import * as DataTable from '$lib/components/ui/data-table'` (TanStack Table) |
| Pagination | `import * as Pagination from '$lib/components/ui/pagination'` |
| DateRangePicker | `import { DateRangePicker } from '$lib/components/ui/date-range-picker'` |
| RangeCalendar | `import * as RangeCalendar from '$lib/components/ui/range-calendar'` |

---

## Konvensi Penggunaan

### NativeSelect vs Select

`NativeSelect` hanya untuk filter bar sederhana (outside form). Untuk form/modal/sheet — selalu pakai `Select` dari shadcn.

### Button styling override

Karena primary color shadcn bukan rose, tombol utama Parkiye selalu override class:

```svelte
<Button class="!bg-[#e11d48] !text-white hover:!bg-[#be123c]">
  Simpan
</Button>
```

### AlertDialog vs Dialog

- `AlertDialog` — untuk konfirmasi destructive (logout, cancel, delete). Ada `Cancel` + `Action`.
- `Dialog` — untuk detail view, form edit, informasi non-destructive.

### Toast

Project memakai custom toast wrapper di `$lib/components/ui/toast`:

```ts
import { toastSuccess, toastError } from '$lib/components/ui/toast'

toastSuccess('Pembayaran berhasil')
toastError('Gagal memproses')
```

`<Toaster />` sudah dipasang di `AppShell.svelte` — tidak perlu dipasang ulang per halaman.

---

## Tailwind v4 — Aturan Wajib

- Tidak ada `tailwind.config.ts` — konfigurasi via `@theme` di `app.css`
- Tidak ada `autoprefixer` atau `postcss` manual — sudah di-handle `@tailwindcss/vite`
- CSS variables shadcn menggunakan format oklch — jangan ubah ke hex/hsl

---

## Dokumentasi Resmi

- https://shadcn-svelte.com/docs
- https://shadcn-svelte.com/docs/migration/tailwind-v4
- https://shadcn-svelte.com/docs/migration/svelte-5
