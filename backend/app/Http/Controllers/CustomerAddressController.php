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
     * URL: GET /api/customers/{customerId}/addresses
     */
    public function index($customerId)
    {
        $master = DB::table('master_customer')
            ->where('id', $customerId)
            ->select('id', 'customer_name', 'address', 'city', 'state')
            ->first();

        if (!$master) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        $fix = DB::table('fix_address')
            ->where('customer_id', $customerId)
            ->first();

        if ($fix) {
            $defaultAddress = [
                'id'          => 'master',
                'customer_id' => $customerId,
                'address'     => $fix->address ?: $master->address,
                'lat'         => $fix->lat,
                'lng'         => $fix->lng,
                'city'        => $fix->city,
                'state'       => $fix->state,
                'is_default'  => true,
                'source'      => 'fix',
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
                'city'        => $master->city,
                'state'       => $master->state,
                'is_default'  => true,
                'source'      => 'master',
                'created_at'  => null,
                'updated_at'  => null,
            ];
        }

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
                    'city'        => $row->city,
                    'state'       => $row->state,
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
            'city'    => 'nullable|string|max:100',
            'state'   => 'nullable|string|max:100',
        ]);

        $id  = Str::uuid()->toString();
        $now = Carbon::now()->toDateTimeString();

        DB::table('customer_addresses')->insert([
            'id'          => $id,
            'customer_id' => $customerId,
            'address'     => $request->address,
            'lat'         => $request->lat,
            'lng'         => $request->lng,
            'city'        => $request->city,
            'state'       => $request->state,
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
                'city'        => $request->city,
                'state'       => $request->state,
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
            'city'    => 'nullable|string|max:100',
            'state'   => 'nullable|string|max:100',
        ]);

        $now = Carbon::now()->toDateTimeString();

        DB::table('customer_addresses')
            ->where('id', $addressId)
            ->update([
                'address'    => $request->address,
                'lat'        => $request->lat,
                'lng'        => $request->lng,
                'city'       => $request->city,
                'state'      => $request->state,
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
                'city'        => $request->city,
                'state'       => $request->state,
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
            return response()->json(['message' => 'Default address cannot be deleted'], 422);
        }

        $address = DB::table('customer_addresses')
            ->where('id', $addressId)
            ->where('customer_id', $customerId)
            ->first();

        if (!$address) {
            return response()->json(['message' => 'Address not found'], 404);
        }

        DB::table('customer_addresses')->where('id', $addressId)->delete();

        return response()->json(['message' => 'Address deleted']);
    }
}
