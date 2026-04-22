<?php
// app/Http/Controllers/ActivityPlanController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\ActivityPlanService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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
        $date            = $request->get('date', Carbon::today()->toDateString());
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
        $data = $request->all();

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
     * Supports customer_address_id to resolve lat/lng from customer_addresses table.
     * If customer_address_id === 'master', lat/lng is taken from master_customer.
     * If customer_address_id is a UUID, lat/lng is taken from customer_addresses.
     * If neither is supplied, lat/lng can still be passed directly (legacy support).
     */
    protected function storeSingle(Request $request)
    {
        \Log::info('StoreSingle request received', [
            'all_data_keys' => array_keys($request->all()),
        ]);

        $request->validate([
            'customer_id'          => 'required',
            'customer_name'        => 'required',
            'plan_date'            => 'required|date|after_or_equal:today',
            'tujuan'               => 'required|in:Visit,Follow Up',
            'keterangan_tambahan'  => 'nullable|string',
            // Address resolution: prefer address_id, fall back to direct lat/lng
            'customer_address_id'  => 'nullable|string',
            'customer_location_lat'=> 'nullable|numeric',
            'customer_location_lng'=> 'nullable|numeric',
        ]);

        $data = $request->only([
            'customer_id',
            'customer_name',
            'plan_date',
            'tujuan',
            'keterangan_tambahan',
            'customer_address_id',
            'customer_location_lat',
            'customer_location_lng',
        ]);

        $data['sales_internal_id'] = $request->sales_internal_id;
        $data['sales_name']        = $request->sales_name;
        $data['user_photo']        = null;

        // Resolve lat/lng from address if customer_address_id is provided
        $data = $this->resolveAddressCoordinates($data);

        $result = $this->activityPlanService->create($data);

        return response()->json([
            'message' => 'Activity plan created',
            'data'    => $result,
        ], 201);
    }

    /**
     * Store multiple activity plans (batch)
     */
    protected function storeBatch(Request $request)
    {
        $allData = $request->all();

        $plans = array_values(
            array_filter($allData, fn($key) => is_numeric($key), ARRAY_FILTER_USE_KEY)
        );

        $errors = [];
        foreach ($plans as $index => $plan) {
            if (!is_array($plan)) {
                $errors["plan_$index"] = ['Invalid data format'];
                continue;
            }

            $validator = Validator::make($plan, [
                'customer_id'         => 'required',
                'customer_name'       => 'required',
                'plan_date'           => 'required|date|after_or_equal:today',
                'tujuan'              => 'required|in:Visit,Follow Up',
                'keterangan_tambahan' => 'nullable|string',
                'customer_address_id' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                $errors["plan_$index"] = $validator->errors();
            }
        }

        if (!empty($errors)) {
            return response()->json([
                'message' => 'Validation failed for some plans',
                'errors'  => $errors,
            ], 422);
        }

        $results = [];
        foreach ($plans as $plan) {
            $plan['sales_internal_id'] = $request->sales_internal_id;
            $plan['sales_name']        = $request->sales_name;

            // Resolve lat/lng from address if customer_address_id is provided
            $plan = $this->resolveAddressCoordinates($plan);

            $results[] = $this->activityPlanService->create($plan);
        }

        return response()->json([
            'message' => 'Activity plans created',
            'count'   => count($results),
            'data'    => $results,
        ], 201);
    }

    /**
     * Resolve customer_location_lat/lng from customer_address_id.
     *
     * Rules:
     *  - 'master'  -> use fix_address, then master_customer (if available), then request lat/lng
     *  - UUID      -> use lat/lng from customer_addresses row
     *  - null/skip -> keep whatever lat/lng was passed directly
     */
    private function resolveAddressCoordinates(array $data): array
    {
        $addressId = $data['customer_address_id'] ?? null;

        if (!$addressId) {
            return $data; // no address_id supplied, use direct lat/lng as-is
        }

        if ($addressId === 'master') {
            // 1) Prefer fix_address coordinates when available.
            $fixAddress = DB::table('fix_address')
                ->where('customer_id', $data['customer_id'] ?? null)
                ->select('lat', 'lng')
                ->first();

            $resolvedLat = $fixAddress->lat ?? null;
            $resolvedLng = $fixAddress->lng ?? null;

            // 2) Fallback to master_customer coordinates if the schema provides them.
            if ($resolvedLat === null || $resolvedLng === null) {
                $masterCoordinates = $this->getMasterCustomerCoordinates($data['customer_id'] ?? null);
                $resolvedLat = $resolvedLat ?? ($masterCoordinates['lat'] ?? null);
                $resolvedLng = $resolvedLng ?? ($masterCoordinates['lng'] ?? null);
            }

            // 3) Final fallback: keep FE geocoded coordinates sent from AddPlan/AddAddress.
            $data['customer_location_lat'] = $resolvedLat ?? ($data['customer_location_lat'] ?? null);
            $data['customer_location_lng'] = $resolvedLng ?? ($data['customer_location_lng'] ?? null);
            return $data;
        }

        // Resolve from customer_addresses table
        $address = DB::table('customer_addresses')
            ->where('id', $addressId)
            ->where('customer_id', $data['customer_id'])
            ->select('lat', 'lng', 'address')
            ->first();

        if ($address) {
            $data['customer_location_lat'] = $address->lat;
            $data['customer_location_lng'] = $address->lng;
        }
        // If address row not found, fall back to whatever lat/lng was passed

        return $data;
    }

    /**
     * Read coordinates from master_customer if coordinate columns are present.
     * Supports several possible column naming conventions.
     */
    private function getMasterCustomerCoordinates($customerId): array
    {
        if (!$customerId) {
            return ['lat' => null, 'lng' => null];
        }

        $latColumnCandidates = ['lat', 'latitude', 'customer_location_lat', 'location_lat'];
        $lngColumnCandidates = ['lng', 'longitude', 'customer_location_lng', 'location_lng'];

        $latColumn = collect($latColumnCandidates)->first(
            fn($column) => Schema::hasColumn('master_customer', $column)
        );
        $lngColumn = collect($lngColumnCandidates)->first(
            fn($column) => Schema::hasColumn('master_customer', $column)
        );

        if (!$latColumn && !$lngColumn) {
            return ['lat' => null, 'lng' => null];
        }

        $selectColumns = array_values(array_filter([$latColumn, $lngColumn]));

        $masterRow = DB::table('master_customer')
            ->where('id', $customerId)
            ->select($selectColumns)
            ->first();

        if (!$masterRow) {
            return ['lat' => null, 'lng' => null];
        }

        return [
            'lat' => $latColumn ? ($masterRow->{$latColumn} ?? null) : null,
            'lng' => $lngColumn ? ($masterRow->{$lngColumn} ?? null) : null,
        ];
    }

    public function markAsDone(Request $request, $id)
    {
        $request->validate([
            'result'    => 'nullable|string',
            'latitude'  => 'nullable|numeric|required_with:longitude',
            'longitude' => 'nullable|numeric|required_with:latitude',
            'accuracy'  => 'nullable|numeric',
            'photo'     => 'nullable|string', // base64
        ]);

        $doneResult = $this->activityPlanService->markAsDone(
            $id,
            $request->result,
            $request->latitude,
            $request->longitude,
            $request->accuracy,
            $request->photo ?? null,
            $request->sales_internal_id ?? null
        );

        return response()->json(array_merge([
            'message' => 'Activity marked as done',
        ], $doneResult));
    }

    public function reschedule(Request $request, $id)
    {
        $request->validate([
            'new_date' => 'required|date|after_or_equal:today',
        ]);

        $this->activityPlanService->reschedule($id, $request->new_date);

        return response()->json(['message' => 'Activity plan rescheduled']);
    }

    /**
     * Update activity plan (only 'in progress' or 'rescheduled')
     * URL: PUT /api/activity-plans/{id}
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'customer_id'           => 'sometimes|required',
            'customer_name'         => 'sometimes|required',
            'plan_date'             => 'sometimes|required|date|after_or_equal:today',
            'tujuan'                => 'sometimes|required|in:Visit,Follow Up',
            'keterangan_tambahan'   => 'nullable|string',
            'customer_address_id'   => 'nullable|string',
            'customer_location_lat' => 'nullable|numeric',
            'customer_location_lng' => 'nullable|numeric',
        ]);

        try {
            $data = $request->only([
                'customer_id',
                'customer_name',
                'plan_date',
                'tujuan',
                'keterangan_tambahan',
                'customer_address_id',
                'customer_location_lat',
                'customer_location_lng',
            ]);

            $result = $this->activityPlanService->update($id, $data);

            return response()->json([
                'message' => 'Activity plan updated',
                'data'    => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function destroy($id)
    {
        $this->activityPlanService->delete($id);

        return response()->json(['message' => 'Activity plan deleted']);
    }

    /**
     * Get all activity plans (without date filter)
     * URL: GET /api/activity-plans/all
     */
    public function getAllPlans(Request $request)
    {
        $plans = $this->activityPlanService->getAllBySales($request->sales_internal_id);

        return response()->json($plans);
    }

    /**
     * Get activity plans within a date range
     * URL: GET /api/activity-plans/range?from=YYYY-MM-DD&to=YYYY-MM-DD
     */
    public function getRangePlans(Request $request)
    {
        $salesInternalId = $request->sales_internal_id;
        $from            = $request->get('from');
        $to              = $request->get('to');

        if (!$from || !$to) {
            return response()->json([
                'message' => 'from and to (YYYY-MM-DD) are required',
            ], 400);
        }

        $plans = $this->activityPlanService->getByRangeAndSales($salesInternalId, $from, $to);

        return response()->json($plans);
    }
}
