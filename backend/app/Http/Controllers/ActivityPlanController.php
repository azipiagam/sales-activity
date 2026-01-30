<?php
// app/Http/Controllers/ActivityPlanController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\ActivityPlanService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

class ActivityPlanController extends Controller
{
    protected $activityPlanService;

    public function __construct(ActivityPlanService $activityPlanService)
    {
        $this->activityPlanService = $activityPlanService;
    }

    public function index(Request $request)
    {
        $date = $request->get('date', Carbon::today()->toDateString());
        $salesInternalId = $request->sales_internal_id;

        $plans = $this->activityPlanService->getByDateAndSales($salesInternalId, $date);

        return response()->json($plans);
    }

    /**
     * Create single or multiple activity plans
     * URL: POST /api/activity-plans
     */
    public function store(Request $request)
    {
        // Ambil semua data dari request
        $data = $request->all();
        
        // Check if request is array (batch) or single object
        $isBatch = is_array($data) && 
                   !empty($data) && 
                   isset($data[0]) && 
                   is_array($data[0]);

        if ($isBatch) {
            return $this->storeBatch($request);
        } else {
            return $this->storeSingle($request);
        }
    }

    /**
     * Store single activity plan
     */
    protected function storeSingle(Request $request)
    {
        \Log::info('StoreSingle request received', [
            'all_data_keys' => array_keys($request->all()),
        ]);

        $request->validate([
            'customer_id' => 'required',
            'customer_name' => 'required',
            'plan_date' => 'required|date|after_or_equal:today',
            'tujuan' => 'required|in:Visit,Follow Up',
            'keterangan_tambahan' => 'nullable|string',
            'customer_location_lat' => 'nullable|numeric',
            'customer_location_lng' => 'nullable|numeric',
        ]);

        $data = $request->only([
            'customer_id',
            'customer_name',
            'plan_date',
            'tujuan',
            'keterangan_tambahan',
            'customer_location_lat',
            'customer_location_lng',
        ]);
        $data['sales_internal_id'] = $request->sales_internal_id;
        $data['sales_name'] = $request->sales_name;
        $data['user_photo'] = null;

        $result = $this->activityPlanService->create($data);

        return response()->json([
            'message' => 'Activity plan created',
            'data' => $result
        ], 201);
    }

    /**
     * Store multiple activity plans (batch)
     */
    protected function storeBatch(Request $request)
    {
        $allData = $request->all();
        
        // Filter hanya data yang indexnya numeric (array plans)
        $plans = array_filter($allData, function($key) {
            return is_numeric($key);
        }, ARRAY_FILTER_USE_KEY);
        
        // Re-index array
        $plans = array_values($plans);

        // Validate each plan
        $errors = [];
        foreach ($plans as $index => $plan) {
            if (!is_array($plan)) {
                $errors["plan_$index"] = ['Invalid data format'];
                continue;
            }
            
            $validator = Validator::make($plan, [
                'customer_id' => 'required',
                'customer_name' => 'required',
                'plan_date' => 'required|date|after_or_equal:today',
                'tujuan' => 'required|in:Visit,Follow Up',
                'keterangan_tambahan' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                $errors["plan_$index"] = $validator->errors();
            }
        }

        if (!empty($errors)) {
            return response()->json([
                'message' => 'Validation failed for some plans',
                'errors' => $errors
            ], 422);
        }

        // Create all plans
        $results = [];
        foreach ($plans as $plan) {
            $plan['sales_internal_id'] = $request->sales_internal_id;
            $plan['sales_name'] = $request->sales_name;
            
            $results[] = $this->activityPlanService->create($plan);
        }

        return response()->json([
            'message' => 'Activity plans created',
            'count' => count($results),
            'data' => $results
        ], 201);
    }

    public function markAsDone(Request $request, $id)
    {
        $request->validate([
            'result' => 'nullable|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'accuracy' => 'nullable|numeric',
            'photo' => 'nullable|string', // base64 image
        ]);

        $this->activityPlanService->markAsDone(
            $id,
            $request->result,
            $request->latitude,
            $request->longitude,
            $request->accuracy,
            $request->photo ?? null,
            $request->sales_internal_id ?? null
        );

        return response()->json(['message' => 'Activity marked as done']);
    }

    public function reschedule(Request $request, $id)
    {
        $request->validate([
            'new_date' => 'required|date|after_or_equal:today',
        ]);

        $this->activityPlanService->reschedule($id, $request->new_date);

        return response()->json(['message' => 'Activity plan rescheduled']);
    }

    public function destroy($id)
    {
        $this->activityPlanService->delete($id);

        return response()->json(['message' => 'Activity plan deleted']);
    }

    /**
     * Get all activity plans (tanpa filter date)
     * URL: GET /api/activity-plans/all
     */
    public function getAllPlans(Request $request)
    {
        $salesInternalId = $request->sales_internal_id;
        
        $plans = $this->activityPlanService->getAllBySales($salesInternalId);
        
        return response()->json($plans);
    }

    /**
     * Get activity plans within a date range (fast range fetch)
     * URL: GET /api/activity-plans/range?from=YYYY-MM-DD&to=YYYY-MM-DD&sales_internal_id=...
     */
    public function getRangePlans(Request $request)
    {
        $salesInternalId = $request->sales_internal_id;
        $from = $request->get('from');
        $to = $request->get('to');

        if (!$salesInternalId) {
            return response()->json([
                'message' => 'sales_internal_id is required'
            ], 400);
        }

        if (!$from || !$to) {
            return response()->json([
                'message' => 'from and to (YYYY-MM-DD) are required'
            ], 400);
        }

        $plans = $this->activityPlanService->getByRangeAndSales($salesInternalId, $from, $to);

        return response()->json($plans);
    }
}