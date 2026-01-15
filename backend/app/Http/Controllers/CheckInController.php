<?php
// app/Http/Controllers/CheckInController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use App\Services\ActivityPlanService;

class CheckInController extends Controller
{
    protected $activityPlanService;

    public function __construct(ActivityPlanService $activityPlanService)
    {
        $this->activityPlanService = $activityPlanService;
    }
    /**
     * Handle check-in request
     * URL: POST /api/check-in
     */
    public function store(Request $request)
    {
        try {
            // Validate request data
            $validator = Validator::make($request->all(), [
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'address' => 'nullable|string|max:500',
                'result' => 'nullable|string|max:1000',
                'timestamp' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get authenticated user
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Prepare check-in data untuk activity_plans
            $checkInData = [
                'sales_internal_id' => $user->sales_internal_id,
                'sales_name' => $user->name ?? 'Unknown Sales',
                'customer_id' => 'CHECKIN_' . uniqid(), // Generate unique customer ID for check-in
                'customer_name' => 'Check-in Location',
                'plan_date' => Carbon::today()->toDateString(), // Hari ini
                'tujuan' => 'Check In',
                'keterangan_tambahan' => 'Automatic check-in from mobile app',
                'customer_location_lat' => $request->latitude,
                'customer_location_lng' => $request->longitude,
                'status' => 'done', // Langsung done
                'result' => $request->result ?: ('Check-in berhasil: ' . ($request->address ?? 'Location recorded')),
            ];

            // Create activity plan entry untuk check-in
            $result = $this->activityPlanService->create($checkInData);

            // Get the created plan data untuk response
            $createdPlan = [
                'id' => $result['id'],
                'plan_no' => $result['plan_no'],
                'sales_internal_id' => $user->sales_internal_id,
                'customer_location_lat' => $request->latitude,
                'customer_location_lng' => $request->longitude,
                'address' => $request->address,
                'result' => $checkInData['result'],
                'status' => 'done',
                'plan_date' => $checkInData['plan_date'],
                'timestamp' => $request->timestamp ? Carbon::parse($request->timestamp)->toISOString() : Carbon::now()->toISOString(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Check-in berhasil',
                'data' => $createdPlan
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Check-in error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat check-in: ' . $e->getMessage()
            ], 500);
        }
    }
}
