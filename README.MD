# API Documentation - Sales Activity Plan

Base URL: `http://localhost:8000/api`

## Authentication

### 1. Login
**Endpoint:** `POST /login`

**Request Body:**
```json
{
  "username": "0007benny",
  "password": "password123"
}
```

**Response Success (200):**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "sales": {
    "sales_internal_id": "3355",
    "sales_name": "0007 Benny"
  }
}
```

**Response Error (401):**
```json
{
  "message": "Invalid credentials"
}
```

---

## Protected Routes (Require Bearer Token)

Semua endpoint di bawah ini memerlukan header:
```
Authorization: Bearer {token_dari_login}
```

---

## Customer

### 2. Search Customer (Autocomplete)
**Endpoint:** `GET /customers/search?q={keyword}`

**Example Request:**
```
GET /customers/search?q=golden
```

**Response Success (200):**
```json
[
  {
    "customer_id": "C001",
    "customer_name": "PT GOLDENINDO",
    "address": "Jakarta Selatan"
  },
  {
    "customer_id": "C004",
    "customer_name": "PT GOLDENINDO 4",
    "address": "Jakarta Barat"
  }
]
```

---

## Activity Plans

### 3. Get All Activity Plans
**Endpoint:** `GET /activity-plans/all`

**Description:** Ambil semua activity plans milik sales yang login (tanpa filter tanggal)

**Example Request:**
```
GET /activity-plans/all
```

**Response Success (200):**
```json
[
  {
    "id": "df44173c-c4d4-4c17-952b-dbdb9ca09500",
    "plan_no": "AP-000001",
    "sales_internal_id": "3355",
    "sales_name": "0007 Benny",
    "customer_id": "C001",
    "customer_name": "PT GLISTAGEN",
    "plan_date": "2025-12-26",
    "tujuan": "Visit",
    "keterangan_tambahan": "Berikan promosi terbaru Webbing Sling",
    "status": "in progress",
    "result": null,
    "result_location_lat": null,
    "result_location_lng": null,
    "result_location_accuracy": null,
    "result_location_timestamp": null,
    "result_saved_at": null,
    "created_at": "2025-12-18T08:19:54",
    "updated_at": "2025-12-18T08:19:54",
    "deleted_at": null
  }
]
```

---

### 4. Get Activity Plans by Date
**Endpoint:** `GET /activity-plans?date={YYYY-MM-DD}`

**Description:** Ambil activity plans berdasarkan tanggal tertentu. Jika tanpa parameter `date`, akan ambil data hari ini.

**Example Request:**
```
GET /activity-plans?date=2025-12-20
```

**Example Request (Today):**
```
GET /activity-plans
```

**Response Success (200):**
```json
[
  {
    "id": "11b6449a-6f16-4148-a406-0fed5fa274e6",
    "plan_no": "AP-000003",
    "sales_internal_id": "3355",
    "sales_name": "0007 Benny",
    "customer_id": "C002",
    "customer_name": "PT GLISTAGEN 2",
    "plan_date": "2025-12-20",
    "tujuan": "Visit",
    "keterangan_tambahan": "Berikan promosi terbaru Webbing Sling",
    "status": "in progress",
    "result": null,
    "result_location_lat": null,
    "result_location_lng": null,
    "result_location_accuracy": null,
    "result_location_timestamp": null,
    "result_saved_at": null,
    "created_at": "2025-12-18T09:34:13",
    "updated_at": "2025-12-18T09:34:13",
    "deleted_at": null
  }
]
```

---

### 5. Create Activity Plan (Single)
**Endpoint:** `POST /activity-plans`

**Request Body:**
```json
{
  "customer_id": "C001",
  "customer_name": "PT GLISTAGEN",
  "plan_date": "2025-12-25",
  "tujuan": "Visit",
  "keterangan_tambahan": "Presentasi produk baru"
}
```

**Field Rules:**
- `customer_id`: required
- `customer_name`: required
- `plan_date`: required, format YYYY-MM-DD, harus >= hari ini
- `tujuan`: required, hanya boleh "Visit" atau "Follow Up"
- `keterangan_tambahan`: optional

**Response Success (201):**
```json
{
  "message": "Activity plan created",
  "data": {
    "id": "uuid-generated",
    "plan_no": "AP-000007"
  }
}
```

**Response Error (422):**
```json
{
  "message": "The plan date field must be a date after or equal to today.",
  "errors": {
    "plan_date": [
      "The plan date field must be a date after or equal to today."
    ]
  }
}
```

---

### 6. Create Activity Plans (Batch/Multiple)
**Endpoint:** `POST /activity-plans`

**Request Body (Array):**
```json
[
  {
    "customer_id": "C002",
    "customer_name": "PT GLISTAGEN 2",
    "plan_date": "2025-12-20",
    "tujuan": "Visit",
    "keterangan_tambahan": "Berikan promosi terbaru Webbing Sling"
  },
  {
    "customer_id": "C003",
    "customer_name": "PT GLISTAGEN 3",
    "plan_date": "2025-12-20",
    "tujuan": "Follow Up",
    "keterangan_tambahan": "Follow up order bulan lalu"
  },
  {
    "customer_id": "C004",
    "customer_name": "PT GOLDEN INDO 4",
    "plan_date": "2025-12-21",
    "tujuan": "Visit",
    "keterangan_tambahan": "Presentasi produk baru"
  }
]
```

**Response Success (201):**
```json
{
  "message": "Activity plans created",
  "count": 3,
  "data": [
    {
      "id": "uuid-1",
      "plan_no": "AP-000008"
    },
    {
      "id": "uuid-2",
      "plan_no": "AP-000009"
    },
    {
      "id": "uuid-3",
      "plan_no": "AP-000010"
    }
  ]
}
```

**Response Error (422):**
```json
{
  "message": "Validation failed for some plans",
  "errors": {
    "plan_0": {
      "plan_date": [
        "The plan date field must be a date after or equal to today."
      ]
    }
  }
}
```

---

### 7. Mark Activity Plan as Done
**Endpoint:** `PUT /activity-plans/{id}/done`

**Description:** Ubah status activity plan menjadi "done" dengan hasil kunjungan dan lokasi GPS.

**Allowed Status:** Hanya bisa untuk status `in progress` atau `rescheduled`

**Example Request:**
```
PUT /activity-plans/df44173c-c4d4-4c17-952b-dbdb9ca09500/done
```

**Request Body:**
```json
{
  "result": "Sudah bertemu dengan purchasing manager Pak Budi. Deal untuk order 100 unit webbing sling 2 ton dengan harga Rp 150,000/unit. Total order Rp 15,000,000. Follow up invoice minggu depan.",
  "latitude": -6.175392,
  "longitude": 106.827153,
  "accuracy": 15.5
}
```

**Field Rules:**
- `result`: required, string (hasil kunjungan)
- `latitude`: required, numeric (koordinat GPS)
- `longitude`: required, numeric (koordinat GPS)
- `accuracy`: optional, numeric (akurasi GPS dalam meter)

**Response Success (200):**
```json
{
  "message": "Activity marked as done"
}
```

**Response Error (422):**
```json
{
  "message": "Cannot mark as done activity plan with status: done"
}
```

---

### 8. Reschedule Activity Plan
**Endpoint:** `PUT /activity-plans/{id}/reschedule`

**Description:** Ubah tanggal activity plan.

**Allowed Status:** Hanya bisa untuk status `in progress` atau `rescheduled`

**Example Request:**
```
PUT /activity-plans/df44173c-c4d4-4c17-952b-dbdb9ca09500/reschedule
```

**Request Body:**
```json
{
  "new_date": "2025-12-26"
}
```

**Field Rules:**
- `new_date`: required, format YYYY-MM-DD, harus >= hari ini

**Response Success (200):**
```json
{
  "message": "Activity plan rescheduled"
}
```

**Response Error (422):**
```json
{
  "message": "Cannot reschedule activity plan with status: done"
}
```

---

### 9. Delete Activity Plan
**Endpoint:** `DELETE /activity-plans/{id}`

**Description:** Soft delete activity plan (status diubah jadi "deleted").

**Allowed Status:** Bisa untuk semua status KECUALI `done`

**Example Request:**
```
DELETE /activity-plans/df44173c-c4d4-4c17-952b-dbdb9ca09500
```

**Response Success (200):**
```json
{
  "message": "Activity plan deleted"
}
```

**Response Error (422):**
```json
{
  "message": "Cannot delete activity plan with status: done"
}
```

---

## Status Flow Diagram
```
[CREATE] → in progress
    ↓
    ├─→ [RESCHEDULE] → rescheduled → [RESCHEDULE AGAIN] → rescheduled
    ├─→ [MARK AS DONE] → done (FINAL - tidak bisa diubah/dihapus)
    ├─→ [DELETE] → deleted
    └─→ [AUTO CRON] → missed (jika lewat tanggal dan belum done)
```

## Status Rules

| Status | Mark as Done | Reschedule | Delete |
|---------------|--------------|------------|--------|
| `in progress` | ✅ | ✅ | ✅ |
| `rescheduled` | ✅ | ✅ | ✅ |
| `done` | ❌ | ❌ | ❌ |
| `deleted` | ❌ | ❌ | ❌ |
| `missed` | ❌ | ❌ | ✅ |

---

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Unauthenticated"
}
```

### 404 Not Found
```json
{
  "message": "Activity plan not found"
}
```

### 422 Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field_name": [
      "Error message"
    ]
  }
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error message"
}
```

---

## Notes untuk Frontend Developer

1. **Token Management**: Simpan token dari response login di localStorage/sessionStorage dan kirim di header setiap request.

2. **Date Format**: Semua tanggal menggunakan format `YYYY-MM-DD` (contoh: `2025-12-25`).

3. **Status Display**: 
   - `in progress` → Tampilkan sebagai "Sedang Berlangsung"
   - `rescheduled` → Tampilkan sebagai "Dijadwalkan Ulang"
   - `done` → Tampilkan sebagai "Selesai"
   - `missed` → Tampilkan sebagai "Terlewat"
   - `deleted` → Jangan tampilkan (sudah di-filter di backend)

4. **Button Visibility**: 
   - Button "Mark as Done" dan "Reschedule" hanya tampil jika status `in progress` atau `rescheduled`
   - Button "Delete" tampil untuk semua status KECUALI `done`

5. **GPS Location**: Gunakan browser Geolocation API untuk mendapatkan koordinat saat mark as done:
```javascript
   navigator.geolocation.getCurrentPosition((position) => {
     const latitude = position.coords.latitude;
     const longitude = position.coords.longitude;
     const accuracy = position.coords.accuracy;
   });
```

6. **Batch Create**: Gunakan array of objects untuk create multiple plans sekaligus. Validasi error akan dikembalikan per-item dengan index.

7. **Duplicate Data**: Backend sudah handle duplikat data otomatis, FE tidak perlu worry tentang duplicate entries.