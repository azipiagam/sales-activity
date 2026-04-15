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

        $requestAddress = trim((string) $request->input('address', ''));
        $resolvedAddress = $requestAddress !== ''
            ? $requestAddress
            : $this->reverseGeocodeAddress((float) $request->lat, (float) $request->lng);

        if ($existing) {
            DB::table('fix_address')
                ->where('customer_id', $customerId)
                ->update([
                    'lat'        => $request->lat,
                    'lng'        => $request->lng,
                    'address'    => $request->address,
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
                'address'     => $request->address,
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
                'address'     => $request->address,
                'updated_at'  => $now,
            ],
        ]);
    }

    /**
     * Reverse geocode coordinate to address string for fix_address.
     */
    private function reverseGeocodeAddress(float $lat, float $lng): ?string
    {
        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            return null;
        }

        $latForCache = number_format($lat, 6, '.', '');
        $lngForCache = number_format($lng, 6, '.', '');
        $cacheKey = 'fix_address_reverse_' . md5($latForCache . ',' . $lngForCache);

        $cachedAddress = Cache::get($cacheKey);
        if (is_string($cachedAddress) && trim($cachedAddress) !== '') {
            return $cachedAddress;
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
            $displayName = trim((string) ($data['display_name'] ?? ''));

            if ($displayName === '') {
                return null;
            }

            $normalizedAddress = substr($displayName, 0, 255);
            Cache::put($cacheKey, $normalizedAddress, 86400); // 24h

            return $normalizedAddress;
        } catch (\Throwable $e) {
            Log::warning('[FixAddress] Reverse geocode exception', [
                'lat'     => $lat,
                'lng'     => $lng,
                'message' => $e->getMessage(),
            ]);
            return null;
        }
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
