1. Get Alamat Customer
GET /api/customers/{customerId}/addresses
Authorization: Bearer <token>
Response bakal return array, index 0 selalu master (default), sisanya custom.

2. Add Alamat Baru
POST /api/customers/{customerId}/addresses
Authorization: Bearer <token>
Content-Type: application/json

{
  "address": "Jl. Sudirman No. 10, Jakarta",
  "lat": -6.2088,
  "lng": 106.8456
}

3. Update Alamat
PUT /api/customers/{customerId}/addresses/{addressId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "address": "Jl. Gatot Subroto No. 5, Jakarta",
  "lat": -6.2350,
  "lng": 106.8200
}

addressId = UUID dari customer_addresses. Kalau kirim master bakal ditolak 422.


4. Delete Alamat
DELETE /api/customers/{customerId}/addresses/{addressId}
Authorization: Bearer <token>

5. Create Activity Plan — pakai alamat master
POST /api/activity-plans
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": "CUST-001",
  "customer_name": "PT Maju Jaya",
  "plan_date": "2026-04-15",
  "tujuan": "Visit",
  "keterangan_tambahan": "Demo produk baru",
  "customer_address_id": "master"
}

6. Create Activity Plan — pakai alamat custom
POST /api/activity-plans
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": "CUST-001",
  "customer_name": "PT Maju Jaya",
  "plan_date": "2026-04-15",
  "tujuan": "Follow Up",
  "keterangan_tambahan": "",
  "customer_address_id": "uuid-dari-customer_addresses"
}

UUID didapat dari response endpoint #1 di atas.


Token format (sesuai middleware): base64("{sales_internal_id}|{...}|{...}")
Contoh generate di terminal: echo -n "123|x|x" | base64