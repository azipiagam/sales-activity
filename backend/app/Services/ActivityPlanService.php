<?php
// app/Services/ActivityPlanService.php

namespace App\Services;

use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class ActivityPlanService
{
    protected $bigQuery;
    protected $cacheTime = 60; // Cache for 60 seconds

    public function __construct(BigQueryService $bigQuery)
    {
        $this->bigQuery = $bigQuery;
    }

    public function generatePlanNo()
    {
        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
        
        $sql = "
            SELECT COALESCE(MAX(CAST(SUBSTR(plan_no, 4) AS INT64)), 0) as last_no
            FROM `{$project}.{$dataset}.activity_plans`
        ";
        
        $result = $this->bigQuery->query($sql);
        $lastNo = $result[0]['last_no'] ?? 0;
        $newNo = $lastNo + 1;
        
        return 'AP-' . str_pad($newNo, 6, '0', STR_PAD_LEFT);
    }

    public function create($data)
    {
        $planNo = $this->generatePlanNo();
        $id = Str::uuid()->toString();
        $now = Carbon::now()->toDateTimeString();
        
        $row = [
            'insertId' => $id,
            'data' => [
                'id' => $id,
                'plan_no' => $planNo,
                'sales_internal_id' => $data['sales_internal_id'],
                'sales_name' => $data['sales_name'],
                'customer_id' => $data['customer_id'],
                'customer_name' => $data['customer_name'],
                'plan_date' => $data['plan_date'],
                'tujuan' => $data['tujuan'],
                'keterangan_tambahan' => $data['keterangan_tambahan'] ?? '',
                'status' => 'in progress',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ];
        
        $this->bigQuery->insert('activity_plans', [$row]);
        
        // Clear related caches
        $this->clearCache($data['sales_internal_id']);
        
        return [
            'id' => $id,
            'plan_no' => $planNo,
        ];
    }

    public function getByDateAndSales($salesInternalId, $date)
    {
        $cacheKey = "activity_plans:{$salesInternalId}:{$date}";
        
        return Cache::remember($cacheKey, $this->cacheTime, function () use ($salesInternalId, $date) {
            $dataset = env('BIGQUERY_DATASET');
            $project = env('BIGQUERY_PROJECT_ID');
            
            // Optimized query: filter by date first to reduce data scanned
            $sql = "
                WITH filtered_plans AS (
                    SELECT *
                    FROM `{$project}.{$dataset}.activity_plans`
                    WHERE sales_internal_id = @sales_internal_id
                    AND plan_date = @plan_date
                ),
                latest_versions AS (
                    SELECT *,
                        ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC) as rn
                    FROM filtered_plans
                )
                SELECT * EXCEPT(rn)
                FROM latest_versions
                WHERE rn = 1
                ORDER BY created_at DESC
            ";
            
            return $this->bigQuery->query($sql, [
                'sales_internal_id' => $salesInternalId,
                'plan_date' => $date,
            ]);
        });
    }

    /**
     * Get all activity plans by sales (no date filter)
     */
    public function getAllBySales($salesInternalId)
    {
        $cacheKey = "activity_plans:all:{$salesInternalId}";
        
        return Cache::remember($cacheKey, $this->cacheTime, function () use ($salesInternalId) {
            $dataset = env('BIGQUERY_DATASET');
            $project = env('BIGQUERY_PROJECT_ID');
            
            $sql = "
                WITH latest_plans AS (
                    SELECT *,
                        ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC) as rn
                    FROM `{$project}.{$dataset}.activity_plans`
                    WHERE sales_internal_id = @sales_internal_id
                    AND status NOT IN ('deleted')
                )
                SELECT * EXCEPT(rn)
                FROM latest_plans
                WHERE rn = 1
                ORDER BY plan_date DESC, created_at DESC
            ";
            
            return $this->bigQuery->query($sql, [
                'sales_internal_id' => $salesInternalId,
            ]);
        });
    }

    public function markAsDone($planId, $result, $latitude, $longitude, $accuracy = null)
    {
        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
        
        // Get latest version first
        $sqlCheck = "
            SELECT *
            FROM `{$project}.{$dataset}.activity_plans`
            WHERE id = @plan_id
            ORDER BY updated_at DESC
            LIMIT 1
        ";
        
        $existing = $this->bigQuery->query($sqlCheck, ['plan_id' => $planId]);
        
        if (empty($existing)) {
            throw new \Exception("Activity plan not found");
        }
        
        $plan = $existing[0];
        
        // Always use INSERT strategy
        return $this->markAsDoneWorkaround($planId, $result, $latitude, $longitude, $accuracy, $plan);
    }

    /**
     * Insert new version with 'done' status
     */
    protected function markAsDoneWorkaround($planId, $result, $latitude, $longitude, $accuracy = null, $plan = null)
    {
        $now = Carbon::now()->toDateTimeString();
        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
        
        // If plan data not provided, fetch it
        if (!$plan) {
            $sql = "
                SELECT *
                FROM `{$project}.{$dataset}.activity_plans`
                WHERE id = @plan_id
                ORDER BY updated_at DESC
                LIMIT 1
            ";
            
            $existing = $this->bigQuery->query($sql, ['plan_id' => $planId]);
            
            if (empty($existing)) {
                throw new \Exception("Activity plan not found");
            }
            
            $plan = $existing[0];
        }
        
        // Insert updated record
        $row = [
            'insertId' => $planId . '_done_' . time() . '_' . rand(1000, 9999),
            'data' => [
                'id' => $plan['id'],
                'plan_no' => $plan['plan_no'],
                'sales_internal_id' => $plan['sales_internal_id'],
                'sales_name' => $plan['sales_name'],
                'customer_id' => $plan['customer_id'],
                'customer_name' => $plan['customer_name'],
                'plan_date' => $plan['plan_date'],
                'tujuan' => $plan['tujuan'],
                'keterangan_tambahan' => $plan['keterangan_tambahan'],
                'status' => 'done',
                'result' => $result,
                'result_location_lat' => $latitude,
                'result_location_lng' => $longitude,
                'result_location_accuracy' => $accuracy,
                'result_location_timestamp' => $now,
                'result_saved_at' => $now,
                'created_at' => $plan['created_at'],
                'updated_at' => $now,
                'deleted_at' => null,
            ]
        ];
        
        $this->bigQuery->insert('activity_plans', [$row]);
        
        // Clear related caches
        $this->clearCache($plan['sales_internal_id']);
        
        // Try cleanup in background
        $this->cleanupDuplicates($planId);
        
        return true;
    }

    public function reschedule($planId, $newDate)
    {
        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
        
        // Get latest version of the plan
        $sqlCheck = "
            SELECT *
            FROM `{$project}.{$dataset}.activity_plans`
            WHERE id = @plan_id
            ORDER BY updated_at DESC
            LIMIT 1
        ";
        
        $existing = $this->bigQuery->query($sqlCheck, ['plan_id' => $planId]);
        
        if (empty($existing)) {
            throw new \Exception("Activity plan not found");
        }
        
        $plan = $existing[0];
        $currentStatus = $plan['status'];
        
        // Only allow reschedule if status is 'in progress' or 'rescheduled'
        if (!in_array($currentStatus, ['in progress', 'rescheduled'])) {
            throw new \Exception("Cannot reschedule activity plan with status: {$currentStatus}");
        }
        
        // Always use INSERT strategy for reschedule to avoid updating all duplicates
        return $this->rescheduleWorkaround($planId, $newDate, $plan);
    }

    protected function rescheduleWorkaround($planId, $newDate, $plan = null)
    {
        $now = Carbon::now()->toDateTimeString();
        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
        
        // If plan data not provided, fetch it
        if (!$plan) {
            $sql = "
                SELECT * 
                FROM `{$project}.{$dataset}.activity_plans` 
                WHERE id = @plan_id
                ORDER BY updated_at DESC
                LIMIT 1
            ";
            $existing = $this->bigQuery->query($sql, ['plan_id' => $planId]);
            
            if (empty($existing)) {
                throw new \Exception("Activity plan not found");
            }
            
            $plan = $existing[0];
        }
        
        // Check status before rescheduling
        if (!in_array($plan['status'], ['in progress', 'rescheduled'])) {
            throw new \Exception("Cannot reschedule activity plan with status: {$plan['status']}");
        }
        
        // Prepare rows to insert
        $rowsToInsert = [];
        
        // Mark the current record as deleted to prevent duplicate records
        // This prevents duplicate 'in progress' or 'rescheduled' records from remaining in the database
        $deleteRow = [
            'insertId' => $planId . '_deleted_before_reschedule_' . time() . '_' . rand(1000, 9999),
            'data' => [
                'id' => $plan['id'],
                'plan_no' => $plan['plan_no'],
                'sales_internal_id' => $plan['sales_internal_id'],
                'sales_name' => $plan['sales_name'],
                'customer_id' => $plan['customer_id'],
                'customer_name' => $plan['customer_name'],
                'plan_date' => $plan['plan_date'],
                'tujuan' => $plan['tujuan'],
                'keterangan_tambahan' => $plan['keterangan_tambahan'],
                'status' => 'deleted',
                'result' => $plan['result'] ?? null,
                'result_location_lat' => $plan['result_location_lat'] ?? null,
                'result_location_lng' => $plan['result_location_lng'] ?? null,
                'result_location_accuracy' => $plan['result_location_accuracy'] ?? null,
                'result_location_timestamp' => $plan['result_location_timestamp'] ?? null,
                'result_saved_at' => $plan['result_saved_at'] ?? null,
                'created_at' => $plan['created_at'],
                'updated_at' => $now,
                'deleted_at' => $now,
            ]
        ];
        $rowsToInsert[] = $deleteRow;
        
        // Insert new version with updated data (rescheduled)
        $rescheduleRow = [
            'insertId' => $planId . '_rescheduled_' . time() . '_' . rand(1000, 9999),
            'data' => [
                'id' => $plan['id'],
                'plan_no' => $plan['plan_no'],
                'sales_internal_id' => $plan['sales_internal_id'],
                'sales_name' => $plan['sales_name'],
                'customer_id' => $plan['customer_id'],
                'customer_name' => $plan['customer_name'],
                'plan_date' => $newDate,
                'tujuan' => $plan['tujuan'],
                'keterangan_tambahan' => $plan['keterangan_tambahan'],
                'status' => 'rescheduled',
                'result' => $plan['result'] ?? null,
                'result_location_lat' => $plan['result_location_lat'] ?? null,
                'result_location_lng' => $plan['result_location_lng'] ?? null,
                'result_location_accuracy' => $plan['result_location_accuracy'] ?? null,
                'result_location_timestamp' => $plan['result_location_timestamp'] ?? null,
                'result_saved_at' => $plan['result_saved_at'] ?? null,
                'created_at' => $plan['created_at'],
                'updated_at' => $now,
                'deleted_at' => null,
            ]
        ];
        $rowsToInsert[] = $rescheduleRow;
        
        // Insert all rows at once
        $this->bigQuery->insert('activity_plans', $rowsToInsert);
        
        // Clear related caches
        $this->clearCache($plan['sales_internal_id']);
        
        // Try cleanup, but don't fail if it doesn't work immediately
        $this->cleanupDuplicates($planId);
        
        return true;
    }

    public function delete($planId)
    {
        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
        
        // Get latest version first
        $sqlCheck = "
            SELECT *
            FROM `{$project}.{$dataset}.activity_plans`
            WHERE id = @plan_id
            ORDER BY updated_at DESC
            LIMIT 1
        ";
        
        $existing = $this->bigQuery->query($sqlCheck, ['plan_id' => $planId]);
        
        if (empty($existing)) {
            throw new \Exception("Activity plan not found");
        }
        
        $plan = $existing[0];
        $currentStatus = $plan['status'];
        
        // Cannot delete if status is 'done'
        if ($currentStatus === 'done') {
            throw new \Exception("Cannot delete activity plan with status: done");
        }
        
        // Always use INSERT strategy
        return $this->deleteWorkaround($planId, $plan);
    }

    protected function deleteWorkaround($planId, $plan = null)
    {
        $now = Carbon::now()->toDateTimeString();
        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
        
        // If plan data not provided, fetch it
        if (!$plan) {
            $sql = "
                SELECT * 
                FROM `{$project}.{$dataset}.activity_plans` 
                WHERE id = @plan_id
                ORDER BY updated_at DESC
                LIMIT 1
            ";
            $existing = $this->bigQuery->query($sql, ['plan_id' => $planId]);
            
            if (empty($existing)) {
                throw new \Exception("Activity plan not found");
            }
            
            $plan = $existing[0];
        }
        
        // Double check status before deleting
        if ($plan['status'] === 'done') {
            throw new \Exception("Cannot delete activity plan with status: done");
        }
        
        $row = [
            'insertId' => $planId . '_deleted_' . time() . '_' . rand(1000, 9999),
            'data' => [
                'id' => $plan['id'],
                'plan_no' => $plan['plan_no'],
                'sales_internal_id' => $plan['sales_internal_id'],
                'sales_name' => $plan['sales_name'],
                'customer_id' => $plan['customer_id'],
                'customer_name' => $plan['customer_name'],
                'plan_date' => $plan['plan_date'],
                'tujuan' => $plan['tujuan'],
                'keterangan_tambahan' => $plan['keterangan_tambahan'],
                'status' => 'deleted',
                'result' => $plan['result'] ?? null,
                'result_location_lat' => $plan['result_location_lat'] ?? null,
                'result_location_lng' => $plan['result_location_lng'] ?? null,
                'result_location_accuracy' => $plan['result_location_accuracy'] ?? null,
                'result_location_timestamp' => $plan['result_location_timestamp'] ?? null,
                'result_saved_at' => $plan['result_saved_at'] ?? null,
                'created_at' => $plan['created_at'],
                'updated_at' => $now,
                'deleted_at' => $now,
            ]
        ];
        
        $this->bigQuery->insert('activity_plans', [$row]);
        
        // Clear related caches
        $this->clearCache($plan['sales_internal_id']);
        
        // Try cleanup
        $this->cleanupDuplicates($planId);
        
        return true;
    }

    public function markMissedPlans()
    {
        $yesterday = Carbon::yesterday()->toDateString();
        $now = Carbon::now()->toDateTimeString();
        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
        
        $sql = "
            UPDATE `{$project}.{$dataset}.activity_plans`
            SET 
                status = @status,
                updated_at = @updated_at
            WHERE plan_date < @yesterday
            AND status = 'in progress'
        ";
        
        $this->bigQuery->query($sql, [
            'yesterday' => $yesterday,
            'status' => 'missed',
            'updated_at' => $now,
        ]);
        
        return true;
    }
    
    /**
     * Delete duplicate records for a specific plan ID (keep only latest)
     * This runs in background and may fail silently due to streaming buffer
     */
    protected function cleanupDuplicates($planId)
    {
        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
        
        try {
            // Get the latest updated_at for this ID
            $sqlLatest = "
                SELECT MAX(updated_at) as latest_updated_at
                FROM `{$project}.{$dataset}.activity_plans`
                WHERE id = @plan_id
            ";
            
            $result = $this->bigQuery->query($sqlLatest, ['plan_id' => $planId]);
            $latestUpdatedAt = $result[0]['latest_updated_at'] ?? null;
            
            if (!$latestUpdatedAt) {
                return;
            }
            
            // Delete all records except the latest one
            $sqlDelete = "
                DELETE FROM `{$project}.{$dataset}.activity_plans`
                WHERE id = @plan_id
                AND updated_at < @latest_updated_at
            ";
            
            $this->bigQuery->query($sqlDelete, [
                'plan_id' => $planId,
                'latest_updated_at' => $latestUpdatedAt,
            ]);
            
        } catch (\Exception $e) {
            // Ignore errors (streaming buffer might prevent immediate deletion)
            // The query GET methods will handle duplicates using ROW_NUMBER()
            \Log::warning("Could not cleanup duplicates for plan {$planId}: " . $e->getMessage());
        }
    }
    
    /**
     * Clear cache for a specific sales internal ID
     */
    protected function clearCache($salesInternalId, $date = null)
    {
        // Clear all plans cache
        Cache::forget("activity_plans:all:{$salesInternalId}");
        
        // Clear specific date cache if provided
        if ($date) {
            Cache::forget("activity_plans:{$salesInternalId}:{$date}");
        }
        
        // Note: For production, consider using cache tags with Redis
        // which allows pattern-based cache clearing more efficiently
    }
    
}