<?php
// app/Http/Controllers/CheckInController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\ActivityPlanService;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class CheckInController extends Controller
{
    protected $activityPlanService;

    public function __construct(ActivityPlanService $activityPlanService)
    {
        $this->activityPlanService = $activityPlanService;
    }

    public function checkIn(Request $request)
    {
        \Log::info('CheckIn request received', [
            'sales_internal_id' => $request->sales_internal_id,
            'sales_name' => $request->sales_name,
            'all_data' => $request->all()
        ]);

        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'address' => 'nullable|string',
            'result' => 'nullable|string',
            'timestamp' => 'required|date',
            'capturedImage' => 'nullable|string', // base64 image
        ]);

        try {
            $result = $this->activityPlanService->createCheckIn([
                'sales_internal_id' => $request->sales_internal_id,
                'sales_name' => $request->sales_name,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'address' => $request->address,
                'result' => $request->result,
                'timestamp' => $request->timestamp,
                'capturedImage' => $request->capturedImage,
            ]);

            \Log::info('CheckIn successful', ['result' => $result]);

            return response()->json([
                'message' => 'Check-in berhasil disimpan',
                'timestamp' => $request->timestamp,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            \Log::error('CheckIn failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Gagal menyimpan check-in',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}