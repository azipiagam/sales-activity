/**
 * Utility functions for geocoding addresses
 */

export const getCoordinatesFromAddress = async (address, apiKey = '') => {
  if (!address || !address.trim()) {
    console.warn('Address is empty');
    return null;
  }

  const trimmedAddress = address.trim();
  console.log('📍 Geocoding address (original):', trimmedAddress);
  console.log('📍 Address length:', trimmedAddress.length);
  
  // Fungsi untuk membersihkan alamat dari nama perusahaan dan karakter tidak perlu
  const cleanAddress = (addr) => {
    let cleaned = addr.trim();
    
    // Hapus karakter khusus yang tidak perlu
    cleaned = cleaned.replace(/[^\w\s,.-]/g, ' ');
    
    // Cari pola jalan (Jl., Jalan, Street, dll) dan ambil dari sana
    // Ini akan menghilangkan nama perusahaan di depan
    const jalanPattern = /(jl\.?\s|jalan\s|street\s|jln\.?\s|j\.?\s)/i;
    const jalanMatch = cleaned.search(jalanPattern);
    
    if (jalanMatch > 0 && jalanMatch < cleaned.length * 0.5) {
      // Jika ditemukan "Jl." atau "Jalan" di bagian awal alamat, ambil dari sana
      cleaned = cleaned.substring(jalanMatch).trim();
    }
    
    // Hapus spasi ganda
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  };

  // Fungsi helper untuk mencoba geocoding dengan query tertentu
  const tryGeocode = async (query, service = 'nominatim') => {
    try {
      if (service === 'google' && apiKey) {
        const encodedAddress = encodeURIComponent(query);
        const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=id&language=id`;
        
        const response = await fetch(googleUrl);
        if (!response.ok) {
          console.warn(`Google API returned ${response.status}`);
          return null;
        }
        
        const data = await response.json();
        console.log('Google Geocoding response status:', data.status);
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          return {
            latitude: location.lat,
            longitude: location.lng,
          };
        } else {
          console.warn('Google Geocoding status:', data.status, data.error_message);
        }
        return null;
      } else if (service === 'nominatim') {
        const encodedAddress = encodeURIComponent(query);
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=3&countrycodes=id&accept-language=id,en&addressdetails=1`;
        
        const response = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'AbsensiSalesApp/1.0',
            'Referer': window.location.origin || 'http://localhost',
          },
        });

        if (!response.ok) {
          console.warn(`Nominatim returned ${response.status}`);
          return null;
        }

        const data = await response.json();
        console.log('OpenStreetMap response:', data?.length || 0, 'results');
        if (data && Array.isArray(data) && data.length > 0) {
          const result = data[0];
          return {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
          };
        }
        return null;
      }
    } catch (error) {
      console.warn(`Geocoding error for ${service}:`, error);
      return null;
    }
    return null;
  };

  const queryVariations = [];
  
  queryVariations.push(trimmedAddress);
  
  const cleanedAddress = cleanAddress(trimmedAddress);
  if (cleanedAddress && cleanedAddress !== trimmedAddress && cleanedAddress.length > 10) {
    queryVariations.push(cleanedAddress);
    console.log('Cleaned address:', cleanedAddress);
  }
  
  const cityMatch = trimmedAddress.match(/([^,]+),\s*([^,]+)(?:,\s*([^,]+))?/);
  if (cityMatch && cityMatch.length >= 3) {
    const city = cityMatch[cityMatch.length - 2]?.trim();
    const province = cityMatch[cityMatch.length - 1]?.trim();
    if (city && province) {
      queryVariations.push(`${city}, ${province}, Indonesia`);
    }
    if (city) {
      queryVariations.push(`${city}, Indonesia`);
    }
  }
  
  const finalQueries = queryVariations.map(q => {
    if (!q || q.trim().length < 5) return null;
    const lowerQ = q.toLowerCase();
    if (!lowerQ.includes('indonesia') && !lowerQ.includes('ind')) {
      return `${q}, Indonesia`;
    }
    return q;
  }).filter(Boolean); 
  
  const uniqueQueries = [...new Set(finalQueries)].sort((a, b) => b.length - a.length);

  console.log('Query variations to try:', uniqueQueries);

  if (apiKey) {
    for (const query of uniqueQueries) {
      console.log('Trying Google Geocoding with:', query);
      const result = await tryGeocode(query, 'google');
      if (result) {
        console.log('Google Geocoding success:', result);
        return result;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  const nominatimQueries = uniqueQueries.slice(0, 5);
  for (let i = 0; i < nominatimQueries.length; i++) {
    const query = nominatimQueries[i];
    console.log(`Trying OpenStreetMap (${i + 1}/${nominatimQueries.length}) with:`, query);
    const result = await tryGeocode(query, 'nominatim');
    if (result) {
      console.log('✅ OpenStreetMap success:', result);
      return result;
    }
    if (i < nominatimQueries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.warn('❌ All geocoding attempts failed for address:', trimmedAddress);
  console.log('💡 Peta tetap akan ditampilkan menggunakan Google Maps Embed dengan alamat tersebut');
  return null;
};

