# User Photo untuk Activity Plans

## SETUP STORAGE (WAJIB DIJALANKAN)

Jalankan command ini sekali saja di server:
```bash
php artisan storage:link
```

Apa yang dilakukan:
- Membuat symlink dari `storage/app/public` → `public/storage`
- Sehingga file bisa diakses via URL

## MENGGUNAKAN FOTO

### 1. Upload Foto saat Create Activity Plan

```javascript
// Frontend: Kirim dengan FormData
const formData = new FormData();
formData.append('customer_id', '123');
formData.append('customer_name', 'John');
formData.append('plan_date', '2026-01-26');
formData.append('tujuan', 'Visit');
formData.append('photo', fileInput.files[0]);  // File dari input

const response = await fetch('http://localhost:8000/api/activity-plans', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
    },
    body: formData
});
```

### 2. Foto Disimpan Otomatis

- Path foto: `/storage/user-photos/user-{sales_id}-{timestamp}.jpg`
- Langsung tersimpan di BigQuery dalam field `user_photo`
- Tidak perlu endpoint terpisah, semua dalam 1 route `/activity-plans`

### 3. Tampilkan di Frontend

```html
<img src="/storage/user-photos/user-123-1706284800.jpg" alt="User Photo" />
```

## KONFIGURASI ENVIRONMENT

Pastikan di `.env`:
```
APP_URL=http://localhost:8000  (atau domain server)
FILESYSTEM_DISK=local
```

## STRUKTUR FOLDER

```
storage/app/public/
└── user-photos/
    └── user-123-1706284800.jpg  ← Foto disimpan di sini
    
public/storage  ← Symlink yang dibuat oleh storage:link
```

## TROUBLESHOOTING

**Foto tidak bisa diakses (404)?**
→ Pastikan sudah jalankan `php artisan storage:link`

**Error "directory already exists"?**
```bash
Remove-Item -Path ".\public\storage" -Force
php artisan storage:link
```

---

**Summary**: Cukup jalankan `php artisan storage:link` sekali, terus upload foto langsung saat create activity plan via `/activity-plans`. Mudah!

