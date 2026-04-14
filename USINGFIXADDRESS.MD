# Sales Activity — Address & Fix Address API

> Auth: semua endpoint pakai `Authorization: Bearer <token>`
> Generate token: `echo -n "{sales_internal_id}|x|x" | base64`

---

## Overview Tabel

| Tabel | Fungsi |
|---|---|
| `master_customer` | Data master, kolom `address` sebagai fallback default |
| `customer_addresses` | Alamat tambahan manual per customer |
| `fix_address` | Koreksi koordinat lapangan, one-to-one per customer, menggantikan master jika ada |

---

## 1. Customer Addresses

### `GET /api/customers/{customerId}/addresses`
Ambil semua alamat. Index 0 selalu default.

Priority default: **fix_address** dulu → fallback **master_customer**.

```json
[
  {
    "id": "master",
    "address": "Jl. Sudirman No.1",
    "lat": -6.2088,       // null jika source: master (belum ada fix)
    "lng": 106.8456,
    "is_default": true,
    "source": "fix"       // "master" | "fix"
  },
  {
    "id": "uuid-...",
    "address": "Jl. Gatot Subroto No.5",
    "lat": -6.235,
    "lng": 106.82,
    "is_default": false,
    "source": "custom"
  }
]
```

### `POST /api/customers/{customerId}/addresses`
Tambah alamat baru.

```json
{
  "address": "Jl. Gatot Subroto No.5",   // required
  "lat": -6.235,                          // optional
  "lng": 106.82                           // optional
}
```

### `PUT /api/customers/{customerId}/addresses/{addressId}`
Update alamat custom. `addressId` harus UUID — tidak bisa `"master"`.

```json
{ "address": "...", "lat": -6.235, "lng": 106.82 }
```

### `DELETE /api/customers/{customerId}/addresses/{addressId}`
Hapus alamat custom. Tidak bisa hapus `"master"`.

---

## 2. Fix Address

> Dipanggil FE **hanya** setelah user klik "Yes" pada alert >2KM, dan **hanya** berlaku untuk alamat source `master`/`fix` — bukan custom address.

### `POST /api/customers/{customerId}/fix-address`
Simpan atau update koordinat lapangan (upsert).

```json
{
  "lat": -6.175,                               // required
  "lng": 106.827,                              // required
  "address": "Jl. MH Thamrin No.1, Jakarta"   // optional
}
```

### `GET /api/customers/{customerId}/fix-address`
Cek apakah customer sudah punya fix address. Return `404` jika belum.

---

## 3. Activity Plans — Perubahan

### Tambahan field saat Create Plan

Field opsional `customer_address_id` di `POST /api/activity-plans`. Backend resolve lat/lng otomatis.

| Value | Behaviour |
|---|---|
| `"master"` | Pakai koordinat dari fix_address (atau null kalau belum ada) |
| `"<UUID>"` | Pakai lat/lng dari row customer_addresses, validasi jarak di-skip saat done |
| tidak dikirim | Legacy — lat/lng bisa dikirim langsung |

```json
{
  "customer_id": "CUST-001",
  "customer_name": "PT Maju Jaya",
  "plan_date": "2026-04-20",
  "tujuan": "Visit",
  "customer_address_id": "master"
}
```

### Response `PUT /api/activity-plans/{id}/done`

Sekarang ada flag tambahan:

```json
{
  "message": "Activity marked as done",
  "needs_fix_address_confirmation": true,
  "distance_km": 2.47
}
```

> `needs_fix_address_confirmation: true` hanya muncul jika source `master`/`null` **dan** jarak >2KM. Kalau custom address, flag selalu `false`.

---

## 4. Full Flow

| # | Aksi | Detail |
|---|---|---|
| 1 | Load alamat | `GET /api/customers/{id}/addresses` → FE populate dropdown |
| 2 | Pilih alamat | FE simpan `id` yang dipilih (`"master"` atau UUID) |
| 3 | Submit plan | `POST /api/activity-plans` dengan `customer_address_id` |
| 4 | Klik Done | `PUT /api/activity-plans/{id}/done` dengan lat/lng saat ini |
| 5a | Jarak ≤2KM atau custom | Selesai, tidak ada aksi tambahan |
| 5b | Jarak >2KM & source master/fix | FE tampilkan alert Yes/No |
| 6 | User klik Yes | `POST /api/customers/{id}/fix-address` — next plan otomatis pakai koordinat ini |

---

## 5. DDL

### fix_address
> ⚠ Charset di kolom `customer_id` harus eksplisit untuk menghindari FK mismatch (SQL Error 3780). Lokal Laragon bisa default charset berbeda dari VM.

```sql
CREATE TABLE fix_address (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci UNIQUE,
    lat DOUBLE NULL,
    lng DOUBLE NULL,
    address VARCHAR(255) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fix_address_customer
        FOREIGN KEY (customer_id) REFERENCES master_customer(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### Tambah kolom ke activity_plans

```sql
ALTER TABLE activity_plans
    ADD COLUMN customer_address_id VARCHAR(36) NULL
    COMMENT 'master | UUID from customer_addresses | null (legacy)'
    AFTER customer_location_lng;
```