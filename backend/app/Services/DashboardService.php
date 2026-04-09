<?php
// app/Services/DashboardService.php
// UPDATED: MySQL Version (removed BigQuery & Cache)

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * Get status statistics for dashboard periods
     */
    public function getStatusStats($salesInternalId)
    {
        $today = Carbon::today()->toDateString();
        $periodRanges = $this->buildPeriodRanges();

        return [
            'daily' => $this->formatStats($this->getStatusStatsForPeriod($salesInternalId, ...$periodRanges['daily'])),
            'weekly' => $this->formatStats($this->getStatusStatsForPeriod($salesInternalId, ...$periodRanges['weekly'])),
            'monthly' => $this->formatStats($this->getStatusStatsForPeriod($salesInternalId, ...$periodRanges['monthly'])),
            'last_30_days' => $this->formatStats($this->getStatusStatsForPeriod($salesInternalId, ...$periodRanges['last_30_days'])),
            'previous_month' => $this->formatStats($this->getStatusStatsForPeriod($salesInternalId, ...$periodRanges['previous_month'])),
            'all_time' => $this->formatStats($this->getStatusStatsForPeriod($salesInternalId, ...$periodRanges['all_time'])),
            'summary' => [
                'date' => $today,
                'last_updated' => Carbon::now()->toDateTimeString(),
            ]
        ];
    }

    /**
     * Get state statistics with status breakdown
     */
    public function getStateStats($salesInternalId)
    {
        $periodRanges = $this->buildPeriodRanges();

        return [
            'daily' => $this->formatStateStats($this->getStateStatsForPeriod($salesInternalId, ...$periodRanges['daily'])),
            'weekly' => $this->formatStateStats($this->getStateStatsForPeriod($salesInternalId, ...$periodRanges['weekly'])),
            'monthly' => $this->formatStateStats($this->getStateStatsForPeriod($salesInternalId, ...$periodRanges['monthly'])),
            'last_30_days' => $this->formatStateStats($this->getStateStatsForPeriod($salesInternalId, ...$periodRanges['last_30_days'])),
            'previous_month' => $this->formatStateStats($this->getStateStatsForPeriod($salesInternalId, ...$periodRanges['previous_month'])),
            'all_time' => $this->formatStateStats($this->getStateStatsForPeriod($salesInternalId, ...$periodRanges['all_time'])),
        ];
    }

    /**
     * Get state stats for a specific period
     */
    private function getStateStatsForPeriod($salesInternalId, $startDate, $endDate)
    {
        $query = DB::table('activity_plans as ap')
            ->leftJoin('master_customer as mc', function ($join) {
                $join->on(
                    DB::raw('ap.customer_id COLLATE utf8mb4_unicode_ci'),
                    '=',
                    DB::raw('mc.id COLLATE utf8mb4_unicode_ci')
                );
            })
            ->select(
                DB::raw('COALESCE(ap.state, mc.state, "unknown") as state'),
                'ap.status',
                DB::raw('COUNT(*) as count')
            )
            ->where('ap.sales_internal_id', $salesInternalId)
            ->where('ap.status', '!=', 'deleted')
            ->whereNull('ap.deleted_at');
        
        if ($startDate && $endDate) {
            $query->whereBetween('ap.plan_date', [$startDate, $endDate]);
        }
        
        return $query->groupBy('state', 'ap.status')->get();
    }

    /**
     * Get customer visit statistics
     */
    public function getCustomerVisitStats($salesInternalId)
    {
        $periodRanges = $this->buildPeriodRanges();

        return [
            'daily' => $this->formatCustomerVisits($this->getCustomerVisitsForPeriod($salesInternalId, ...$periodRanges['daily'])),
            'weekly' => $this->formatCustomerVisits($this->getCustomerVisitsForPeriod($salesInternalId, ...$periodRanges['weekly'])),
            'monthly' => $this->formatCustomerVisits($this->getCustomerVisitsForPeriod($salesInternalId, ...$periodRanges['monthly'])),
            'last_30_days' => $this->formatCustomerVisits($this->getCustomerVisitsForPeriod($salesInternalId, ...$periodRanges['last_30_days'])),
            'previous_month' => $this->formatCustomerVisits($this->getCustomerVisitsForPeriod($salesInternalId, ...$periodRanges['previous_month'])),
            'all_time' => $this->formatCustomerVisits($this->getCustomerVisitsForPeriod($salesInternalId, ...$periodRanges['all_time'])),
        ];
    }

    /**
     * Get customer visit export data aggregated by month and week buckets
     */
    public function getCustomerVisitsWeeklyExport($salesInternalId, $periodKey = 'monthly', $provinceFilter = null)
    {
        [$startDate, $endDate] = $this->resolveWeeklyExportRange($periodKey);
        $months = $this->buildWeeklyExportMonths($startDate, $endDate);
        $emptyWeeks = $this->buildEmptyWeeklyExportBuckets($months);

        $visits = DB::table('activity_plans as ap')
            ->leftJoin('master_customer as mc', function ($join) {
                $join->on(
                    DB::raw('ap.customer_id COLLATE utf8mb4_unicode_ci'),
                    '=',
                    DB::raw('mc.id COLLATE utf8mb4_unicode_ci')
                );
            })
            ->select(
                DB::raw('COALESCE(NULLIF(TRIM(ap.state), ""), NULLIF(TRIM(mc.state), ""), "Unknown") as province'),
                DB::raw('COALESCE(NULLIF(TRIM(ap.customer_name), ""), "Unknown") as customer_name'),
                'ap.plan_date'
            )
            ->where('ap.sales_internal_id', $salesInternalId)
            ->where('ap.status', '!=', 'deleted')
            ->whereNull('ap.deleted_at')
            ->whereBetween('ap.plan_date', [$startDate, $endDate])
            ->orderBy('ap.plan_date', 'desc')
            ->get();

        $rows = [];
        $shouldFilterProvince = $this->shouldFilterExportProvince($provinceFilter);

        foreach ($visits as $visit) {
            $province = trim((string) ($visit->province ?? '')) ?: 'Unknown';

            if ($shouldFilterProvince && $province !== $provinceFilter) {
                continue;
            }

            $customer = trim((string) ($visit->customer_name ?? '')) ?: 'Unknown';
            $visitDate = Carbon::parse($visit->plan_date);
            $monthKey = $visitDate->format('Y-m');
            $weekKey = $this->resolveWeeklyBucketKey($visitDate);
            $rowKey = $province . '||' . $customer;

            if (!isset($emptyWeeks[$monthKey])) {
                continue;
            }

            if (!isset($rows[$rowKey])) {
                $rows[$rowKey] = [
                    'province' => $province,
                    'customer' => $customer,
                    'weeks' => $this->buildEmptyWeeklyExportBuckets($months),
                    'total' => 0,
                ];
            }

            $rows[$rowKey]['weeks'][$monthKey][$weekKey] += 1;
            $rows[$rowKey]['total'] += 1;
        }

        $rows = array_values($rows);

        usort($rows, function ($left, $right) {
            $provinceCompare = strcasecmp($left['province'], $right['province']);
            if ($provinceCompare !== 0) {
                return $provinceCompare;
            }

            return strcasecmp($left['customer'], $right['customer']);
        });

        return [
            'period_key' => $this->normalizeWeeklyExportPeriodKey($periodKey),
            'months' => $months,
            'rows' => $rows,
            'summary' => [
                'total_rows' => count($rows),
                'total_visits' => array_sum(array_column($rows, 'total')),
            ],
        ];
    }

    private function buildPeriodRanges()
    {
        $today = Carbon::today();
        $todayString = $today->toDateString();

        return [
            'daily' => [$todayString, $todayString],
            'weekly' => [$today->copy()->subDays(6)->toDateString(), $todayString],
            'monthly' => [$today->copy()->startOfMonth()->toDateString(), $todayString],
            'last_30_days' => [$today->copy()->subDays(30)->toDateString(), $today->copy()->subDay()->toDateString()],
            'previous_month' => [
                $today->copy()->subMonth()->startOfMonth()->toDateString(),
                $today->copy()->subMonth()->endOfMonth()->toDateString(),
            ],
            'all_time' => [null, null],
        ];
    }

    private function getStatusStatsForPeriod($salesInternalId, $startDate, $endDate)
    {
        $query = DB::table('activity_plans')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->where('sales_internal_id', $salesInternalId)
            ->where('status', '!=', 'deleted')
            ->whereNull('deleted_at');

        if ($startDate && $endDate) {
            $query->whereBetween('plan_date', [$startDate, $endDate]);
        }

        return $query->groupBy('status')->get();
    }

    /**
     * Get customer visits for a specific period
     */
    private function getCustomerVisitsForPeriod($salesInternalId, $startDate, $endDate)
    {
        $query = DB::table('activity_plans')
            ->select(
                'customer_id',
                'customer_name',
                DB::raw('COUNT(*) as visit_count')
            )
            ->where('sales_internal_id', $salesInternalId)
            ->where('status', '!=', 'deleted')
            ->whereNull('deleted_at');
        
        if ($startDate && $endDate) {
            $query->whereBetween('plan_date', [$startDate, $endDate]);
        }
        
        return $query
            ->groupBy('customer_id', 'customer_name')
            ->orderByDesc('visit_count')
            ->orderBy('customer_name')
            ->get();
    }

    private function normalizeWeeklyExportPeriodKey($periodKey)
    {
        $normalizedKey = strtolower(trim((string) $periodKey));
        $allowedPeriods = ['monthly', 'previous_month', 'yearly'];

        return in_array($normalizedKey, $allowedPeriods, true) ? $normalizedKey : 'monthly';
    }

    private function resolveWeeklyExportRange($periodKey)
    {
        $today = Carbon::today();
        $normalizedPeriodKey = $this->normalizeWeeklyExportPeriodKey($periodKey);

        if ($normalizedPeriodKey === 'previous_month') {
            $previousMonth = $today->copy()->subMonth();

            return [
                $previousMonth->copy()->startOfMonth()->toDateString(),
                $previousMonth->copy()->endOfMonth()->toDateString(),
            ];
        }

        if ($normalizedPeriodKey === 'yearly') {
            return [
                $today->copy()->subMonths(11)->startOfMonth()->toDateString(),
                $today->toDateString(),
            ];
        }

        return [
            $today->copy()->startOfMonth()->toDateString(),
            $today->toDateString(),
        ];
    }

    private function buildWeeklyExportMonths($startDate, $endDate)
    {
        $start = Carbon::parse($startDate)->startOfMonth();
        $end = Carbon::parse($endDate)->startOfMonth();
        $months = [];

        for ($cursor = $end->copy(); $cursor->greaterThanOrEqualTo($start); $cursor->subMonth()) {
            $months[] = [
                'key' => $cursor->format('Y-m'),
                'label' => ucfirst($cursor->locale('id')->translatedFormat('F')),
                'year' => (int) $cursor->format('Y'),
            ];
        }

        return $months;
    }

    private function buildEmptyWeeklyExportBuckets(array $months)
    {
        $buckets = [];

        foreach ($months as $month) {
            $monthKey = $month['key'];
            $buckets[$monthKey] = [
                'week1' => 0,
                'week2' => 0,
                'week3' => 0,
                'week4' => 0,
            ];
        }

        return $buckets;
    }

    private function shouldFilterExportProvince($provinceFilter)
    {
        if ($provinceFilter === null) {
            return false;
        }

        $normalizedProvince = trim((string) $provinceFilter);

        return $normalizedProvince !== '' &&
            !in_array($normalizedProvince, ['Semua Provinsi', 'Provinsi'], true);
    }

    private function resolveWeeklyBucketKey(Carbon $date)
    {
        $weekNumber = (int) ceil($date->day / 7);
        $weekNumber = max(1, min(4, $weekNumber));

        return 'week' . $weekNumber;
    }

    /**
     * Format status stats
     */
    private function formatStats($stats)
    {
        $formatted = [
            'missed' => 0,
            'in_progress' => 0,
            'done' => 0,
        ];
        
        foreach ($stats as $stat) {
            $statusKey = $this->normalizeStatus($stat->status);
            if ($statusKey) {
                $formatted[$statusKey] = (int) $stat->count;
            }
        }
        
        return $formatted;
    }

    /**
     * Format state stats
     */
    private function formatStateStats($stats)
    {
        $formatted = [];
        
        foreach ($stats as $stat) {
            $state = $stat->state;
            $statusKey = $this->normalizeStatus($stat->status);
            
            if (!isset($formatted[$state])) {
                $formatted[$state] = [
                    'missed' => 0,
                    'in_progress' => 0,
                    'done' => 0,
                ];
            }
            
            if ($statusKey) {
                $formatted[$state][$statusKey] = (int) $stat->count;
            }
        }
        
        return $formatted;
    }

    /**
     * Format customer visits
     */
    private function formatCustomerVisits($visits)
    {
        return $visits->map(function($visit) {
            return [
                'customer_id' => $visit->customer_id,
                'customer_name' => $visit->customer_name,
                'visit_count' => (int) $visit->visit_count,
            ];
        })->toArray();
    }

    /**
     * Normalize status names
     */
    private function normalizeStatus($status)
    {
        $status = strtolower(trim($status));
        
        $statusMap = [
            'missed' => 'missed',
            'in progress' => 'in_progress',
            'in_progress' => 'in_progress',
            'rescheduled' => 'in_progress',
            'done' => 'done',
            'completed' => 'done',
        ];
        
        return $statusMap[$status] ?? null;
    }
}
