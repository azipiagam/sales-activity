<?php
// app/Services/ActivityPlanService.php

namespace App\Services;

use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ActivityPlanService
{
    /**
     * Generate unique plan number
     */
    public function generatePlanNo()
    {
        $lastPlan = DB::table('activity_plans')
            ->where('plan_no', 'LIKE', 'AP-%')
            ->orderByRaw('CAST(SUBSTRING(plan_no, 4) AS UNSIGNED) DESC')
            ->value('plan_no');

        if ($lastPlan) {
            $lastNo = (int) substr($lastPlan, 3);
            $newNo  = $lastNo + 1;
        } else {
            $newNo = 1;
        }

        return 'AP-' . str_pad($newNo, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Calculate distance between two coordinates using Haversine formula.
     * Returns distance in meters.
     */
    private function calculateDistance($custLat, $custLng, $resultLat, $resultLng)
    {
        if (!$custLat || !$custLng || !$resultLat || !$resultLng) {
            return null;
        }

        $earthRadius = 6371000; // meters

        $latFrom = deg2rad($custLat);
        $lonFrom = deg2rad($custLng);
        $latTo   = deg2rad($resultLat);
        $lonTo   = deg2rad($resultLng);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
            cos($latFrom) * cos($latTo) *
            sin($lonDelta / 2) * sin($lonDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 2);
    }

    /**
     * Create new activity plan.
     * Stores customer_address_id to track which address source was used.
     */
    public function create($data)
    {
        $planNo = $this->generatePlanNo();
        $id     = Str::uuid()->toString();
        $now    = Carbon::now()->toDateTimeString();

        DB::table('activity_plans')->insert([
            'id'                    => $id,
            'plan_no'               => $planNo,
            'sales_internal_id'     => $data['sales_internal_id'],
            'sales_name'            => $data['sales_name'],
            'customer_id'           => $data['customer_id'],
            'customer_name'         => $data['customer_name'],
            'plan_date'             => $data['plan_date'],
            'tujuan'                => $data['tujuan'],
            'keterangan_tambahan'   => $data['keterangan_tambahan'] ?? '',
            'customer_location_lat' => $data['customer_location_lat'] ?? null,
            'customer_location_lng' => $data['customer_location_lng'] ?? null,
            // Tracks address source: 'master', UUID from customer_addresses, or null (legacy)
            'customer_address_id'   => $data['customer_address_id'] ?? null,
            'user_photo'            => $data['user_photo'] ?? null,
            'status'                => 'in progress',
            'created_at'            => $now,
            'updated_at'            => $now,
        ]);

        return [
            'id'      => $id,
            'plan_no' => $planNo,
        ];
    }

    /**
     * Mark activity as done.
     *
     * Returns additional flags for FE:
     * - needs_fix_address_confirmation (bool): true only when address source is master/fix_address
     *   AND result coordinates are >2KM from stored customer coordinates
     * - distance_km (float|null): actual distance in KM
     *
     * When address source is customer_addresses (custom), distance check is skipped entirely.
     */
    public function markAsDone(
        $planId,
        $result,
        $latitude,
        $longitude,
        $accuracy = null,
        $capturedImage = null,
        $salesInternalId = null
    ) {
        $plan = DB::table('activity_plans')
            ->where('id', $planId)
            ->first();

        if (!$plan) {
            throw new \Exception("Activity plan not found");
        }

        $normalizedActivityType = strtolower(trim((string) ($plan->tujuan ?? '')));
        $isFollowUp = in_array($normalizedActivityType, ['follow up', 'follow_up', 'followup', 'prospek'], true);

        $hasLatitude = $latitude !== null && $latitude !== '' && is_numeric($latitude);
        $hasLongitude = $longitude !== null && $longitude !== '' && is_numeric($longitude);

        if (($hasLatitude && !$hasLongitude) || (!$hasLatitude && $hasLongitude)) {
            throw ValidationException::withMessages([
                'latitude' => ['Latitude and longitude must be provided together.'],
                'longitude' => ['Latitude and longitude must be provided together.'],
            ]);
        }

        if (!$isFollowUp && (!$hasLatitude || !$hasLongitude)) {
            throw ValidationException::withMessages([
                'latitude' => ['Latitude and longitude are required for Visit activity.'],
                'longitude' => ['Latitude and longitude are required for Visit activity.'],
            ]);
        }

        $normalizedLatitude = $hasLatitude ? (float) $latitude : null;
        $normalizedLongitude = $hasLongitude ? (float) $longitude : null;

        // ── Distance calculation ──────────────────────────────────────────────
        $distanceMeter = $this->calculateDistance(
            $plan->customer_location_lat ?? null,
            $plan->customer_location_lng ?? null,
            $normalizedLatitude,
            $normalizedLongitude
        );

        // ── Fix-address confirmation flag ─────────────────────────────────────
        // Only applicable when address source is master or fix_address (not custom).
        // customer_address_id === null    → legacy plan, treat same as master
        // customer_address_id === 'master'→ using master_customer / fix_address default
        // customer_address_id === <UUID>  → custom address, skip validation
        $needsFixAddressConfirmation = false;
        $distanceKm                  = $distanceMeter !== null ? round($distanceMeter / 1000, 3) : null;
        $addressSource               = $plan->customer_address_id ?? null;
        $isCustomAddress             = $addressSource !== null && $addressSource !== 'master';

        if (!$isCustomAddress && $distanceMeter !== null && $distanceMeter > 2000) {
            $needsFixAddressConfirmation = true;
        }

        // ── Photo upload ──────────────────────────────────────────────────────
        $photoPath = null;
        if ($capturedImage && !empty($capturedImage)) {
            try {
                $base64Image = $capturedImage;

                if (strpos($base64Image, 'data:image') === 0) {
                    $base64Image = preg_replace('#^data:image/\w+;base64,#i', '', $base64Image);
                }

                $imageData = base64_decode($base64Image);

                if ($imageData) {
                    $salesId  = $salesInternalId ?? $plan->sales_internal_id;
                    $filename = 'user-' . $salesId . '-' . time() . '.jpg';
                    $path     = 'user-photos/' . $filename;

                    Storage::disk('public')->put($path, $imageData);
                    $photoPath = '/storage/' . $path;

                    Log::info('Activity photo saved', [
                        'path'    => $path,
                        'size'    => strlen($imageData),
                        'plan_id' => $planId,
                    ]);
                }
            } catch (\Exception $photoError) {
                Log::warning('Activity photo save failed', [
                    'message' => $photoError->getMessage(),
                    'plan_id' => $planId,
                ]);
            }
        }

        // ── Update plan ───────────────────────────────────────────────────────
        $now = Carbon::now()->toDateTimeString();

        DB::table('activity_plans')
            ->where('id', $planId)
            ->update([
                'status'                    => 'done',
                'result'                    => $result,
                'result_location_lat'       => $normalizedLatitude,
                'result_location_lng'       => $normalizedLongitude,
                'result_location_accuracy'  => $distanceMeter,
                'result_location_timestamp' => $now,
                'result_saved_at'           => $now,
                'user_photo'                => $photoPath ?? $plan->user_photo,
                'updated_at'                => $now,
            ]);

        return [
            'needs_fix_address_confirmation' => $needsFixAddressConfirmation,
            'distance_km'                    => $distanceKm,
        ];
    }

    /**
     * Get activity plans by date and sales
     */
    public function getByDateAndSales($salesInternalId, $date)
    {
        return DB::table('activity_plans')
            ->where('sales_internal_id', $salesInternalId)
            ->where('plan_date', $date)
            ->where('status', '!=', 'deleted')
            ->whereNull('deleted_at')
            ->orderByRaw("
                CASE 
                    WHEN status = 'in progress' THEN 1
                    WHEN status = 'rescheduled' THEN 2
                    WHEN status = 'done' THEN 3
                    WHEN status = 'missed' THEN 4
                    ELSE 5
                END
            ")
            ->orderBy('created_at', 'DESC')
            ->get()
            ->toArray();
    }

    /**
     * Get all activity plans by sales (no date filter)
     */
    public function getAllBySales($salesInternalId)
    {
        if (!$salesInternalId) {
            return [];
        }

        return DB::table('activity_plans')
            ->where('sales_internal_id', $salesInternalId)
            ->where('status', '!=', 'deleted')
            ->whereNull('deleted_at')
            ->orderByRaw("
                CASE 
                    WHEN status IN ('in progress', 'rescheduled') THEN 1
                    WHEN status = 'done' THEN 2
                    WHEN status = 'missed' THEN 3
                    ELSE 4
                END
            ")
            ->orderBy('plan_date', 'DESC')
            ->orderBy('created_at', 'DESC')
            ->get()
            ->toArray();
    }

    /**
     * Get activity plans by date range
     */
    public function getByRangeAndSales($salesInternalId, $fromDate, $toDate)
    {
        if (!$salesInternalId || !$fromDate || !$toDate) {
            return [];
        }

        return DB::table('activity_plans')
            ->where('sales_internal_id', $salesInternalId)
            ->whereBetween('plan_date', [$fromDate, $toDate])
            ->where('status', '!=', 'deleted')
            ->whereNull('deleted_at')
            ->orderByRaw("
                CASE 
                    WHEN status IN ('in progress', 'rescheduled') THEN 1
                    WHEN status = 'done' THEN 2
                    WHEN status = 'missed' THEN 3
                    ELSE 4
                END
            ")
            ->orderBy('plan_date', 'DESC')
            ->orderBy('created_at', 'DESC')
            ->get()
            ->toArray();
    }

    /**
     * Reschedule activity plan
     */
    public function reschedule($planId, $newDate)
    {
        $plan = DB::table('activity_plans')
            ->where('id', $planId)
            ->first();

        if (!$plan) {
            throw new \Exception("Activity plan not found");
        }

        if (!in_array($plan->status, ['in progress', 'rescheduled'])) {
            throw new \Exception("Cannot reschedule activity plan with status: {$plan->status}");
        }

        $now = Carbon::now()->toDateTimeString();

        DB::table('activity_plans')
            ->where('id', $planId)
            ->update([
                'plan_date'  => $newDate,
                'status'     => 'in progress',
                'updated_at' => $now,
            ]);

        return true;
    }

    /**
     * Update activity plan (only for 'in progress' or 'rescheduled' status)
     */
    public function update($planId, $data)
    {
        $plan = DB::table('activity_plans')
            ->where('id', $planId)
            ->first();

        if (!$plan) {
            throw new \Exception("Activity plan not found");
        }

        if (!in_array($plan->status, ['in progress', 'rescheduled'])) {
            throw new \Exception("Cannot edit activity plan with status: {$plan->status}");
        }

        // Resolve lat/lng kalau customer_address_id berubah
        if (isset($data['customer_address_id'])) {
            $data = $this->resolveAddressCoordinatesStatic($data);
        }

        $now = Carbon::now()->toDateTimeString();

        DB::table('activity_plans')
            ->where('id', $planId)
            ->update([
                'customer_id'           => $data['customer_id']          ?? $plan->customer_id,
                'customer_name'         => $data['customer_name']         ?? $plan->customer_name,
                'plan_date'             => $data['plan_date']             ?? $plan->plan_date,
                'tujuan'                => $data['tujuan']                ?? $plan->tujuan,
                'keterangan_tambahan'   => $data['keterangan_tambahan']   ?? $plan->keterangan_tambahan,
                'customer_address_id'   => $data['customer_address_id']   ?? $plan->customer_address_id,
                'customer_location_lat' => $data['customer_location_lat'] ?? $plan->customer_location_lat,
                'customer_location_lng' => $data['customer_location_lng'] ?? $plan->customer_location_lng,
                'updated_at'            => $now,
            ]);

        return DB::table('activity_plans')->where('id', $planId)->first();
    }

    /**
     * Static version of resolveAddressCoordinates untuk dipakai di service
     * (tanpa dependency ke $request)
     */
    private function resolveAddressCoordinatesStatic(array $data): array
    {
        $addressId = $data['customer_address_id'] ?? null;

        if (!$addressId) {
            return $data;
        }

        if ($addressId === 'master') {
            $data['customer_location_lat'] = null;
            $data['customer_location_lng'] = null;
            return $data;
        }

        $address = DB::table('customer_addresses')
            ->where('id', $addressId)
            ->where('customer_id', $data['customer_id'])
            ->select('lat', 'lng')
            ->first();

        if ($address) {
            $data['customer_location_lat'] = $address->lat;
            $data['customer_location_lng'] = $address->lng;
        }

        return $data;
    }

    /**
     * Delete activity plan (soft delete)
     */
    public function delete($planId)
    {
        $plan = DB::table('activity_plans')
            ->where('id', $planId)
            ->first();

        if (!$plan) {
            throw new \Exception("Activity plan not found");
        }

        if ($plan->status === 'done') {
            throw new \Exception("Cannot delete activity plan with status: done");
        }

        $now = Carbon::now()->toDateTimeString();

        DB::table('activity_plans')
            ->where('id', $planId)
            ->update([
                'status'     => 'deleted',
                'deleted_at' => $now,
                'updated_at' => $now,
            ]);

        return true;
    }

    /**
     * Mark missed plans (cron job)
     */
    public function markMissedPlans()
    {
        $yesterday = Carbon::yesterday()->toDateString();
        $now       = Carbon::now()->toDateTimeString();

        DB::table('activity_plans')
            ->where('plan_date', '<', $yesterday)
            ->where('status', 'in progress')
            ->update([
                'status'     => 'missed',
                'updated_at' => $now,
            ]);

        return true;
    }

    /**
     * Create prospect record (no customer)
     */
    public function createCheckIn($data)
    {
        Log::info('Creating prospect record', ['data' => $data]);

        $id        = Str::uuid()->toString();
        $now       = Carbon::now()->toDateTimeString();
        $timestamp = Carbon::parse($data['timestamp'])->toDateTimeString();
        $customerName = trim((string) ($data['customer_name'] ?? '')) ?: 'Prospect';

        DB::table('activity_plans')->insert([
            'id'                        => $id,
            'plan_no'                   => $this->generatePlanNo(),
            'sales_internal_id'         => $data['sales_internal_id'],
            'sales_name'                => $data['sales_name'],
            'customer_id'               => null,
            'customer_name'             => $customerName,
            'plan_date'                 => Carbon::parse($timestamp)->toDateString(),
            'tujuan'                    => 'Prospek',
            'keterangan_tambahan'       => 'CheckIn Di Tempat',
            'customer_location_lat'     => null,
            'customer_location_lng'     => null,
            'customer_address_id'       => null,
            'city'                      => $data['city'] ?? null,
            'state'                     => $data['state'] ?? null,
            'user_photo'                => $data['user_photo'] ?? null,
            'status'                    => 'done',
            'result'                    => $data['result'] ?? null,
            'result_location_lat'       => $data['latitude'],
            'result_location_lng'       => $data['longitude'],
            'result_location_accuracy'  => null,
            'result_location_timestamp' => $timestamp,
            'result_saved_at'           => $now,
            'created_at'                => $now,
            'updated_at'                => $now,
            'deleted_at'                => null,
        ]);

        Log::info('Prospect record inserted to MySQL', ['id' => $id]);

        return ['id' => $id];
    }
}
