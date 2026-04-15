## Edit Activity Plan

**Endpoint:** `PUT /api/activity-plans/{id}`  
**Auth:** Bearer token (sama seperti endpoint lain)

**Request body** (semua optional, kirim yang berubah aja):
```json
{
  "customer_id": "...",
  "customer_name": "PT Maju Jaya",
  "plan_date": "2025-08-01",
  "tujuan": "Follow Up",
  "keterangan_tambahan": "Tindak lanjut penawaran",
  "customer_address_id": "uuid-atau-master"
}
```

**Response sukses (200):**
```json
{
  "message": "Activity plan updated",
  "data": { ...updated plan object... }
}
```

**Response gagal - status tidak bisa diedit (422):**
```json
{
  "message": "Cannot edit activity plan with status: done"
}
```

**Catatan:** Plan dengan status `done` atau `missed` akan ditolak dengan 422.