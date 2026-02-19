<?php
// app/Services/ActivityPlanService.php
// UPDATED: MySQL Version (removed BigQuery & Cache)

namespace App\Services;

use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ActivityPlanService
{
    /**
     * Generate unique plan number
     * Changed: SQL query instead of BigQuery
     */
    public function generatePlanNo()
    {
        // Get last plan number (skip dummy data starting with DUMMY_)
        $lastPlan = DB::table('activity_plans')
            ->where('plan_no', 'LIKE', 'AP-%')
            ->orderByRaw('CAST(SUBSTRING(plan_no, 4) AS UNSIGNED) DESC')
            ->value('plan_no');
        
        if ($lastPlan) {
            $lastNo = (int) substr($lastPlan, 3); // Extract number from "AP-000123"
            $newNo = $lastNo + 1;
        } else {
            $newNo = 1;
        }
        
        return 'AP-' . str_pad($newNo, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * No changes - pure PHP logic
     */
    private function calculateDistance($custLat, $custLng, $resultLat, $resultLng)
    {
        if (!$custLat || !$custLng || !$resultLat || !$resultLng) {
            return null;
        }
        
        $earthRadius = 6371000; // meter
        
        $latFrom = deg2rad($custLat);
        $lonFrom = deg2rad($custLng);
        $latTo = deg2rad($resultLat);
        $lonTo = deg2rad($resultLng);
        
        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;
        
        $a = sin($latDelta / 2) * sin($latDelta / 2) +
            cos($latFrom) * cos($latTo) *
            sin($lonDelta / 2) * sin($lonDelta / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        
        $distance = $earthRadius * $c;
        
        return round($distance, 2);
    }

    /**
     * Create new activity plan
     * Changed: MySQL INSERT instead of BigQuery streaming insert
     * Removed: Cache clearing
     */
    public function create($data)
    {
        $planNo = $this->generatePlanNo();
        $id = Str::uuid()->toString();
        $now = Carbon::now()->toDateTimeString();
        
        DB::table('activity_plans')->insert([
            'id' => $id,
            'plan_no' => $planNo,
            'sales_internal_id' => $data['sales_internal_id'],
            'sales_name' => $data['sales_name'],
            'customer_id' => $data['customer_id'],
            'customer_name' => $data['customer_name'],
            'plan_date' => $data['plan_date'],
            'tujuan' => $data['tujuan'],
            'keterangan_tambahan' => $data['keterangan_tambahan'] ?? '',
            'customer_location_lat' => $data['customer_location_lat'] ?? null,
            'customer_location_lng' => $data['customer_location_lng'] ?? null,
            'user_photo' => $data['user_photo'] ?? null,
            'status' => 'in progress',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        
        return [
            'id' => $id,
            'plan_no' => $planNo,
        ];
    }

    /**
     * Get activity plans by date and sales
     * Changed: Simple MySQL query, no ROW_NUMBER needed
     * Removed: Cache
     * Sorting: in progress/rescheduled first, then done/missed
     */
    public function getByDateAndSales($salesInternalId, $date)
    {
        $query = DB::table('activity_plans')
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
            ->orderBy('created_at', 'DESC');
        
        return $query->get()->toArray();
    }

    /**
     * Get all activity plans by sales (no date filter)
     * Changed: MySQL query
     * Removed: Cache, ROW_NUMBER logic
     * Sorting: in progress first, then done, by date DESC
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
     * Changed: MySQL BETWEEN query
     * Removed: Cache
     * Sorting: in progress first, then done
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
     * Mark activity as done
     * Changed: MySQL UPDATE instead of INSERT new version
     * Removed: Workaround methods, cache clearing
     */
    public function markAsDone($planId, $result, $latitude, $longitude, $accuracy = null, $capturedImage = null, $salesInternalId = null)
    {
        // Get existing plan
        $plan = DB::table('activity_plans')
            ->where('id', $planId)
            ->first();
        
        if (!$plan) {
            throw new \Exception("Activity plan not found");
        }
        
        // Calculate distance
        $distanceMeter = $this->calculateDistance(
            $plan->customer_location_lat ?? null,
            $plan->customer_location_lng ?? null,
            $latitude,
            $longitude
        );
        
        // Handle photo upload
        $photoPath = null;
        if ($capturedImage && !empty($capturedImage)) {
            try {
                $base64Image = $capturedImage;
                
                if (strpos($base64Image, 'data:image') === 0) {
                    $base64Image = preg_replace('#^data:image/\w+;base64,#i', '', $base64Image);
                }
                
                $imageData = base64_decode($base64Image);
                
                if ($imageData) {
                    $salesId = $salesInternalId ?? $plan->sales_internal_id;
                    $filename = 'user-' . $salesId . '-' . time() . '.jpg';
                    $path = 'user-photos/' . $filename;
                    
                    Storage::disk('public')->put($path, $imageData);
                    
                    $photoPath = '/storage/' . $path;
                    
                    Log::info('Activity photo saved', [
                        'path' => $path,
                        'size' => strlen($imageData),
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
        
        $now = Carbon::now()->toDateTimeString();
        
        // UPDATE instead of INSERT
        DB::table('activity_plans')
            ->where('id', $planId)
            ->update([
                'status' => 'done',
                'result' => $result,
                'result_location_lat' => $latitude,
                'result_location_lng' => $longitude,
                'result_location_accuracy' => $distanceMeter,
                'result_location_timestamp' => $now,
                'result_saved_at' => $now,
                'user_photo' => $photoPath ?? $plan->user_photo,
                'updated_at' => $now,
            ]);
        
        return true;
    }

    /**
     * Reschedule activity plan
     * Changed: Simple UPDATE instead of INSERT new version
     * Removed: Workaround, cache, cleanup
     */
    public function reschedule($planId, $newDate)
    {
        $plan = DB::table('activity_plans')
            ->where('id', $planId)
            ->first();
        
        if (!$plan) {
            throw new \Exception("Activity plan not found");
        }
        
        // Check if can be rescheduled
        if (!in_array($plan->status, ['in progress', 'rescheduled'])) {
            throw new \Exception("Cannot reschedule activity plan with status: {$plan->status}");
        }
        
        $now = Carbon::now()->toDateTimeString();
        
        // Simple UPDATE
        DB::table('activity_plans')
            ->where('id', $planId)
            ->update([
                'plan_date' => $newDate,
                'status' => 'rescheduled',
                'updated_at' => $now,
            ]);
        
        return true;
    }

    /**
     * Delete activity plan
     * Changed: Soft delete via UPDATE
     * Removed: Workaround, cache
     */
    public function delete($planId)
    {
        $plan = DB::table('activity_plans')
            ->where('id', $planId)
            ->first();
        
        if (!$plan) {
            throw new \Exception("Activity plan not found");
        }
        
        // Cannot delete if done
        if ($plan->status === 'done') {
            throw new \Exception("Cannot delete activity plan with status: done");
        }
        
        $now = Carbon::now()->toDateTimeString();
        
        // Soft delete
        DB::table('activity_plans')
            ->where('id', $planId)
            ->update([
                'status' => 'deleted',
                'deleted_at' => $now,
                'updated_at' => $now,
            ]);
        
        return true;
    }

    /**
     * Mark missed plans (cron job)
     * Changed: MySQL batch UPDATE instead of INSERT
     */
    public function markMissedPlans()
    {
        $yesterday = Carbon::yesterday()->toDateString();
        $now = Carbon::now()->toDateTimeString();
        
        // Update all in-progress plans before yesterday
        DB::table('activity_plans')
            ->where('plan_date', '<', $yesterday)
            ->where('status', 'in progress')
            ->update([
                'status' => 'missed',
                'updated_at' => $now,
            ]);
        
        return true;
    }

    /**
     * Create check-in record (no customer)
     * Changed: Simple INSERT
     * Removed: Cache
     */
    public function createCheckIn($data)
    {
        Log::info('Creating check-in record', ['data' => $data]);

        $id = Str::uuid()->toString();
        $now = Carbon::now()->toDateTimeString();
        $timestamp = Carbon::parse($data['timestamp'])->toDateTimeString();

        DB::table('activity_plans')->insert([
            'id' => $id,
            'plan_no' => $this->generatePlanNo(),
            'sales_internal_id' => $data['sales_internal_id'],
            'sales_name' => $data['sales_name'],
            'customer_id' => null,
            'customer_name' => 'CheckIn',
            'plan_date' => Carbon::parse($timestamp)->toDateString(),
            'tujuan' => 'Visit',
            'keterangan_tambahan' => 'CheckIn Di Tempat',
            'customer_location_lat' => null,
            'customer_location_lng' => null,
            'city' => $data['city'] ?? null,
            'state' => $data['state'] ?? null,
            'user_photo' => $data['user_photo'] ?? null,
            'status' => 'done',
            'result' => $data['result'] ?? null,
            'result_location_lat' => $data['latitude'],
            'result_location_lng' => $data['longitude'],
            'result_location_accuracy' => null,
            'result_location_timestamp' => $timestamp,
            'result_saved_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
            'deleted_at' => null,
        ]);

        Log::info('Check-in record inserted to MySQL', ['id' => $id]);

        return [
            'id' => $id,
        ];
    }
}