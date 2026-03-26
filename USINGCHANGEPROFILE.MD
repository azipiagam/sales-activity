# API Documentation — Change Profile

## Endpoint

```
PUT https://touchpoint.pilargroup.id/api/auth/change-profile
```

## Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

## Request Body

```json
{
    "current_password": "password_sekarang",
    "new_username": "username_baru",
    "new_password": "password_baru"
}
```

> `new_username` dan `new_password` bersifat **opsional** — bisa kirim salah satu atau keduanya sekaligus. Minimal salah satu harus diisi.

## Response

### Sukses `200`

```json
{
    "success": true,
    "message": "Berhasil mengubah username dan password"
}
```

### Error

| Status | Message |
|--------|---------|
| 401 | Password saat ini salah |
| 422 | Username sudah digunakan |
| 422 | Isi minimal new_username atau new_password |
| 404 | User not found |

## Contoh Request

### Ganti username saja
```json
{
    "current_password": "password123",
    "new_username": "john_doe"
}
```

### Ganti password saja
```json
{
    "current_password": "password123",
    "new_password": "newpassword456"
}
```

### Ganti keduanya
```json
{
    "current_password": "password123",
    "new_username": "john_doe",
    "new_password": "newpassword456"
}
```