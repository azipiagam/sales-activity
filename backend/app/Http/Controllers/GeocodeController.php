<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class GeocodeController extends Controller
{
    /**
     * Reverse geocode koordinat menggunakan Nominatim (OpenStreetMap)
     * Endpoint: GET /api/reverse-geocode?lat={lat}&lng={lng}
     */
    public function reverseGeocode(Request $request)
    {
        try {
            $lat = $request->get('lat');
            $lng = $request->get('lng');

            // Validasi input
            if (!$lat || !$lng) {
                return response()->json([
                    'error' => 'Parameters "lat" and "lng" are required'
                ], 400);
            }

            $lat = floatval($lat);
            $lng = floatval($lng);

            if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
                return response()->json([
                    'error' => 'Invalid coordinates'
                ], 400);
            }

            // Cache key
            $cacheKey = 'reverse_geocode_' . md5($lat . ',' . $lng);

            // Cek cache terlebih dahulu (cache 1 jam)
            $cachedResult = Cache::get($cacheKey);
            if ($cachedResult) {
                Log::info('[Reverse Geocode] Cache hit for coordinates:', ['lat' => $lat, 'lng' => $lng]);
                return response()->json($cachedResult);
            }

            Log::info('[Reverse Geocode] Searching for:', ['lat' => $lat, 'lng' => $lng]);

            $result = $this->tryReverseGeocode($lat, $lng);

            if ($result) {
                // Cache hasil selama 1 jam
                Cache::put($cacheKey, $result, 3600);

                Log::info('[Reverse Geocode] Success:', ['lat' => $lat, 'lng' => $lng, 'result' => $result]);
                return response()->json($result);
            }

            Log::warning('[Reverse Geocode] Failed:', ['lat' => $lat, 'lng' => $lng]);
            return response()->json([
                'error' => 'Address not found'
            ], 404);

        } catch (\Exception $e) {
            Log::error('[Reverse Geocode] Exception:', [
                'message' => $e->getMessage(),
                'lat' => $request->get('lat', ''),
                'lng' => $request->get('lng', ''),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Reverse geocoding service temporarily unavailable'
            ], 500);
        }
    }

    /**
     * Geocode alamat menggunakan Nominatim (OpenStreetMap)
     * Endpoint: GET /api/geocode?q={address}
     */
    public function geocode(Request $request)
    {
        try {
            $query = $request->get('q');

            // Validasi input
            if (!$query || trim($query) === '') {
                return response()->json([
                    'error' => 'Query parameter "q" is required'
                ], 400);
            }

            $trimmedQuery = trim($query);

            // Minimal 3 karakter
            if (strlen($trimmedQuery) < 3) {
                return response()->json([
                    'error' => 'Query too short, minimum 3 characters'
                ], 400);
            }

            // Cache key untuk menghindari request berulang
            $cacheKey = 'geocode_' . md5($trimmedQuery);

            // Cek cache terlebih dahulu (cache 1 jam)
            $cachedResult = Cache::get($cacheKey);
            if ($cachedResult) {
                Log::info('[Geocode] Cache hit for query:', ['query' => $trimmedQuery]);
                return response()->json($cachedResult);
            }

            // Normalisasi query - tambahkan Indonesia jika belum ada
            $normalizedQuery = $this->normalizeAddress($trimmedQuery);

            Log::info('[Geocode] Searching for:', ['original' => $trimmedQuery, 'normalized' => $normalizedQuery]);

            // Coba query asli terlebih dahulu
            $result = $this->tryGeocode($normalizedQuery);
            if ($result) {
                // Cache hasil selama 1 jam
                Cache::put($cacheKey, $result, 3600);

                Log::info('[Geocode] Success with original query:', ['query' => $normalizedQuery, 'result' => $result]);
                return response()->json($result);
            }

            // Jika gagal, coba variasi query
            $queryVariations = $this->generateQueryVariations($normalizedQuery);
            Log::info('[Geocode] Trying variations:', ['variations' => $queryVariations]);

            foreach ($queryVariations as $variation) {
                // Skip jika variasi mengandung hanya "Indonesia"
                if (preg_match('/^indonesia$/i', trim($variation))) {
                    continue;
                }

                $result = $this->tryGeocode($variation);

                if ($result) {
                    // Cache hasil selama 1 jam
                    Cache::put($cacheKey, $result, 3600);

                    Log::info('[Geocode] Success with variation:', ['query' => $variation, 'result' => $result]);
                    return response()->json($result);
                }

                // Delay 500ms antar request untuk menghormati rate limit Nominatim
                usleep(500000); // 0.5 detik
            }

            Log::warning('[Geocode] All attempts failed:', ['query' => $trimmedQuery]);
            return response()->json([
                'error' => 'Location not found'
            ], 404);

        } catch (\Exception $e) {
            Log::error('[Geocode] Exception:', [
                'message' => $e->getMessage(),
                'query' => $request->get('q', ''),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Geocoding service temporarily unavailable'
            ], 500);
        }
    }

    /**
     * Normalisasi alamat untuk geocoding
     */
    private function normalizeAddress($address)
    {
        // Tambahkan Indonesia jika belum ada
        $lowerAddress = strtolower($address);
        if (!str_contains($lowerAddress, 'indonesia') && !str_contains($lowerAddress, 'ind')) {
            return $address . ', Indonesia';
        }

        return $address;
    }

    /**
     * Generate variasi query untuk meningkatkan akurasi geocoding
     */
    private function generateQueryVariations($baseQuery)
    {
        $variations = [$baseQuery];

        // Jika ada koma, coba dengan bagian yang lebih spesifik (kota/kecamatan)
        $parts = explode(',', $baseQuery);
        if (count($parts) >= 3) {
            // Ambil bagian kota/kecamatan (sebelum provinsi dan negara)
            $cityPart = trim($parts[count($parts) - 2]);
            if (strlen($cityPart) >= 3 && !preg_match('/indonesia/i', $cityPart)) {
                $variations[] = $cityPart . ', Indonesia';
            }

            // Ambil kombinasi alamat + kota
            if (count($parts) >= 4) {
                $addressCity = trim($parts[0]) . ', ' . trim($parts[1]) . ', Indonesia';
                if (strlen($addressCity) >= 10) {
                    $variations[] = $addressCity;
                }
            }
        }

        // Jika ada kata kunci jalan, coba dengan format yang berbeda
        if (preg_match('/\b(jl\.?\s?|jalan\s?|street\s?)/i', $baseQuery)) {
            // Ambil dari "Jl." sampai sebelum koma pertama
            $jalanMatch = preg_split('/\b(jl\.?\s?|jalan\s?|street\s?)/i', $baseQuery, 2);
            if (count($jalanMatch) >= 2) {
                $jalanPart = trim($jalanMatch[1]);
                $jalanPart = preg_replace('/,.*/', '', $jalanPart); // Hapus setelah koma
                if (strlen($jalanPart) >= 5) {
                    // Tambahkan kota jika tersedia
                    $cityFromParts = explode(',', $baseQuery);
                    $city = (count($cityFromParts) >= 2) ? trim($cityFromParts[1]) : 'Jakarta';
                    $variations[] = $jalanPart . ', ' . $city . ', Indonesia';
                }
            }
        }

        // Limit maksimal 3 variasi untuk performa
        return array_slice(array_unique($variations), 0, 3);
    }

    /**
     * Coba geocoding dengan satu query
     */
    private function tryGeocode($query)
    {
        try {
            $encodedQuery = urlencode($query);

            $url = "https://nominatim.openstreetmap.org/search?" . http_build_query([
                'format' => 'json',
                'q' => $encodedQuery,
                'limit' => 1,
                'countrycodes' => 'id',
                'accept-language' => 'id,en',
                'addressdetails' => 1
            ]);

            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => 'SalesActivityApp/1.0 (https://yoursite.com/contact)',
                    'Accept' => 'application/json',
                ])
                ->get($url);

            if (!$response->successful()) {
                Log::warning('[Geocode] Nominatim error:', [
                    'status' => $response->status(),
                    'query' => $query
                ]);
                return null;
            }

            $data = $response->json();

            if (empty($data) || !is_array($data)) {
                return null;
            }

            $result = $data[0];
            $lat = floatval($result['lat']);
            $lng = floatval($result['lon']);

            // Validasi koordinat
            if (is_nan($lat) || is_nan($lng) ||
                $lat < -90 || $lat > 90 ||
                $lng < -180 || $lng > 180) {
                Log::warning('[Geocode] Invalid coordinates:', [
                    'lat' => $lat,
                    'lng' => $lng,
                    'query' => $query
                ]);
                return null;
            }

            return [
                'lat' => $lat,
                'lng' => $lng,
                'display_name' => $result['display_name'] ?? $query
            ];

        } catch (\Exception $e) {
            Log::error('[Geocode] Request error:', [
                'query' => $query,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Coba reverse geocoding dengan koordinat
     */
    private function tryReverseGeocode($lat, $lng)
    {
        try {
            $url = "https://nominatim.openstreetmap.org/reverse?" . http_build_query([
                'format' => 'json',
                'lat' => $lat,
                'lon' => $lng,
                'addressdetails' => 1,
                'accept-language' => 'id,en'
            ]);

            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => 'SalesActivityApp/1.0 (https://yoursite.com/contact)',
                    'Accept' => 'application/json',
                ])
                ->get($url);

            if (!$response->successful()) {
                Log::warning('[Reverse Geocode] Nominatim error:', [
                    'status' => $response->status(),
                    'lat' => $lat,
                    'lng' => $lng
                ]);
                return null;
            }

            $data = $response->json();

            if (empty($data) || !isset($data['display_name'])) {
                return null;
            }

            return [
                'display_name' => $data['display_name']
            ];

        } catch (\Exception $e) {
            Log::error('[Reverse Geocode] Request error:', [
                'lat' => $lat,
                'lng' => $lng,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
