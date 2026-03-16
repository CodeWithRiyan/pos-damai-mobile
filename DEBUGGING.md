# Debugging Guide: pos-damai-mobile

Dokumentasi ini bertujuan untuk membantu developer dalam melakukan debugging pada aplikasi `pos-damai-mobile`.

## 🏗️ Arsitektur Overview

Aplikasi ini dibangun menggunakan stack berikut:

- **Expo (React Native)**: Framework utama aplikasi.
- **Expo Router**: File-based routing (lihat direktori `/app`).
- **Zustand**: State management (lihat direktori `/stores`).
- **Drizzle ORM + SQLite (expo-sqlite)**: Penyimpanan data lokal (lihat `/lib/db`).
- **NativeWind (Tailwind CSS)**: Styling UI.
- **TanStack Query (React Query)**: Caching data API (lihat `/providers/query-provider.tsx`).

---

## 💾 Debugging Database (SQLite)

Data lokal disimpan dalam file database SQLite.

### 📍 Lokasi Database

Secara default, `expo-sqlite` menyimpan database di:

- **iOS**: `Library/Application Support/SQLite/pos_damai.db`
- **Android**: `data/data/<package-name>/databases/pos_damai.db`

### 🔍 Inspeksi Data

Anda dapat menggunakan alat seperti **Drizzle Studio** atau browser SQLite eksternal jika menggunakan emulator:

1. Jalankan `npx drizzle-kit studio` (jika konfigurasi tersedia).
2. Gunakan `adb pull` (Android) untuk mengambil file database ke komputer Anda.

### 🔄 Reset Database

Database **TIDAK** lagi di-reset otomatis setiap update aplikasi untuk mencegah kehilangan data `_dirty`. Log peringatan akan muncul di console jika versi aplikasi berubah.
Untuk reset manual dari kode, panggil fungsi `resetDb()` dari `@/lib/db`.

---

## 🧠 Debugging State (Zustand)

State disimpan secara terpisah di masing-masing store dalam folder `/stores`.

### Store Penting:

- **`auth.ts`**: Menyimpan profil user dan token.
- **`sync-queue-store.ts`**: Menyimpan antrean operasi yang belum tersinkronisasi.
- **`transaction.ts`**: Menyimpan data keranjang belanja dan transaksi yang sedang berlangsung.
- **`network-store.ts`**: Status koneksi internet.

### Cara Debug Zustand:

Gunakan `console.log` di dalam store atau buat selector sementara untuk memantau perubahan state:

```typescript
const cart = useTransactionStore((state) => state.cart);
console.log("Cart state:", JSON.stringify(cart, null, 2));
```

---

## 🔄 Debugging Sinkronisasi (Sync Engine)

Mekanisme sinkronisasi diatur oleh `SyncEngine` di `@/lib/sync/sync-engine.ts`.

### Alur Sinkronisasi:

1. **Pull**: Menarik data dari server (Bootstrap atau Incremental).
2. **Push**: Mengirim data lokal yang "kotor" (`_dirty: true`) ke server melalui `pushDirtyRecords`.

#### Menu Sinkronisasi (`app/(main)/sync/index.tsx`)

Halaman khusus untuk mengelola sinkronisasi data:

- Memantau status koneksi internet.
- Melihat jumlah data yang menunggu untuk di-push.
- Menjalankan sinkronisasi manual dengan tombol "Sinkronkan Sekarang".

#### Sync Floating Button (FAB)

Tersedia floating button di layar utama untuk akses cepat:

- Menampilkan indikator record `_dirty`.
- Klik tombol/kartu akan mengarahkan user ke Menu Sinkronisasi.
- Memiliki tombol close (x) untuk menyembunyikan FAB.

### Log Sinkronisasi:

Pantau Metro logs dengan filter `[Sync]`. Anda akan melihat log seperti:

- `[Sync] Pulling from /sync/incremental...`
- `[Sync] Pushing X categories, Y products...`

### Tips Debug Sync:

1. **Cek `_dirty` flag**: Semua tabel memiliki kolom `_dirty`. Jika `true`, data tersebut akan dikirim pada sinkronisasi berikutnya.
2. **Cek `lastSyncAt`**: Disimpan di `AsyncStorage`. Jika dihapus, sinkronisasi berikutnya akan menjadi **Bootstrap** (tarik semua data).

---

## 📡 Networking & API

- Kontrol API berada di `/lib/api/client.ts`.
- Interceptor digunakan untuk menambahkan token JWT secara otomatis.
- Gunakan **React Native Debugger** atau Chrome DevTools untuk memantau Network requests.

---

## 🛠️ Common Troubleshooting

### 1. Migrasi Gagal

Jika Anda melihat error migrations saat startup:

- Hapus aplikasi (clear data) dan jalankan ulang untuk memicu `resetDb`.
- Cek file di folder `/drizzle/migrations`.

### 2. Data Tidak Muncul setelah Sync

- Pastikan `selectedOrganizationId` pada profil user sudah sesuai dengan data di server.
- Cek log `[Sync]` untuk melihat apakah ada mapping table yang `warn: No local table mapping`.

### 3. Permission Errors

- Cek `use-permission.ts` jika fitur tertentu tidak bisa diakses.
- Pastikan profil user memiliki role yang sesuai di store `auth`.
