<?php
// app/Http/Controllers/CustomerAddressController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CustomerAddressController extends Controller
{
    /**
     * Get all addresses for a customer.
     *
     * Priority for default address:
     *   1. fix_address (if exists for this customer)  → is_default: true, source: 'fix'
     *   2. master_customer address                    → is_default: true, source: 'master'
     *
     * Additional addresses from customer_addresses are appended after the default.
     *
     * URL: GET /api/customers/{customerId}/addresses
     */
    public function index($customerId)
    {
        // Verify customer exists
        $master = DB::table('master_customer')
            ->where('id', $customerId)
            ->select('id', 'customer_name', 'address')
            ->first();

        if (!$master) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        // Check if a fix_address exists for this customer
        $fix = DB::table('fix_address')
            ->where('customer_id', $customerId)
            ->first();

        // Build default address entry
        // If fix_address exists → use it as default (source: 'fix')
        // Otherwise → fall back to master_customer (source: 'master')
        if ($fix) {
            $defaultAddress = [
                'id'          => 'master',          // sentinel ID stays 'master' so FE logic is consistent
                'customer_id' => $customerId,
                'address'     => $fix->address ?: $master->address,
                'lat'         => $fix->lat,
                'lng'         => $fix->lng,
                'is_default'  => true,
                'source'      => 'fix',             // FE can show "(Corrected)" label if needed
                'created_at'  => $fix->created_at,
                'updated_at'  => $fix->updated_at,
            ];
        } else {
            $defaultAddress = [
                'id'          => 'master',
                'customer_id' => $customerId,
                'address'     => $master->address,
                'lat'         => null,
                'lng'         => null,
                'is_default'  => true,
                'source'      => 'master',
                'created_at'  => null,
                'updated_at'  => null,
            ];
        }

        // Get additional addresses from customer_addresses
        $additionalAddresses = DB::table('customer_addresses')
            ->where('customer_id', $customerId)
            ->orderBy('created_at', 'ASC')
            ->get()
            ->map(function ($row) {
                return [
                    'id'          => $row->id,
                    'customer_id' => $row->customer_id,
                    'address'     => $row->address,
                    'lat'         => $row->lat,
                    'lng'         => $row->lng,
                    'is_default'  => false,
                    'source'      => 'custom',
                    'created_at'  => $row->created_at,
                    'updated_at'  => $row->updated_at,
                ];
            })
            ->toArray();

        return response()->json(array_merge([$defaultAddress], $additionalAddresses));
    }

    /**
     * Add new address for a customer.
     * URL: POST /api/customers/{customerId}/addresses
     */
    public function store(Request $request, $customerId)
    {
        $customer = DB::table('master_customer')
            ->where('id', $customerId)
            ->first();

        if (!$customer) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        $request->validate([
            'address' => 'required|string|max:255',
            'lat'     => 'nullable|numeric|between:-90,90',
            'lng'     => 'nullable|numeric|between:-180,180',
        ]);

        $id  = Str::uuid()->toString();
        $now = Carbon::now()->toDateTimeString();

        DB::table('customer_addresses')->insert([
            'id'          => $id,
            'customer_id' => $customerId,
            'address'     => $request->address,
            'lat'         => $request->lat,
            'lng'         => $request->lng,
            'created_at'  => $now,
            'updated_at'  => $now,
        ]);

        return response()->json([
            'message' => 'Address added',
            'data'    => [
                'id'          => $id,
                'customer_id' => $customerId,
                'address'     => $request->address,
                'lat'         => $request->lat,
                'lng'         => $request->lng,
                'is_default'  => false,
                'source'      => 'custom',
                'created_at'  => $now,
                'updated_at'  => $now,
            ],
        ], 201);
    }

    /**
     * Update a custom address.
     * URL: PUT /api/customers/{customerId}/addresses/{addressId}
     */
    public function update(Request $request, $customerId, $addressId)
    {
        if ($addressId === 'master') {
            return response()->json([
                'message' => 'Default address can only be updated via master customer data',
            ], 422);
        }

        $address = DB::table('customer_addresses')
            ->where('id', $addressId)
            ->where('customer_id', $customerId)
            ->first();

        if (!$address) {
            return response()->json(['message' => 'Address not found'], 404);
        }

        $request->validate([
            'address' => 'required|string|max:255',
            'lat'     => 'nullable|numeric|between:-90,90',
            'lng'     => 'nullable|numeric|between:-180,180',
        ]);

        $now = Carbon::now()->toDateTimeString();

        DB::table('customer_addresses')
            ->where('id', $addressId)
            ->update([
                'address'    => $request->address,
                'lat'        => $request->lat,
                'lng'        => $request->lng,
                'updated_at' => $now,
            ]);

        return response()->json([
            'message' => 'Address updated',
            'data'    => [
                'id'          => $addressId,
                'customer_id' => $customerId,
                'address'     => $request->address,
                'lat'         => $request->lat,
                'lng'         => $request->lng,
                'is_default'  => false,
                'source'      => 'custom',
                'updated_at'  => $now,
            ],
        ]);
    }

    /**
     * Delete a custom address.
     * URL: DELETE /api/customers/{customerId}/addresses/{addressId}
     */
    public function destroy($customerId, $addressId)
    {
        if ($addressId === 'master') {
            return response()->json([
                'message' => 'Default address cannot be deleted',
            ], 422);
        }

        $address = DB::table('customer_addresses')
            ->where('id', $addressId)
            ->where('customer_id', $customerId)
            ->first();

        if (!$address) {
            return response()->json(['message' => 'Address not found'], 404);
        }

        DB::table('customer_addresses')
            ->where('id', $addressId)
            ->delete();

        return response()->json(['message' => 'Address deleted']);
    }
}
