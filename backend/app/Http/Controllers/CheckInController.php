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
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'result' => 'nullable|string',
            'timestamp' => 'required|date',
            'capturedImage' => 'nullable|string', // base64 image
        ]);

        try {
            // Handle photo upload dari base64
            $userPhoto = null;
            if ($request->has('capturedImage') && !empty($request->capturedImage)) {
                try {
                    $base64Image = $request->capturedImage;
                    
                    // Remove data:image/jpeg;base64, prefix jika ada
                    if (strpos($base64Image, 'data:image') === 0) {
                        $base64Image = preg_replace('#^data:image/\w+;base64,#i', '', $base64Image);
                    }
                    
                    $imageData = base64_decode($base64Image);
                    
                    if ($imageData) {
                        $filename = 'user-' . $request->sales_internal_id . '-' . time() . '.jpg';
                        $path = 'user-photos/' . $filename;
                        
                        // Save image to storage
                        \Illuminate\Support\Facades\Storage::disk('public')->put($path, $imageData);
                        
                        $userPhoto = '/storage/' . $path;
                        
                        \Log::info('CheckIn photo saved', [
                            'path' => $path,
                            'size' => strlen($imageData),
                        ]);
                    }
                } catch (\Exception $photoError) {
                    \Log::warning('CheckIn photo save failed', [
                        'message' => $photoError->getMessage(),
                    ]);
                    // Continue without photo if save fails
                }
            }

            $result = $this->activityPlanService->createCheckIn([
                'sales_internal_id' => $request->sales_internal_id,
                'sales_name' => $request->sales_name,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'address' => $request->address,
                'city' => $request->city,
                'state' => $request->state,
                'result' => $request->result,
                'timestamp' => $request->timestamp,
                'user_photo' => $userPhoto,
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