# Dokumentasi Google Maps Integration

## 📍 Overview

Aplikasi ini menggunakan Google Maps untuk menampilkan lokasi customer dan mendapatkan koordinat geografis. Berikut adalah penjelasan lengkap tentang teknologi yang digunakan dan cara kerjanya.

---

## 🔧 Teknologi yang Digunakan

### 1. **Google Maps Embed API (Iframe)**
   - **Lokasi**: `src/components/addPlan.jsx` (baris 56-70, 505-514)
   - **Fungsi**: Menampilkan peta statis dalam bentuk iframe
   - **Status**: ✅ Sudah diimplementasi
   - **API Key**: Opsional (bisa bekerja tanpa API key untuk basic embedding)

### 2. **OpenStreetMap Nominatim API**
   - **Lokasi**: `src/components/addPlan.jsx` (baris 79-104)
   - **Fungsi**: Geocoding - mengkonversi alamat menjadi koordinat (latitude, longitude)
   - **Status**: ✅ Sudah diimplementasi
   - **API Key**: Tidak diperlukan (gratis)

### 3. **Database Storage**
   - **Lokasi**: `backend/api/AddPlan.php`
   - **Fungsi**: Menyimpan koordinat ke database dalam format `'latitude,longitude'`
   - **Field**: `coordinates` di tabel `customer`

---

## 📦 Instalasi dan Setup

### Opsi 1: Setup dengan Google Maps API Key (Recommended)

#### Langkah 1: Dapatkan Google Maps API Key

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Aktifkan **Maps Embed API** dan **Geocoding API**:
   - Pergi ke **APIs & Services** > **Library**
   - Cari "Maps Embed API" dan klik **Enable**
   - Cari "Geocoding API" dan klik **Enable**
4. Buat API Key:
   - Pergi ke **APIs & Services** > **Credentials**
   - Klik **Create Credentials** > **API Key**
   - Salin API Key yang dihasilkan
5. **Penting**: Restrict API Key untuk keamanan:
   - Klik pada API Key yang baru dibuat
   - Di bagian **API restrictions**, pilih **Restrict key**
   - Pilih **Maps Embed API** dan **Geocoding API**
   - Di bagian **Application restrictions**, pilih **HTTP referrers (web sites)**
   - Tambahkan domain Anda (contoh: `localhost:3000/*`, `yourdomain.com/*`)

#### Langkah 2: Setup Environment Variable

Buat file `.env` di root project (jika belum ada):

```env
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

**Contoh:**
```env
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Langkah 3: Restart Development Server

```bash
npm start
```

### Opsi 2: Setup Tanpa API Key (Current Implementation)

Aplikasi saat ini sudah bekerja tanpa API Key menggunakan:
- Google Maps Embed (basic, tanpa API key)
- OpenStreetMap Nominatim (gratis, tanpa API key)

**Tidak perlu setup tambahan** - langsung bisa digunakan!

---

## 🔄 Cara Kerja

### Flow Diagram

```
1. User Input Alamat
   ↓
2. Frontend (addPlan.jsx)
   ├─→ Menampilkan Google Maps iframe (preview)
   └─→ Memanggil OpenStreetMap Nominatim API
       ↓
3. Mendapatkan Koordinat (lat, lng)
   ↓
4. Menyimpan ke Database via AddPlan.php
   ├─→ Field: coordinates = 'latitude,longitude'
   └─→ Field: alamat = 'Alamat lengkap'
   ↓
5. Data tersimpan di database
```

### Detail Implementasi

#### 1. **Google Maps Preview (addPlan.jsx:56-70)**

```javascript
const getGoogleMapsUrl = (address) => {
  if (!address) return '';
  const encodedAddress = encodeURIComponent(address);
  
  // Jika ada API Key, gunakan Google Maps Embed API
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}`;
  }
  
  // Fallback: Google Maps basic embed (tanpa API key)
  return `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
};
```

**Cara Kerja:**
- Mengambil alamat dari input user
- Encode alamat untuk URL
- Jika ada API Key, gunakan Google Maps Embed API (lebih stabil)
- Jika tidak ada, gunakan format embed basic (masih bekerja)

#### 2. **Geocoding - Mendapatkan Koordinat (addPlan.jsx:79-104)**

```javascript
const getCoordinatesFromAddress = async (address) => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'AbsensiSalesApp/1.0', // Required by Nominatim
        },
      }
    );

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
};
```

**Cara Kerja:**
- Mengirim request ke OpenStreetMap Nominatim API
- API mengembalikan JSON dengan data koordinat
- Extract latitude dan longitude
- Return sebagai object `{latitude, longitude}`

**Catatan Penting:**
- OpenStreetMap memerlukan `User-Agent` header
- Rate limit: 1 request per detik (untuk penggunaan normal)
- Gratis dan tidak memerlukan API key

#### 3. **Penyimpanan ke Database (AddPlan.php)**

```php
// Format koordinat: 'latitude,longitude'
$query = "
    INSERT INTO customer (
        id_plan,
        nama_customer,
        nama_sales,
        alamat,
        coordinates,  // Format: '-6.1459,106.8166'
        tujuan,
        keterangan,
        created_at
    ) VALUES (...)
";
```

**Format Koordinat:**
- Disimpan sebagai string: `'latitude,longitude'`
- Contoh: `'-6.1459,106.8166'`
- Bisa di-parse kembali dengan `explode(',', $coordinates)`

---

## 🚀 Upgrade ke Google Maps JavaScript API (Opsional)

Jika ingin menggunakan Google Maps JavaScript API untuk peta interaktif (bukan hanya iframe), ikuti langkah berikut:

### 1. Install Package

```bash
npm install @react-google-maps/api
```

### 2. Update package.json

```json
{
  "dependencies": {
    "@react-google-maps/api": "^2.19.0"
  }
}
```

### 3. Update addPlan.jsx

Tambahkan import dan komponen:

```javascript
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

// Ganti iframe dengan komponen interaktif
<LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
  <GoogleMap
    mapContainerStyle={{ width: '100%', height: '300px' }}
    center={coordinates || { lat: -6.2, lng: 106.8 }}
    zoom={15}
  >
    {coordinates && <Marker position={coordinates} />}
  </GoogleMap>
</LoadScript>
```

**Keuntungan:**
- Peta interaktif (zoom, pan, dll)
- Bisa menambahkan marker, polyline, dll
- Kontrol penuh atas styling dan behavior

**Kekurangan:**
- Membutuhkan API Key (wajib)
- Lebih kompleks
- Ukuran bundle lebih besar

---

## 📊 Perbandingan Metode

| Fitur | Iframe (Current) | JavaScript API |
|-------|------------------|----------------|
| **API Key** | Opsional | Wajib |
| **Interaktivitas** | Terbatas | Penuh |
| **Ukuran Bundle** | Kecil | Besar |
| **Setup** | Mudah | Sedang |
| **Kustomisasi** | Terbatas | Penuh |
| **Biaya** | Gratis (basic) | Berbayar (setelah quota) |

---

## 🔍 Troubleshooting

### Problem: Peta tidak muncul

**Solusi:**
1. Pastikan alamat tidak kosong
2. Cek console browser untuk error
3. Jika menggunakan API Key, pastikan:
   - API Key valid
   - Maps Embed API sudah diaktifkan
   - Domain sudah ditambahkan di restrictions

### Problem: Koordinat tidak didapatkan

**Solusi:**
1. Pastikan alamat lengkap dan valid
2. Cek koneksi internet
3. OpenStreetMap mungkin rate-limited, tunggu beberapa detik
4. Cek console untuk error message

### Problem: API Key error

**Solusi:**
1. Pastikan API Key benar
2. Pastikan Maps Embed API sudah diaktifkan
3. Pastikan domain sudah ditambahkan di restrictions
4. Cek billing account di Google Cloud Console

---

## 📝 Catatan Penting

1. **OpenStreetMap Nominatim:**
   - Gratis dan tidak memerlukan API key
   - Rate limit: 1 request/detik
   - Untuk production, pertimbangkan menggunakan Google Geocoding API

2. **Google Maps API:**
   - Free tier: $200 credit per bulan
   - Maps Embed API: Gratis (unlimited)
   - Geocoding API: $5 per 1000 requests

3. **Format Koordinat:**
   - Database: `'latitude,longitude'` (string)
   - Frontend: `{latitude: number, longitude: number}` (object)

4. **Security:**
   - Jangan commit API Key ke Git
   - Gunakan environment variables
   - Restrict API Key di Google Cloud Console

---

## 📚 Referensi

- [Google Maps Embed API](https://developers.google.com/maps/documentation/embed)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [OpenStreetMap Nominatim](https://nominatim.org/)
- [React Google Maps API](https://react-google-maps-api-docs.netlify.app/)

---

## ✅ Checklist Setup

- [ ] Google Cloud Console account
- [ ] Project dibuat
- [ ] Maps Embed API diaktifkan
- [ ] Geocoding API diaktifkan (opsional, jika ingin ganti dari OpenStreetMap)
- [ ] API Key dibuat
- [ ] API Key di-restrict
- [ ] Environment variable `.env` dibuat
- [ ] API Key ditambahkan ke `.env`
- [ ] Development server di-restart
- [ ] Test peta muncul di form
- [ ] Test koordinat tersimpan ke database

---

**Dibuat untuk**: Absensi Sales Application  
**Terakhir Update**: 2025-01-22
