<?php
// app/Http/Controllers/FixAddressController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
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

        if ($existing) {
            DB::table('fix_address')
                ->where('customer_id', $customerId)
                ->update([
                    'lat'        => $request->lat,
                    'lng'        => $request->lng,
                    'address'    => $request->address,
                    'city'       => $request->city,
                    'state'      => $request->state,
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
                'city'        => $request->city,
                'state'       => $request->state,
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
                'city'        => $request->city,
                'state'       => $request->state,
                'updated_at'  => $now,
            ],
        ]);
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