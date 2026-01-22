const GEOCODE_API_BASE_URL = '/api/geocode';
const REQUEST_DELAY = 500;
let lastRequestTime = 0;

// Google Maps API Key untuk fallback
const GOOGLE_MAPS_API_KEY = 'AIzaSyCOtWjb76olbxd98XsfqhdnDpv-BTi7wxg';

/**
 * Extract city name from address string
 * @param {string} address - Full address string
 * @param {string} source - Source of the address ('openstreetmap', 'google_maps', etc.)
 * @returns {string} - City name or fallback
 */
const extractCityFromAddress = (address, source = 'unknown') => {
  if (!address || typeof address !== 'string') {
    return 'Lokasi Tidak Diketahui';
  }

  // Remove coordinate fallbacks like "-6.123456, 106.123456"
  if (address.includes(',') && /^\s*-?\d+\.\d+,\s*-?\d+\.\d+/.test(address.split(',')[0].trim())) {
    return 'Koordinat GPS';
  }

  try {
    // For Google Maps addresses (more structured)
    if (source === 'google_maps') {
      // Google Maps format: "Jl. Sudirman No.1, Jakarta Pusat, Jakarta, Indonesia"
      const parts = address.split(',').map(part => part.trim());

      // Look for city indicators in reverse order
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i].toLowerCase();

        // Skip postal codes (5 digits)
        if (/^\d{5}$/.test(part)) continue;

        // Skip country names
        if (part.includes('indonesia') || part.includes('indonesian')) continue;

        // Look for city keywords
        if (part.includes('jakarta') ||
            part.includes('surabaya') ||
            part.includes('bandung') ||
            part.includes('medan') ||
            part.includes('semarang') ||
            part.includes('makassar') ||
            part.includes('palembang') ||
            part.includes('batam') ||
            part.includes('pekanbaru') ||
            part.includes('bali') ||
            part.includes('yogyakarta') ||
            part.includes('solo') ||
            part.includes('malang') ||
            part.includes('bekasi') ||
            part.includes('tangerang') ||
            part.includes('depok') ||
            part.includes('bogor')) {
          return parts[i];
        }

        // If we find a reasonable length part (likely a city/district name)
        if (part.length > 2 && part.length < 50 && !part.includes('no.') && !part.includes('jl.') && !part.includes('jln.')) {
          return parts[i];
        }
      }

      // Fallback to first meaningful part
      const firstMeaningfulPart = parts.find(part =>
        part.length > 2 &&
        !part.includes('no.') &&
        !part.includes('jl.') &&
        !part.includes('jln.') &&
        !/^\d/.test(part)
      );
      return firstMeaningfulPart || 'Jakarta';
    }

    // For OpenStreetMap addresses (less structured)
    if (source === 'openstreetmap') {
      // OpenStreetMap format varies, try to find city-like patterns
      const parts = address.split(',').map(part => part.trim());

      // Look for city patterns
      for (const part of parts) {
        const lowerPart = part.toLowerCase();

        // Skip very short parts or parts that look like streets
        if (part.length < 3 || lowerPart.includes('jl.') || lowerPart.includes('jln.') ||
            lowerPart.includes('no.') || /^\d/.test(part)) {
          continue;
        }

        // Indonesian city patterns
        const cityKeywords = ['kabupaten', 'kota', 'kab.', 'kecamatan', 'kelurahan', 'desa'];
        if (cityKeywords.some(keyword => lowerPart.includes(keyword))) {
          // Extract the actual name after the keyword
          const keywordMatch = cityKeywords.find(keyword => lowerPart.includes(keyword));
          if (keywordMatch) {
            const keywordIndex = lowerPart.indexOf(keywordMatch);
            const namePart = part.substring(keywordIndex + keywordMatch.length).trim();
            if (namePart.length > 2) {
              return namePart;
            }
          }
        }

        // Major cities
        if (lowerPart.includes('jakarta') || lowerPart.includes('surabaya') ||
            lowerPart.includes('bandung') || lowerPart.includes('medan') ||
            lowerPart.includes('bali') || lowerPart.includes('yogyakarta')) {
          return part;
        }

        // Reasonable length parts are likely cities/districts
        if (part.length >= 3 && part.length <= 30) {
          return part;
        }
      }

      // Fallback to first reasonable part
      const reasonablePart = parts.find(part =>
        part.length >= 3 &&
        part.length <= 30 &&
        !part.includes('jl.') &&
        !part.includes('jln.') &&
        !/^\d/.test(part)
      );
      return reasonablePart || 'Lokasi';
    }

    // For coordinate fallbacks or unknown sources
    return address.length > 50 ? address.substring(0, 47) + '...' : address;

  } catch (error) {
    console.warn('Error extracting city from address:', error);
    return 'Lokasi';
  }
};

/**
 * Delay untuk respect rate limiting
 */
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
};

/**
 * Menyederhanakan alamat untuk geocoding dengan menghilangkan detail yang terlalu spesifik
 * @param {string} address - Alamat lengkap
 * @returns {string[]} - Array dari versi alamat yang disederhanakan (dari spesifik ke umum)
 */
const simplifyAddressForGeocoding = (address) => {
  if (!address || typeof address !== 'string') {
    return [''];
  }

  const original = address.trim();
  const simplified = [];

  // 1. Original address (untuk kasus langka di mana alamat lengkap terdaftar)
  simplified.push(original);

  // 2. Remove specific details that often cause geocoding to fail
  let cleaned = original;

  // Remove RT/RW patterns: "RT. -, RW. -", "RT. 001, RW. 002", etc.
  cleaned = cleaned.replace(/RT\.?\s*-?\s*,?\s*RW\.?\s*-?\s*/gi, '');
  cleaned = cleaned.replace(/RT\.?\s*\d{1,3},?\s*RW\.?\s*\d{1,3}/gi, '');

  // Remove door/gate numbers: "Pintu 3, 4, 5, 6", "Gerbang A", etc.
  cleaned = cleaned.replace(/Pintu\s*\d+(?:\s*,\s*\d+)*,?/gi, '');
  cleaned = cleaned.replace(/Gerbang\s*\w+,?/gi, '');

  // Remove specific building details: "No.-", "No. -", etc.
  cleaned = cleaned.replace(/No\.?\s*-,?/gi, '');
  cleaned = cleaned.replace(/No\.?\s*\d+[A-Z]?,?/gi, ''); // Keep some building numbers

  // Remove company specific details that might not be in geocoding database
  cleaned = cleaned.replace(/Komp\.?\s*Pergudangan\s*/gi, '');
  cleaned = cleaned.replace(/PT\.?\s+[\w\s]+,?/gi, '');
  cleaned = cleaned.replace(/CV\.?\s+[\w\s]+,?/gi, '');

  // Clean up extra spaces and commas
  cleaned = cleaned.replace(/\s+/g, ' ').replace(/,+/g, ',').replace(/,\s*$/, '').trim();

  if (cleaned !== original && cleaned.length > 5) {
    simplified.push(cleaned);
  }

  // 3. Extract city + province only (most reliable)
  const cityProvinceMatch = original.match(/Kota\s+([^,]+),\s*([^,]+),\s*Indonesia/i);
  if (cityProvinceMatch) {
    simplified.push(`${cityProvinceMatch[1].trim()}, ${cityProvinceMatch[2].trim()}, Indonesia`);
  }

  // 4. City only (most basic but reliable)
  const cityMatches = original.match(/Kota\s+([^,]+)/i);
  if (cityMatches) {
    simplified.push(cityMatches[1].trim() + ', Indonesia');
  }

  // 5. Province only (fallback)
  const provinceMatches = original.match(/(Sumatera\s+Utara|Jawa\s+Barat|Jawa\s+Tengah|Jawa\s+Timur|DKI\s+Jakarta|Banten|DI\s+Yogyakarta|Bali|Kalimantan|Nusa\s+Tenggara|Sulawesi|Maluku|Papua)/i);
  if (provinceMatches) {
    simplified.push(provinceMatches[1] + ', Indonesia');
  }

  // Remove duplicates and empty strings
  const unique = [...new Set(simplified.filter(addr => addr && addr.trim().length > 2))];

  console.log('Simplified address versions:', unique);
  return unique;
};

/**
 * Menganalisis alamat dan memberikan tips untuk memperbaiki geocoding
 * @param {string} address - Alamat yang bermasalah
 * @returns {Object} - Analisis dan tips
 */
export const analyzeAddressForGeocoding = (address) => {
  const issues = [];
  const suggestions = [];

  if (!address || !address.trim()) {
    return { issues: ['Alamat kosong'], suggestions: ['Masukkan alamat lengkap'] };
  }

  const addr = address.toLowerCase();

  // Check for specific company names that might not be in geocoding databases
  if (addr.includes('pt.') || addr.includes('cv.') || addr.includes('komp. pergudangan')) {
    issues.push('Nama perusahaan spesifik sulit ditemukan di database geocoding');
    suggestions.push('Coba gunakan alamat umum tanpa nama perusahaan');
  }

  // Check for specific gate/door numbers
  if (addr.includes('pintu ') || addr.includes('gerbang ')) {
    issues.push('Nomor pintu/gerbang terlalu spesifik');
    suggestions.push('Gunakan alamat area umum tanpa nomor pintu');
  }

  // Check for empty RT/RW
  if (addr.includes('rt. -') || addr.includes('rw. -')) {
    issues.push('RT/RW kosong (-) membuat alamat tidak lengkap');
    suggestions.push('Isi RT/RW yang benar atau gunakan alamat tanpa RT/RW');
  }

  // Check for very specific building details
  if (addr.includes('no.-') || addr.includes('no. -')) {
    issues.push('Nomor bangunan kosong (-) membuat alamat tidak lengkap');
    suggestions.push('Isi nomor bangunan yang benar');
  }

  // Check for very long/complex addresses
  if (address.length > 150) {
    issues.push('Alamat terlalu panjang dan kompleks');
    suggestions.push('Gunakan versi alamat yang lebih sederhana');
  }

  // Check for Indonesian city recognition
  const cities = ['jakarta', 'surabaya', 'bandung', 'medan', 'semarang', 'makassar', 'palembang', 'batam', 'pekanbaru', 'yogyakarta', 'solo', 'malang', 'bekasi', 'tangerang', 'depok', 'bogor'];
  const hasCity = cities.some(city => addr.includes(city));

  if (!hasCity) {
    issues.push('Kota tidak terdeteksi atau tidak dikenal');
    suggestions.push('Pastikan nama kota ditulis dengan benar');
  }

  // Provide simplified version suggestion
  const simplifiedVersions = simplifyAddressForGeocoding(address);
  if (simplifiedVersions.length > 1) {
    suggestions.push(`Coba versi sederhana: "${simplifiedVersions[1]}"`);
  }

  return {
    issues,
    suggestions,
    simplifiedVersions: simplifiedVersions.slice(1), // Exclude original
    hasIssues: issues.length > 0
  };
};

/**
 * Enhanced geocoding dengan fallback ke versi alamat yang disederhanakan
 * @param {string} address - Alamat lengkap
 * @returns {Promise<{lat: number, lng: number, address: string, confidence: string, analysis?: Object}>}
 */
export const getCoordinatesFromAddressEnhanced = async (address) => {
  if (!address || typeof address !== 'string' || !address.trim()) {
    throw new Error('Alamat tidak boleh kosong');
  }

  // Analyze the address first
  const analysis = analyzeAddressForGeocoding(address);

  const simplifiedVersions = simplifyAddressForGeocoding(address);
  let lastError = null;

  // Try each simplified version from most specific to most general
  for (let i = 0; i < simplifiedVersions.length; i++) {
    const addressVersion = simplifiedVersions[i];

    try {
      console.log(`Trying geocoding version ${i + 1}/${simplifiedVersions.length}: "${addressVersion}"`);

      // Use existing geocoding function
      const result = await getCoordinatesFromAddress(addressVersion);

      // Add confidence information
      const confidence = i === 0 ? 'exact' : i <= 2 ? 'good' : 'approximate';

      return {
        ...result,
        address: addressVersion, // Return the address that worked
        confidence,
        originalAddress: address,
        analysis: analysis.hasIssues ? analysis : undefined
      };

    } catch (error) {
      console.warn(`Geocoding version ${i + 1} failed:`, error.message);
      lastError = error;

      // Continue to next simplified version
      continue;
    }
  }

  // If all versions failed, include analysis in the error
  const errorMessage = analysis.hasIssues
    ? `Alamat sulit dicari. ${analysis.suggestions[0] || 'Coba gunakan alamat yang lebih umum.'}`
    : 'Tidak dapat menemukan koordinat untuk alamat apapun';

  throw new Error(errorMessage);
};

/**
 * Mengambil koordinat latitude dan longitude dari alamat (original function)
 * @param {string} address
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const getCoordinatesFromAddress = async (address) => {
  if (!address || typeof address !== 'string' || !address.trim()) {
    throw new Error('Alamat tidak boleh kosong');
  }

  const trimmedAddress = address.trim();

  if (trimmedAddress.length < 3) {
    throw new Error('Alamat terlalu pendek, minimal 3 karakter');
  }

  try {
    await waitForRateLimit();

    const params = new URLSearchParams({
      q: trimmedAddress,
    });

    const url = `${GEOCODE_API_BASE_URL}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Query tidak valid');
      }
      if (response.status === 404) {
        throw new Error('Lokasi tidak ditemukan');
      }
      if (response.status === 429) {
        throw new Error('Terlalu banyak permintaan. Silakan tunggu sebentar.');
      }
      if (response.status === 500) {
        throw new Error('Server geocoding sedang bermasalah');
      }
      throw new Error(`Geocoding gagal: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.lat || !data.lng) {
      throw new Error('Response tidak valid dari server');
    }

    const lat = parseFloat(data.lat);
    const lng = parseFloat(data.lng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Koordinat tidak valid');
    }

    console.log('[Geocoding] Success:', {
      address: trimmedAddress,
      lat,
      lng,
      display_name: data.display_name
    });

    return {
      lat,
      lng,
      display_name: data.display_name || trimmedAddress
    };

  } catch (error) {
    console.error('[Geocoding] Error:', error);

    if (error.message.includes('fetch') || error.message.includes('Network')) {
      throw new Error('Gagal terhubung ke server geocoding');
    }

    throw error;
  }
};

/**
 * Reverse geocoding: mendapatkan alamat dari koordinat
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} - Alamat atau error
 */
export const getAddressFromCoordinates = async (lat, lng) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Koordinat tidak valid');
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Koordinat di luar jangkauan');
  }

  try {
    await waitForRateLimit();

    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });

    const url = `/api/reverse-geocode?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Koordinat tidak valid');
      }
      if (response.status === 404) {
        throw new Error('Alamat tidak ditemukan');
      }
      if (response.status === 500) {
        throw new Error('Server reverse geocoding sedang bermasalah');
      }
      throw new Error(`Reverse geocoding gagal: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.display_name) {
      throw new Error('Response tidak valid dari server');
    }

    return data.display_name;

  } catch (error) {
    console.error('[Reverse Geocoding] Error:', error);

    // Re-throw error dengan pesan yang user-friendly
    if (error.message.includes('fetch') || error.message.includes('Network')) {
      throw new Error('Gagal terhubung ke server reverse geocoding');
    }

    throw error;
  }
};

/**
 * Enhanced geolocation dengan retry mechanism dan multiple strategies
 * @param {Object} options - Options untuk geolocation
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number, method: string}>}
 */
export const getAccurateLocation = async (options = {}) => {
  const {
    maxRetries = 3,
    timeout = 15000,
    desiredAccuracy = 100, // dalam meter
    onProgress = null,
    onRetry = null
  } = options;

  if (!navigator.geolocation) {
    throw new Error('GPS tidak tersedia di perangkat ini. Silakan gunakan perangkat yang mendukung GPS.');
  }

  let lastError = null;
  let bestPosition = null;

  // Strategy 1: High accuracy, fresh location
  const strategies = [
    {
      name: 'high_accuracy_fresh',
      options: {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 0, // Fresh location only
      },
      priority: 1
    },
    {
      name: 'high_accuracy_cached',
      options: {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 300000, // 5 minutes cache
      },
      priority: 2
    },
    {
      name: 'balanced_accuracy',
      options: {
        enableHighAccuracy: false,
        timeout: timeout,
        maximumAge: 600000, // 10 minutes cache
      },
      priority: 3
    }
  ];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (const strategy of strategies) {
      try {
        if (onProgress) {
          onProgress(`Mencoba mendapatkan lokasi (Percobaan ${attempt + 1}/${maxRetries}) - ${strategy.name.replace('_', ' ')}...`);
        }

        const position = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Timeout mendapatkan lokasi'));
          }, strategy.options.timeout);

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeoutId);
              resolve(pos);
            },
            (error) => {
              clearTimeout(timeoutId);
              reject(error);
            },
            strategy.options
          );
        });

        const { latitude, longitude, accuracy } = position.coords;

        // Validate coordinates
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          throw new Error('Koordinat tidak valid');
        }

        // Check if this is better than previous position
        const isBetterPosition =
          !bestPosition ||
          accuracy < bestPosition.accuracy ||
          (accuracy === bestPosition.accuracy && strategy.priority < bestPosition.strategy.priority);

        if (isBetterPosition) {
          bestPosition = {
            latitude,
            longitude,
            accuracy,
            strategy,
            timestamp: position.timestamp
          };
        }

        // If accuracy is good enough, return immediately
        if (accuracy <= desiredAccuracy) {
          if (onProgress) {
            onProgress(`Lokasi akurat ditemukan! Akurasi: ${Math.round(accuracy)}m`);
          }
          return {
            latitude,
            longitude,
            accuracy,
            method: strategy.name,
            isAccurate: true
          };
        }

      } catch (error) {
        console.warn(`Strategy ${strategy.name} failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    // If we have a position but it's not accurate enough, call retry callback
    if (bestPosition && attempt < maxRetries - 1) {
      if (onRetry) {
        onRetry(bestPosition, attempt + 1, maxRetries);
      }
    }
  }

  // Return best available position if we have one
  if (bestPosition) {
    const { latitude, longitude, accuracy, strategy } = bestPosition;
    if (onProgress) {
      onProgress(`Lokasi ditemukan dengan akurasi ${Math.round(accuracy)}m. ${accuracy > desiredAccuracy ? 'Akurasi kurang optimal.' : ''}`);
    }
    return {
      latitude,
      longitude,
      accuracy,
      method: strategy.name,
      isAccurate: accuracy <= desiredAccuracy
    };
  }

  // If all strategies failed, throw the last error
  if (lastError) {
    let errorMessage = 'Gagal mendapatkan lokasi GPS. ';
    if (lastError.code === 1) {
      errorMessage += 'Izin akses lokasi ditolak. Silakan berikan izin akses lokasi di pengaturan browser.';
    } else if (lastError.code === 2) {
      errorMessage += 'Lokasi tidak tersedia. Pastikan GPS aktif dan tidak ada gangguan sinyal.';
    } else if (lastError.code === 3) {
      errorMessage += 'Waktu tunggu habis. Silakan coba lagi di area dengan sinyal GPS yang lebih baik.';
    } else {
      errorMessage += lastError.message || 'Silakan coba lagi.';
    }
    throw new Error(errorMessage);
  }

  throw new Error('Tidak dapat mendapatkan lokasi setelah mencoba berbagai metode.');
};

/**
 * Enhanced reverse geocoding dengan Google Maps fallback
 * SELALU mengembalikan marker coordinates, hanya mengambil city name dari alamat
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} options - Options untuk reverse geocoding
 * @returns {Promise<{address: string, city: string, source: string, isApproximate: boolean, coordinates: {lat: number, lng: number}}>}
 */
export const getEnhancedAddressFromCoordinates = async (lat, lng, options = {}) => {
  const { useGoogleFallback = true, accuracy = null } = options;

  let fullAddress = null;
  let source = 'coordinates';
  let isApproximate = true;

  // First try OpenStreetMap (existing backend API)
  try {
    fullAddress = await getAddressFromCoordinates(lat, lng);
    source = 'openstreetmap';
    isApproximate = false;
  } catch (error) {
    console.warn('OpenStreetMap reverse geocoding failed:', error.message);

    // Fallback to Google Maps Geocoding API
    if (useGoogleFallback && GOOGLE_MAPS_API_KEY) {
      try {
        console.log('Trying Google Maps reverse geocoding as fallback...');

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=id`
        );

        if (!response.ok) {
          throw new Error(`Google Maps API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0];
          fullAddress = result.formatted_address;
          source = 'google_maps';
          isApproximate = accuracy && accuracy > 100; // Consider approximate if accuracy > 100m
        } else {
          throw new Error(`Google Maps API returned status: ${data.status}`);
        }

      } catch (googleError) {
        console.warn('Google Maps fallback also failed:', googleError.message);
      }
    }
  }

  // Extract city from address (or use fallback)
  const city = extractCityFromAddress(fullAddress, source);

  // Always return coordinates for marker, even if address failed
  return {
    address: fullAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    city: city,
    source: source,
    isApproximate: isApproximate,
    coordinates: {
      lat: lat,
      lng: lng
    }
  };
};

/**
 * Get approximate location if exact location is not available
 * @param {Object} options - Options untuk approximate location
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number, isApproximate: boolean}>}
 */
export const getApproximateLocation = async (options = {}) => {
  const { fallbackToIP = true, fallbackToNetwork = true } = options;

  try {
    // First try to get any location with lower accuracy requirements
    return await getAccurateLocation({
      ...options,
      desiredAccuracy: 500, // Accept up to 500m accuracy
      maxRetries: 2
    });
  } catch (error) {
    console.warn('Accurate location failed, trying approximate methods:', error.message);

    // Fallback to IP-based geolocation (less accurate but works indoors)
    if (fallbackToIP) {
      try {
        console.log('Trying IP-based geolocation...');

        // Using a free IP geolocation service
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          if (data.latitude && data.longitude) {
            return {
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: 5000, // IP geolocation is typically ~5km accurate
              method: 'ip_based',
              isApproximate: true,
              isAccurate: false
            };
          }
        }
      } catch (ipError) {
        console.warn('IP-based geolocation failed:', ipError.message);
      }
    }

    // Fallback to network-based location (if available)
    if (fallbackToNetwork) {
      try {
        console.log('Trying network-based location...');

        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 600000 // 10 minutes
            }
          );
        });

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || 1000,
          method: 'network_based',
          isApproximate: true,
          isAccurate: position.coords.accuracy <= 500
        };

      } catch (networkError) {
        console.warn('Network-based location failed:', networkError.message);
      }
    }

    throw new Error('Tidak dapat mendapatkan lokasi dengan metode apapun. Pastikan GPS aktif atau coba di area dengan sinyal yang lebih baik.');
  }
};