# Next Plan — Parkiye Web

Status per 17 Mar 2026. Operator journey sebagian besar selesai. Cashier journey selesai. Journey lain belum dimulai.

---

## Immediate — selesaikan operator journey

### `/daftar-transaksi` ✅ DONE
- [x] Tabel transaksi dengan filter status, metode, dan date range picker
- [x] Search kode transaksi (client-side filter)
- [x] Detail dialog + log status (accordion)
- [x] Override dialog (semua tipe override)
- [x] Cancel dialog dengan alasan
- [x] Export CSV / XLSX / PDF (`xlsx`, `jspdf`, `jspdf-autotable`)
- [x] Pagination

> **Known issue**: gate name masih tampil sebagai UUID. Perlu endpoint `GET /api/v1/gates` flat di Go API, atau fetch per zone.

### `/atur-gerbang`
- [ ] Tabel semua gate dengan status aktif/nonaktif
- [ ] Filter by zone, gate_type (entry/exit)
- [ ] Tombol force open gate (permission: `gate.override`)
- [ ] Detail gate → info zone, token, last used

### `/tindakan`
- [ ] Tabel override history milik operator yang login
- [ ] Filter by override_type, date range
- [ ] Detail override per row

---

## Phase 5.5 — Cashier Journey ✅ DONE

### `/kasir`
- [x] Polling kiosk request via `listenCashierSSE` (polling 2 detik, workaround Cloudflare)
- [x] Cash payment flow — preset nominal + input manual + hitung kembalian
- [x] QRIS initiate + tampil QR image
- [x] QRIS Sandbox Simulator — iframe Midtrans + auto copy URL ke clipboard
- [x] Fetch antrian manual (`Ambil Antrian` button)
- [x] `notifyCashierDone` / `notifyCashierCancel` setelah selesai/batal
- [x] Pause/resume polling saat kasir sedang aktif handle transaksi
- [x] OCR confidence check inline

---

## Phase 6 — Admin Journey

### `/admin/users`
- [ ] Tabel user dengan role badge
- [ ] Create user (form: name, email, password, role)
- [ ] Deactivate / reactivate user
- [ ] Change password (permission: `user.manage`)

### `/admin/zones`
- [ ] Tabel zona dengan kapasitas + occupancy
- [ ] Create / edit zona
- [ ] Detail zona → daftar gate di zona tersebut

### `/admin/zones/[id]`
- [ ] Detail zona
- [ ] CRUD gate dalam zona
- [ ] Regenerate gate token

### `/admin/rfid`
- [ ] Tabel RFID card dengan status aktif/nonaktif
- [ ] Deactivate card
- [ ] Link card ke vehicle

### `/admin/fees`
- [ ] Tabel fee config per zona + vehicle type
- [ ] Create / edit fee config dengan tiers
- [ ] Holiday rates management

### `/admin/permissions`
- [ ] Matrix permission per role (read-only view)
- [ ] Assign / revoke permission (permission: `user.manage`)

---

## Phase 7 — Monitoring Journey

### `/monitoring/dashboard`
- [ ] StatCard: total transaksi hari ini, pendapatan hari ini, kendaraan parkir sekarang, gate aktif
- [ ] LineChart: transaksi per jam (realtime polling 30s)
- [ ] BarChart: pendapatan per hari (7 hari terakhir)

### `/monitoring/revenue`
- [ ] Tabel pendapatan per hari/minggu/bulan
- [ ] Filter date range
- [ ] Export CSV

### `/monitoring/occupancy`
- [ ] Tabel ocupansi per zona (realtime)
- [ ] Progress bar kapasitas per zona
- [ ] HeatmapChart: ocupansi per jam per hari

### `/monitoring/audit`
- [ ] Tabel audit log (read-only)
- [ ] Filter by event_type, actor, date range
- [ ] Detail log → before/after state diff

---

## Phase 8 — Engineer Journey

### `/engineer/devices`
- [ ] Tabel gate devices dengan status online/offline/error
- [ ] Polling status setiap 15s

### `/engineer/ocr`
- [ ] Tabel OCR job history
- [ ] Filter by status (completed/failed/skipped)
- [ ] Detail job → foto entry/exit + hasil OCR + confidence score

### `/engineer/rfid`
- [ ] Debug RFID card scan
- [ ] Lookup card by UID

### `/engineer/logs`
- [ ] Log viewer dengan cursor-based pagination
- [ ] Polling GET setiap 10s
- [ ] Filter by level (info/warn/error)

---

## Tech Debt & Fixes

- [ ] **Gate name resolver** — `getTransactions` return `entry_gate_id` sebagai UUID, bukan nama. Tambah endpoint `GET /api/v1/gates` flat di Go API agar bisa di-lookup by ID tanpa fetch per zone
- [ ] **`can()` fungsi** — sudah ada di `auth.ts`, pastikan semua halaman baru pakai ini untuk permission-gated UI
- [ ] **`tech-debt.md`** di root — update dengan temuan baru dari audit
- [ ] **Error boundary** — tidak ada global error handler di SvelteKit, tambah `+error.svelte` per journey
- [ ] **Loading skeleton** — standardisasi skeleton di semua halaman (saat ini hanya transaksi)
- [ ] **Pagination shape** — pastikan semua halaman baru pakai `res.pagination.meta.total` dan `res.pagination.meta.last_page` (bukan `total` / `total_pages` lama)
- [ ] **Sticky header tabel** — `Table.Root` shadcn punya wrapper `div overflow-x-auto` yang break `position: sticky`. Solusi: override component atau buat `StickyTable` wrapper custom
- [ ] **`cashier.ability` permission** — belum ada di seed Go API. Perlu ditambahkan ke permission matrix dan di-assign ke role `cashier`
