# Tech Debt

Items yang diketahui tapi belum dikerjakan. Update file ini saat item selesai atau prioritas berubah.

> Terakhir diupdate: 2026-03-17

---

## [TD-01] Zero test coverage

Tidak ada satu pun test file di seluruh monorepo.

Priority order kalau mau mulai:
1. `packages/env/src/web.ts` — env schema validation
2. `apps/web/src/lib/utils/auth.ts` — getRole, getUserID, can(), edge cases token rusak
3. `apps/web/src/lib/utils/role.ts` — hasRole semua branch
4. `apps/kiosk/src/lib/api/transactions.ts` — happy path + error per fungsi
5. `apps/web/src/lib/api/cashier.ts` — listenCashierSSE pause/resume/stop logic

## [TD-02] Route guard berbasis client-decoded JWT bukan security boundary

`getRole()` di `apps/web/src/lib/utils/auth.ts` decode JWT payload via `atob` tanpa verifikasi signature. Route guard di layout Svelte bergantung pada hasil ini.

Ini by-design untuk UX (redirect cepat tanpa round-trip), tapi perlu dipastikan:
- Semua endpoint Go backend memvalidasi token + role secara independen per request
- Tidak ada logika sensitif yang hanya bergantung pada hasil `getRole()` di sisi client

Tidak perlu diubah selama backend sudah enforce — tapi perlu diverifikasi.

## [TD-03] `apps/web/src/lib/utils/format.ts` masih duplikasi sebagian logic

`formatDurationMinutes` di web pakai `date-fns/intervalToDuration` sementara versi di `@parkieee/utils` pakai pure math. Output berbeda untuk edge case (contoh: 0 menit).

Solusi: unify ke satu implementasi. Web bisa drop `date-fns` untuk fungsi ini dan pakai versi dari package.

## [TD-04] Tidak ada error boundary di kiosk untuk sustained network failure

QRIS polling sudah handle 5x consecutive error, tapi kegagalan network di luar konteks QRIS (contoh: `getTransaction`, `recordEntry`) masih hanya menampilkan pesan error lokal tanpa recovery flow yang jelas untuk operator.

Pertimbangkan: toast/overlay "Server tidak dapat dijangkau" yang muncul kalau beberapa API call berturut-turut gagal di luar context pembayaran.

## [TD-05] `cashier.ability` permission belum ada di seed Go API

`(cashier)/+layout.svelte` melakukan guard via `can('cashier.ability')` — tapi permission node ini belum terdaftar di seed Go API (`database/seed.go`) dan belum di-assign ke role manapun.

Efek saat ini: tidak ada user yang bisa masuk ke `/kasir` kecuali manual tambah permission via DB.

**Fix yang diperlukan di Go API:**
1. Tambah `"cashier.ability"` ke daftar permissions di `database/seed.go`
2. Assign ke role `cashier` (dan `admin` sebagai fallback)
3. Pastikan `ROLE_REDIRECT["cashier"] = "/kasir"` sudah ada — sudah ada di `role.ts` tapi perlu dikonfirmasi role `cashier` memang exist di backend

## [TD-06] Gate name tampil sebagai UUID di tabel transaksi

`getTransactions` return `entry_gate_id` dan `exit_gate_id` sebagai UUID — bukan nama gate. Di `/daftar-transaksi`, kolom gate menampilkan UUID mentah.

**Solusi opsi A (direkomendasikan):** Tambah endpoint `GET /api/v1/gates` flat (tanpa paginasi per zone) di Go API, fetch satu kali saat halaman load, buat lookup map `gateId → gateName`.

**Solusi opsi B:** Minta backend embed `entry_gate_name` / `exit_gate_name` langsung di response transaksi (JOIN di query).

## [TD-07] Cashier polling tidak punya error boundary untuk network failure sustained

`listenCashierSSE` di `cashier.ts` hanya `console.warn` saat poll error, lalu retry 2 detik kemudian. Tidak ada indikator visual ke kasir kalau koneksi ke backend putus berkepanjangan.

Pertimbangkan: badge "Offline" atau toast warning kalau N consecutive poll gagal (threshold: 5x = 10 detik).
