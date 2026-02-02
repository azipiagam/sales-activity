<?php
// app/Services/DashboardService.php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class DashboardService
{
    protected $bigQuery;
    protected $cacheTime = 60; // Cache for 60 seconds

    public function __construct(BigQueryService $bigQuery)
    {
        $this->bigQuery = $bigQuery;
    }

    /**
     * Get status statistics (daily, weekly, monthly)
     * 
     * @param string $salesInternalId
     * @return array
     */
    public function getStatusStats($salesInternalId)
    {
        $cacheKey = "dashboard:stats:{$salesInternalId}:" . Carbon::today()->toDateString();
        
        return Cache::remember($cacheKey, $this->cacheTime, function () use ($salesInternalId) {
            $dataset = env('BIGQUERY_DATASET');
            $project = env('BIGQUERY_PROJECT_ID');
            
            $today = Carbon::today();
            $startOfWeek = $today->copy()->subDays(6); // Last 7 days including today
            $startOfMonth = $today->copy()->day(1); // From 1st of month
            
            // Query to get latest version of each record and count by status
            $sql = "
                WITH latest_versions AS (
                    SELECT *,
                        ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC) as rn
                    FROM `{$project}.{$dataset}.activity_plans`
                    WHERE sales_internal_id = @sales_internal_id
                        AND status NOT IN ('deleted')
                        AND created_at IS NOT NULL
                ),
                filtered_records AS (
                    SELECT * EXCEPT(rn)
                    FROM latest_versions
                    WHERE rn = 1
                ),
                daily_stats AS (
                    SELECT 
                        'daily' as period,
                        status,
                        COUNT(*) as count
                    FROM filtered_records
                    WHERE CAST(plan_date AS DATE) = CAST(@today AS DATE)
                    GROUP BY status
                ),
                weekly_stats AS (
                    SELECT 
                        'weekly' as period,
                        status,
                        COUNT(*) as count
                    FROM filtered_records
                    WHERE CAST(plan_date AS DATE) >= CAST(@start_of_week AS DATE)
                        AND CAST(plan_date AS DATE) <= CAST(@today AS DATE)
                    GROUP BY status
                ),
                monthly_stats AS (
                    SELECT 
                        'monthly' as period,
                        status,
                        COUNT(*) as count
                    FROM filtered_records
                    WHERE CAST(plan_date AS DATE) >= CAST(@start_of_month AS DATE)
                        AND CAST(plan_date AS DATE) <= CAST(@today AS DATE)
                    GROUP BY status
                )
                SELECT period, status, count
                FROM daily_stats
                UNION ALL
                SELECT period, status, count
                FROM weekly_stats
                UNION ALL
                SELECT period, status, count
                FROM monthly_stats
                ORDER BY period, status
            ";
            
            $results = $this->bigQuery->query($sql, [
                'sales_internal_id' => $salesInternalId,
                'today' => $today->toDateString(),
                'start_of_week' => $startOfWeek->toDateString(),
                'start_of_month' => $startOfMonth->toDateString(),
            ]);
            
            return $this->formatStatsResponse($results);
        });
    }

    /**
     * Format query results into structured response
     * 
     * @param array $results
     * @return array
     */
    private function formatStatsResponse($results)
    {
        $formatted = [
            'daily' => $this->getDefaultStatuses(),
            'weekly' => $this->getDefaultStatuses(),
            'monthly' => $this->getDefaultStatuses(),
            'summary' => [
                'date' => Carbon::today()->toDateString(),
                'last_updated' => Carbon::now()->toDateTimeString(),
            ]
        ];
        
        foreach ($results as $row) {
            $period = $row['period'];
            $status = $row['status'];
            $count = (int) $row['count'];
            
            if (isset($formatted[$period])) {
                // Map status values to standard ones
                $statusKey = $this->normalizeStatus($status);
                if ($statusKey && isset($formatted[$period][$statusKey])) {
                    $formatted[$period][$statusKey] = $count;
                }
            }
        }
        
        return $formatted;
    }

    /**
     * Get default statistics structure with zero counts
     * 
     * @return array
     */
    private function getDefaultStatuses()
    {
        return [
            'missed' => 0,
            'in_progress' => 0,
            'done' => 0,
        ];
    }

    /**
     * Normalize status names to standard format
     * 
     * @param string $status
     * @return string|null
     */
    private function normalizeStatus($status)
    {
        $status = strtolower(trim($status));
        
        // Map variations to standard status
        $statusMap = [
            'missed' => 'missed',
            'in progress' => 'in_progress',
            'in_progress' => 'in_progress',
            'done' => 'done',
            'completed' => 'done',
        ];
        
        return $statusMap[$status] ?? null;
    }

    /**
     * Get state statistics with status breakdown
     * Daily, Weekly, Monthly, All Time
     * 
     * @param string $salesInternalId
     * @return array
     */
    public function getStateStats($salesInternalId)
    {
        $cacheKey = "dashboard:state-stats:{$salesInternalId}:" . Carbon::today()->toDateString();
        
        return Cache::remember($cacheKey, $this->cacheTime, function () use ($salesInternalId) {
            $dataset = env('BIGQUERY_DATASET');
            $project = env('BIGQUERY_PROJECT_ID');
            
            $today = Carbon::today();
            $startOfWeek = $today->copy()->subDays(6);
            $startOfMonth = $today->copy()->day(1);
            
            $sql = "
                WITH latest_versions AS (
                    SELECT *,
                        ROW_NUMBER() OVER (PARTITION BY ap.id ORDER BY ap.updated_at DESC) as rn
                    FROM `{$project}.{$dataset}.activity_plans` ap
                    WHERE ap.sales_internal_id = @sales_internal_id
                        AND ap.status NOT IN ('deleted')
                        AND ap.created_at IS NOT NULL
                ),
                filtered_records AS (
                    SELECT lv.* EXCEPT(rn, state),
                        mc.state as customer_state
                    FROM latest_versions lv
                    LEFT JOIN `{$project}.{$dataset}.master_customer` mc
                        ON lv.customer_id = mc.id
                    WHERE rn = 1
                ),
                daily_stats AS (
                    SELECT 
                        'daily' as period,
                        COALESCE(customer_state, 'unknown') as state,
                        LOWER(status) as status,
                        COUNT(*) as count
                    FROM filtered_records
                    WHERE CAST(plan_date AS DATE) = CAST(@today AS DATE)
                    GROUP BY customer_state, status
                ),
                weekly_stats AS (
                    SELECT 
                        'weekly' as period,
                        COALESCE(customer_state, 'unknown') as state,
                        LOWER(status) as status,
                        COUNT(*) as count
                    FROM filtered_records
                    WHERE CAST(plan_date AS DATE) >= CAST(@start_of_week AS DATE)
                        AND CAST(plan_date AS DATE) <= CAST(@today AS DATE)
                    GROUP BY customer_state, status
                ),
                monthly_stats AS (
                    SELECT 
                        'monthly' as period,
                        COALESCE(customer_state, 'unknown') as state,
                        LOWER(status) as status,
                        COUNT(*) as count
                    FROM filtered_records
                    WHERE CAST(plan_date AS DATE) >= CAST(@start_of_month AS DATE)
                        AND CAST(plan_date AS DATE) <= CAST(@today AS DATE)
                    GROUP BY customer_state, status
                ),
                alltime_stats AS (
                    SELECT 
                        'all_time' as period,
                        COALESCE(customer_state, 'unknown') as state,
                        LOWER(status) as status,
                        COUNT(*) as count
                    FROM filtered_records
                    GROUP BY customer_state, status
                )
                SELECT period, state, status, count
                FROM daily_stats
                UNION ALL
                SELECT period, state, status, count
                FROM weekly_stats
                UNION ALL
                SELECT period, state, status, count
                FROM monthly_stats
                UNION ALL
                SELECT period, state, status, count
                FROM alltime_stats
                ORDER BY period, state, status
            ";
            
            $results = $this->bigQuery->query($sql, [
                'sales_internal_id' => $salesInternalId,
                'today' => $today->toDateString(),
                'start_of_week' => $startOfWeek->toDateString(),
                'start_of_month' => $startOfMonth->toDateString(),
            ]);
            
            return $this->formatStateStatsResponse($results);
        });
    }

    /**
     * Format state stats response
     * 
     * @param array $results
     * @return array
     */
    private function formatStateStatsResponse($results)
    {
        $formatted = [
            'daily' => [],
            'weekly' => [],
            'monthly' => [],
            'all_time' => [],
        ];
        
        foreach ($results as $row) {
            $period = $row['period'];
            $state = $row['state'];
            $status = $row['status'];
            $count = (int) $row['count'];
            
            if (!isset($formatted[$period][$state])) {
                $formatted[$period][$state] = $this->getDefaultStatuses();
            }
            
            $statusKey = $this->normalizeStatus($status);
            if ($statusKey) {
                $formatted[$period][$state][$statusKey] = $count;
            }
        }
        
        return $formatted;
    }

    /**
     * Get customer visit statistics
     * Daily, Weekly, Monthly, All Time
     * 
     * @param string $salesInternalId
     * @return array
     */
    public function getCustomerVisitStats($salesInternalId)
    {
        $cacheKey = "dashboard:customer-visits:{$salesInternalId}:" . Carbon::today()->toDateString();
        
        return Cache::remember($cacheKey, $this->cacheTime, function () use ($salesInternalId) {
            $dataset = env('BIGQUERY_DATASET');
            $project = env('BIGQUERY_PROJECT_ID');
            
            $today = Carbon::today();
            $startOfWeek = $today->copy()->subDays(6);
            $startOfMonth = $today->copy()->day(1);
            
            $sql = "
                WITH latest_versions AS (
                    SELECT *,
                        ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC) as rn
                    FROM `{$project}.{$dataset}.activity_plans`
                    WHERE sales_internal_id = @sales_internal_id
                        AND status NOT IN ('deleted')
                        AND created_at IS NOT NULL
                ),
                filtered_records AS (
                    SELECT * EXCEPT(rn)
                    FROM latest_versions
                    WHERE rn = 1
                ),
                daily_visits AS (
                    SELECT 
                        'daily' as period,
                        customer_id,
                        customer_name,
                        COUNT(*) as visit_count
                    FROM filtered_records
                    WHERE CAST(plan_date AS DATE) = CAST(@today AS DATE)
                    GROUP BY customer_id, customer_name
                ),
                weekly_visits AS (
                    SELECT 
                        'weekly' as period,
                        customer_id,
                        customer_name,
                        COUNT(*) as visit_count
                    FROM filtered_records
                    WHERE CAST(plan_date AS DATE) >= CAST(@start_of_week AS DATE)
                        AND CAST(plan_date AS DATE) <= CAST(@today AS DATE)
                    GROUP BY customer_id, customer_name
                ),
                monthly_visits AS (
                    SELECT 
                        'monthly' as period,
                        customer_id,
                        customer_name,
                        COUNT(*) as visit_count
                    FROM filtered_records
                    WHERE CAST(plan_date AS DATE) >= CAST(@start_of_month AS DATE)
                        AND CAST(plan_date AS DATE) <= CAST(@today AS DATE)
                    GROUP BY customer_id, customer_name
                ),
                alltime_visits AS (
                    SELECT 
                        'all_time' as period,
                        customer_id,
                        customer_name,
                        COUNT(*) as visit_count
                    FROM filtered_records
                    GROUP BY customer_id, customer_name
                )
                SELECT period, customer_id, customer_name, visit_count
                FROM daily_visits
                UNION ALL
                SELECT period, customer_id, customer_name, visit_count
                FROM weekly_visits
                UNION ALL
                SELECT period, customer_id, customer_name, visit_count
                FROM monthly_visits
                UNION ALL
                SELECT period, customer_id, customer_name, visit_count
                FROM alltime_visits
                ORDER BY period, visit_count DESC, customer_name
            ";
            
            $results = $this->bigQuery->query($sql, [
                'sales_internal_id' => $salesInternalId,
                'today' => $today->toDateString(),
                'start_of_week' => $startOfWeek->toDateString(),
                'start_of_month' => $startOfMonth->toDateString(),
            ]);
            
            return $this->formatCustomerVisitsResponse($results);
        });
    }

    /**
     * Format customer visits response
     * 
     * @param array $results
     * @return array
     */
    private function formatCustomerVisitsResponse($results)
    {
        $formatted = [
            'daily' => [],
            'weekly' => [],
            'monthly' => [],
            'all_time' => [],
        ];
        
        foreach ($results as $row) {
            $period = $row['period'];
            $formatted[$period][] = [
                'customer_id' => $row['customer_id'],
                'customer_name' => $row['customer_name'],
                'visit_count' => (int) $row['visit_count'],
            ];
        }
        
        return $formatted;
    }

    /**
     * Clear cache for a sales person
     * 
     * @param string $salesInternalId
     * @return void
     */
    public function clearCache($salesInternalId)
    {
        Cache::forget("dashboard:stats:{$salesInternalId}:" . Carbon::today()->toDateString());
        Cache::forget("dashboard:state-stats:{$salesInternalId}:" . Carbon::today()->toDateString());
        Cache::forget("dashboard:customer-visits:{$salesInternalId}:" . Carbon::today()->toDateString());
    }
}
