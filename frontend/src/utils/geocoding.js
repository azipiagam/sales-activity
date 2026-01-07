/**
 * Utility functions for geocoding addresses using backend API proxy
 * Backend akan memanggil Nominatim API untuk menghindari CORS issues
 */

const GEOCODE_API_BASE_URL = '/api/geocode';
const REQUEST_DELAY = 500; // Rate limit untuk backend API
let lastRequestTime = 0;

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
 * Mengambil koordinat latitude dan longitude dari alamat
 * @param {string} address - Alamat yang akan di-geocode
 * @returns {Promise<{lat: number, lng: number}>} - Koordinat atau throw error jika gagal
 */
export const getCoordinatesFromAddress = async (address) => {
  if (!address || typeof address !== 'string' || !address.trim()) {
    throw new Error('Alamat tidak boleh kosong');
  }

  const trimmedAddress = address.trim();

  // Minimal 3 karakter untuk search
  if (trimmedAddress.length < 3) {
    throw new Error('Alamat terlalu pendek, minimal 3 karakter');
  }

  try {
    // Respect rate limiting
    await waitForRateLimit();

    // Build query parameters untuk backend API
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

    // Check if location found - backend returns error for not found
    if (!data || !data.lat || !data.lng) {
      throw new Error('Response tidak valid dari server');
    }

    const lat = parseFloat(data.lat);
    const lng = parseFloat(data.lng);

    // Validasi koordinat dalam range yang valid
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

    // Re-throw error dengan pesan yang user-friendly
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