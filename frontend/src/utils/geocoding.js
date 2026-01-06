/**
 * Utility functions for geocoding addresses menggunakan Nominatim (OpenStreetMap)
 * Gratis dan tidak memerlukan API key
 */

/**
 * Normalisasi alamat: bersihkan dari karakter dan format yang tidak perlu
 * @param {string} addr - Alamat yang akan dinormalisasi
 * @returns {string} - Alamat yang sudah dinormalisasi
 */
const normalizeAddress = (addr) => {
  if (!addr || typeof addr !== 'string') {
    return '';
  }

  let cleaned = addr.trim();
  
  // Hapus RT/RW dalam berbagai format
  cleaned = cleaned.replace(/\bRT\s*\.?\s*\d+\s*\/\s*RW\s*\.?\s*\d+/gi, '');
  cleaned = cleaned.replace(/\bRW\s*\.?\s*\d+/gi, '');
  cleaned = cleaned.replace(/\bRT\s*\.?\s*\d+/gi, '');
  cleaned = cleaned.replace(/\brt\s*\.?\s*\d+\s*\/\s*rw\s*\.?\s*\d+/gi, '');
  
  // Hapus format No. yang ambigu (No. 123, No:123, Nomor 123, dll)
  // Tapi tetap pertahankan jika ada konteks yang jelas seperti "Rumah No. 5"
  cleaned = cleaned.replace(/\b(?:No|Nomor|nomer|no)\s*[\.:]?\s*\d+/gi, (match, p1, offset) => {
    // Hanya hapus jika ada spasi sebelum dan setelah, atau di awal string
    return '';
  });
  
  // Hapus karakter khusus yang tidak perlu, tapi pertahankan koma dan titik
  cleaned = cleaned.replace(/[^\w\s,.\-()]/g, ' ');
  
  // Hapus multiple spaces, tabs, newlines
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Cari pola jalan (Jl., Jalan, Street, dll) dan ambil dari sana jika ada
  const jalanPattern = /\b(jl\.?\s|jalan\s|street\s|jln\.?\s|j\.?\s|str\.?\s)/i;
  const jalanMatch = cleaned.search(jalanPattern);
  
  // Jika ada pola jalan di awal atau di tengah (tapi tidak terlalu jauh), ambil dari sana
  if (jalanMatch >= 0 && jalanMatch < cleaned.length * 0.6) {
    cleaned = cleaned.substring(jalanMatch).trim();
  }
  
  // Hapus spasi ganda lagi setelah normalisasi
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
};

/**
 * Mengambil koordinat latitude dan longitude dari alamat menggunakan Nominatim
 * @param {string} address - Alamat yang akan di-geocode
 * @returns {Promise<{lat: number, lng: number} | null>} - Koordinat atau null jika gagal
 */
export const getCoordinatesFromAddress = async (address) => {
  // Validasi input: alamat kosong atau terlalu pendek
  if (!address || typeof address !== 'string') {
    console.warn('[Geocoding] Address is empty or invalid type');
    return null;
  }

  const trimmedAddress = address.trim();
  
  // Validasi panjang alamat minimum (minimal 5 karakter untuk geocoding yang berarti)
  if (trimmedAddress.length < 5) {
    console.warn('[Geocoding] Address too short:', trimmedAddress);
    return null;
  }
  
  console.log('[Geocoding] 📍 Original address:', trimmedAddress);
  
  // Normalisasi alamat
  const normalizedAddress = normalizeAddress(trimmedAddress);
  console.log('[Geocoding] 📍 Normalized address:', normalizedAddress);
  
  if (!normalizedAddress || normalizedAddress.length < 5) {
    console.warn('[Geocoding] Address too short after normalization');
    return null;
  }

  // Fungsi helper untuk mencoba geocoding dengan query tertentu menggunakan Nominatim
  const tryGeocode = async (query, timeout = 10000) => {
    if (!query || query.trim().length < 5) {
      console.warn('[Geocoding] Query too short:', query);
      return null;
    }

    try {
      const encodedAddress = encodeURIComponent(query);
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=3&countrycodes=id&accept-language=id,en&addressdetails=1`;
      
      console.log('[Geocoding] 🔍 Request to Nominatim:', query);
      console.log('[Geocoding] 🔗 URL:', nominatimUrl);
      
      // Buat AbortController untuk timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(nominatimUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'SalesActivityApp/1.0 (https://yoursite.com/contact)',
          'Accept': 'application/json',
          'Referer': window.location.origin || 'http://localhost',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Log response status
      console.log('[Geocoding] 📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.warn(`[Geocoding] Nominatim returned ${response.status}: ${response.statusText}`);
        return null;
      }

      // Parse JSON dengan error handling
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('[Geocoding] Failed to parse JSON response:', jsonError);
        return null;
      }

      console.log('[Geocoding] 📦 Nominatim response:', {
        resultsCount: Array.isArray(data) ? data.length : 0,
        firstResult: Array.isArray(data) && data.length > 0 ? {
          display_name: data[0].display_name?.substring(0, 100),
          lat: data[0].lat,
          lon: data[0].lon,
        } : null,
      });

      if (data && Array.isArray(data) && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        // Validasi koordinat yang valid
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.warn('[Geocoding] Invalid coordinates returned:', { lat, lng });
          return null;
        }
        
        return { lat, lng };
      }
      
      console.log('[Geocoding] ⚠️ No results found for query:', query);
      return null;
    } catch (error) {
      // Handle berbagai jenis error
      if (error.name === 'AbortError') {
        console.warn('[Geocoding] ⏱️ Request timeout for query:', query);
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('[Geocoding] ❌ Network error (Failed to fetch):', error.message);
        console.error('[Geocoding] 💡 Possible causes: CORS issue, network down, or Nominatim server unavailable');
      } else {
        console.error('[Geocoding] ❌ Error:', error.message, error);
      }
      return null;
    }
  };

  // Buat variasi query untuk meningkatkan akurasi geocoding
  const queryVariations = [];
  
  // 1. Alamat asli (sudah dinormalisasi)
  queryVariations.push(normalizedAddress);
  
  // 2. Alamat asli tanpa normalisasi (jika berbeda)
  if (trimmedAddress !== normalizedAddress && trimmedAddress.length >= 5) {
    queryVariations.push(trimmedAddress);
  }
  
  // 3. Ekstrak kota dan provinsi dari alamat (format: ..., Kota, Provinsi)
  const addressParts = trimmedAddress.split(',').map(part => part.trim()).filter(Boolean);
  if (addressParts.length >= 2) {
    // Ambil 2 bagian terakhir sebagai kota dan provinsi
    const province = addressParts[addressParts.length - 1];
    const city = addressParts[addressParts.length - 2];
    
    if (city && city.length >= 3) {
      queryVariations.push(`${city}, ${province}, Indonesia`);
    }
    if (city && city.length >= 3) {
      queryVariations.push(`${city}, Indonesia`);
    }
  }
  
  // 4. Jika ada nama jalan, coba dengan format yang lebih spesifik
  const jalanMatch = normalizedAddress.match(/\b(jl\.?\s|jalan\s|street\s|jln\.?\s|j\.?\s|str\.?\s)/i);
  if (jalanMatch && addressParts.length >= 2) {
    const jalanPart = normalizedAddress.substring(jalanMatch.index).split(',')[0].trim();
    if (jalanPart.length >= 10 && addressParts.length >= 2) {
      const city = addressParts[addressParts.length - 2];
      queryVariations.push(`${jalanPart}, ${city}, Indonesia`);
    }
  }
  
  // Tambahkan "Indonesia" ke semua query yang belum memilikinya
  const finalQueries = queryVariations
    .map(q => {
      if (!q || q.trim().length < 5) return null;
      const lowerQ = q.toLowerCase();
      // Tambahkan Indonesia jika belum ada
      if (!lowerQ.includes('indonesia') && !lowerQ.includes('ind')) {
        return `${q}, Indonesia`;
      }
      return q;
    })
    .filter(Boolean);
  
  // Remove duplicates dan urutkan dari yang terpanjang (paling spesifik) ke terpendek
  const uniqueQueries = [...new Set(finalQueries)].sort((a, b) => b.length - a.length);

  console.log('[Geocoding] 📋 Query variations to try:', uniqueQueries.length, 'queries');

  // Coba geocoding dengan berbagai variasi query
  // Nominatim memiliki rate limit 1 request/detik, jadi kita perlu delay antar request
  // Limit maksimal 3 query untuk menghindari terlalu lama
  const maxQueries = Math.min(uniqueQueries.length, 3);
  
  for (let i = 0; i < maxQueries; i++) {
    const query = uniqueQueries[i];
    console.log(`[Geocoding] 🔄 Trying (${i + 1}/${maxQueries}):`, query);
    
    const result = await tryGeocode(query, 10000); // 10 detik timeout
    
    if (result && result.lat && result.lng) {
      console.log('[Geocoding] ✅ Success! Coordinates:', result);
      return result;
    }
    
    // Delay 1 detik antar request untuk menghormati rate limit Nominatim
    // Jangan delay setelah request terakhir
    if (i < maxQueries - 1) {
      console.log('[Geocoding] ⏳ Waiting 1s before next request (rate limit)...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.warn('[Geocoding] ❌ All geocoding attempts failed for address:', trimmedAddress);
  return null;
};

