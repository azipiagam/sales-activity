// utils/geolocation.js
// Utility untuk geocoding address ke lat/lng menggunakan Google Geocoding API

/**
 * Simplify address dengan multiple variants untuk geocoding
 * Return array of address variations, dari paling specific ke paling general
 * @param {string} address - Full address
 * @returns {string[]} - Array of simplified addresses
 */
const getAddressVariants = (address) => {
  if (!address) return [];
  
  const variants = [];
  
  // Original address (paling specific)
  variants.push(address.trim());
  
  // Try to extract structured parts
  // Indonesian addresses usually follow: [street/details] [district] [city] [province] [country]
  const parts = address.trim().split(/[\s,]+/).filter(Boolean);
  
  // Variant 2: Last 4 parts (usually: city, province, country)
  if (parts.length >= 4) {
    variants.push(parts.slice(-4).join(' '));
  }
  
  // Variant 3: Last 3 parts (usually: city, province, country)
  if (parts.length >= 3) {
    variants.push(parts.slice(-3).join(' '));
  }
  
  // Variant 4: Last 2 parts (usually: province, country)
  if (parts.length >= 2) {
    variants.push(parts.slice(-2).join(' '));
  }
  
  // Extract city name (usually after "Kota" or standalone word before province)
  // Common Indonesian keywords
  const cityKeywords = ['kota', 'kabupaten'];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].toLowerCase();
    if (cityKeywords.includes(part) && i + 1 < parts.length) {
      // Kota/Kabupaten followed by city name
      const cityName = parts[i + 1];
      // Try with last 2 parts (city + province)
      if (i + 2 < parts.length) {
        variants.push(`${cityName} ${parts[i + 2]}`);
      }
      // Just city name
      variants.push(cityName);
    }
  }
  
  // Variant 5: Last single part (usually country or main city)
  if (parts.length >= 1) {
    variants.push(parts[parts.length - 1]);
  }
  
  // Remove duplicates
  return [...new Set(variants)];
};

/**
 * Geocode address string to latitude dan longitude
 * Menggunakan Google Geocoding API
 * 
 * @param {string} address - Alamat dalam bentuk string
 * @param {string} apiKey - Google Maps API Key
 * @returns {Promise} - { lat, lng } atau null jika gagal
 */
export const geocodeAddress = async (address, apiKey) => {
  if (!address || !apiKey) {
    console.error('Address and API key are required');
    return null;
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('address', address);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('region', 'id'); // Indonesia region hint

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.warn(`Geocoding failed: ${data.status}`, { address });
      return null;
    }

    if (data.results.length === 0) {
      console.warn('No results found for address:', { address });
      return null;
    }

    const { lat, lng } = data.results[0].geometry.location;
    
    console.log('[Geocoding] Success', { address, lat, lng });
    return { lat, lng };
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

/**
 * Fallback geocoding menggunakan browser's Geolocation
 * Ini untuk case jika Google API tidak available
 * 
 * @returns {Promise} - { lat, lng } atau null jika denied
 */
export const getApproximateLocation = async () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('[Geolocation] Browser geolocation tidak didukung');
      resolve(null);
      return;
    }

    console.log('[Geolocation] Requesting browser location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('[Geolocation] ✓ Got browser location:', result);
        resolve(result);
      },
      (error) => {
        console.warn('[Geolocation] Error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Try geocode dengan multiple address variants
 * Jika semua gagal, fallback ke browser location
 * @param {string} address - Full address
 * @param {string} apiKey - Google Maps API Key
 * @param {string} customerName - (Optional) Customer name untuk fallback
 */
export const geocodeAddressWithFallback = async (address, apiKey, customerName = '') => {
  if (!apiKey) {
    console.warn('[Geocoding] Google Maps API Key not provided, using browser location');
    return await getApproximateLocation();
  }

  const attempts = [];
  
  // Prioritas 1: Try customer name (paling simple dan reliable)
  if (customerName && customerName.trim()) {
    attempts.push({
      name: 'Customer Name',
      value: customerName.trim()
    });
  }
  
  // Prioritas 2: Try address variants (from specific to general)
  if (address) {
    const variants = getAddressVariants(address);
    variants.forEach((variant, idx) => {
      attempts.push({
        name: `Address Variant ${idx + 1}`,
        value: variant
      });
    });
  }

  console.log('[Geocoding] Trying', attempts.length, 'geocoding attempts');
  
  // Try each attempt
  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    console.log(`[Geocoding] Attempt ${i + 1}/${attempts.length}: ${attempt.name} = "${attempt.value}"`);
    
    const result = await geocodeAddress(attempt.value, apiKey);
    
    if (result) {
      console.log(`[Geocoding] ✓ Success on attempt ${i + 1} (${attempt.name})`, result);
      return result;
    }
  }

  // Semua attempt gagal, fallback ke browser geolocation
  console.log('[Geocoding] All address attempts failed, trying browser geolocation');
  const result = await getApproximateLocation();
  
  if (result) {
    console.log('[Geocoding] ✓ Success with browser geolocation', result);
    return result;
  }

  // Semua attempt gagal
  console.error('[Geocoding] ❌ All geocoding attempts failed');
  console.error('[Geocoding] Tried:', {
    customerName,
    address,
    attempts: attempts.map(a => a.value)
  });
  return null;
};

/**
 * Calculate distance antara 2 lokasi (dalam meter)
 * Menggunakan Haversine formula
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * Convert degree to radian
 */
const toRad = (degree) => {
  return degree * (Math.PI / 180);
};

/**
 * Format distance untuk display
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
};
