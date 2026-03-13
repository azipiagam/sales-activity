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
