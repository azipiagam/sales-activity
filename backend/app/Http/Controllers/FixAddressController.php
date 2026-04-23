<?php
// app/Http/Controllers/FixAddressController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class FixAddressController extends Controller
{
    /**
     * Upsert fix address for a customer.
     * URL: POST /api/customers/{customerId}/fix-address
     */
    public function upsert(Request $request, $customerId)
    {
        $customer = DB::table('master_customer')
            ->where('id', $customerId)
            ->first();

        if (!$customer) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        $request->validate([
            'lat'     => 'required|numeric|between:-90,90',
            'lng'     => 'required|numeric|between:-180,180',
            'address' => 'nullable|string|max:255',
            'city'    => 'nullable|string|max:100',
            'state'   => 'nullable|string|max:100',
        ]);

        $now      = Carbon::now()->toDateTimeString();
        $existing = DB::table('fix_address')
            ->where('customer_id', $customerId)
            ->first();

        $requestAddress = $this->normalizeOptionalText($request->input('address'), 255);
        $requestCity = $this->normalizeOptionalText($request->input('city'), 100);
        $requestState = $this->normalizeOptionalText($request->input('state'), 100);

        $resolvedGeo = null;
        if (!$requestAddress || !$requestCity || !$requestState) {
            $resolvedGeo = $this->reverseGeocodeLocation((float) $request->lat, (float) $request->lng);
        }

        $finalAddress = $requestAddress ?? ($resolvedGeo['address'] ?? null);
        $finalCity = $requestCity ?? ($resolvedGeo['city'] ?? null);
        $finalState = $requestState ?? ($resolvedGeo['state'] ?? null);

        if ($existing) {
            DB::table('fix_address')
                ->where('customer_id', $customerId)
                ->update([
                    'lat'        => $request->lat,
                    'lng'        => $request->lng,
                    'address'    => $finalAddress,
                    'city'       => $finalCity,
                    'state'      => $finalState,
                    'updated_at' => $now,
                ]);
            $id = $existing->id;
        } else {
            $id = Str::uuid()->toString();
            DB::table('fix_address')->insert([
                'id'          => $id,
                'customer_id' => $customerId,
                'lat'         => $request->lat,
                'lng'         => $request->lng,
                'address'     => $finalAddress,
                'city'        => $finalCity,
                'state'       => $finalState,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);
        }

        return response()->json([
            'message' => 'Fix address saved',
            'data'    => [
                'id'          => $id,
                'customer_id' => $customerId,
                'lat'         => $request->lat,
                'lng'         => $request->lng,
                'address'     => $finalAddress,
                'city'        => $finalCity,
                'state'       => $finalState,
                'updated_at'  => $now,
            ],
        ]);
    }

    /**
     * Reverse geocode coordinate to address/city/state for fix_address.
     */
    private function reverseGeocodeLocation(float $lat, float $lng): ?array
    {
        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            return null;
        }

        $latForCache = number_format($lat, 6, '.', '');
        $lngForCache = number_format($lng, 6, '.', '');
        $cacheKey = 'fix_address_reverse_' . md5($latForCache . ',' . $lngForCache);

        $cachedData = Cache::get($cacheKey);
        if (is_array($cachedData)) {
            return [
                'address' => $this->normalizeOptionalText($cachedData['address'] ?? null, 255),
                'city'    => $this->normalizeOptionalText($cachedData['city'] ?? null, 100),
                'state'   => $this->normalizeOptionalText($cachedData['state'] ?? null, 100),
            ];
        }
        if (is_string($cachedData) && trim($cachedData) !== '') {
            return [
                'address' => $this->normalizeOptionalText($cachedData, 255),
                'city'    => null,
                'state'   => null,
            ];
        }

        try {
            $url = "https://nominatim.openstreetmap.org/reverse?" . http_build_query([
                'format'          => 'json',
                'lat'             => $lat,
                'lon'             => $lng,
                'addressdetails'  => 1,
                'accept-language' => 'id,en',
            ]);

            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => 'SalesActivityApp/1.0 (https://yoursite.com/contact)',
                    'Accept'     => 'application/json',
                ])
                ->get($url);

            if (!$response->successful()) {
                Log::warning('[FixAddress] Reverse geocode failed', [
                    'status' => $response->status(),
                    'lat'    => $lat,
                    'lng'    => $lng,
                ]);
                return null;
            }

            $data = $response->json();
            $displayName = $this->normalizeOptionalText($data['display_name'] ?? null, 255);
            $addressParts = is_array($data['address'] ?? null) ? $data['address'] : [];
            $resolvedCity = $this->normalizeOptionalText(
                $this->pickFirstAddressField($addressParts, [
                    'city',
                    'town',
                    'village',
                    'municipality',
                    'county',
                    'city_district',
                    'state_district',
                ]),
                100
            );
            $resolvedState = $this->normalizeOptionalText(
                $this->pickFirstAddressField($addressParts, ['state', 'region', 'province']),
                100
            );

            if (!$displayName && !$resolvedCity && !$resolvedState) {
                return null;
            }

            $normalizedData = [
                'address' => $displayName,
                'city'    => $resolvedCity,
                'state'   => $resolvedState,
            ];
            Cache::put($cacheKey, $normalizedData, 86400); // 24h

            return $normalizedData;
        } catch (\Throwable $e) {
            Log::warning('[FixAddress] Reverse geocode exception', [
                'lat'     => $lat,
                'lng'     => $lng,
                'message' => $e->getMessage(),
            ]);
            return null;
        }
    }

    private function normalizeOptionalText($value, int $maxLength): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim((string) $value);
        if ($normalized === '') {
            return null;
        }

        return Str::limit($normalized, $maxLength, '');
    }

    private function pickFirstAddressField(array $addressParts, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $addressParts[$key] ?? null;
            if (is_string($value) && trim($value) !== '') {
                return $value;
            }
        }

        return null;
    }

    /**
     * Get current fix address for a customer.
     * URL: GET /api/customers/{customerId}/fix-address
     */
    public function show($customerId)
    {
        $fix = DB::table('fix_address')
            ->where('customer_id', $customerId)
            ->first();

        if (!$fix) {
            return response()->json(['message' => 'No fix address found'], 404);
        }

        return response()->json($fix);
    }
}
