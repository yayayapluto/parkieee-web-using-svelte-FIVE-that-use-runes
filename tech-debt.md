# Tech Debt

Items yang diketahui tapi belum dikerjakan. Update file ini saat item selesai atau prioritas berubah.

## [TD-01] Zero test coverage

Tidak ada satu pun test file di seluruh monorepo.

Priority order kalau mau mulai:
1. `packages/env/src/web.ts` — env schema validation
2. `apps/web/src/lib/utils/auth.ts` — getRole, getUserID, edge cases token rusak
3. `apps/web/src/lib/utils/role.ts` — hasRole semua branch
4. `packages/utils/src/polling.ts` — start/stop, double-start guard, immediate flag
5. `apps/kiosk/src/lib/api/transactions.ts` — happy path + error per fungsi

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
