<?php
// app/Services/DashboardService.php
// UPDATED: MySQL Version (removed BigQuery & Cache)

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * Get status statistics (daily, weekly, monthly)
     */
    public function getStatusStats($salesInternalId)
    {
        $today = Carbon::today()->toDateString();
        $startOfWeek = Carbon::today()->subDays(6)->toDateString();
        $startOfMonth = Carbon::today()->day(1)->toDateString();
        
        // Daily stats
        $dailyStats = DB::table('activity_plans')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->where('sales_internal_id', $salesInternalId)
            ->where('status', '!=', 'deleted')
            ->whereNull('deleted_at')
            ->whereDate('plan_date', $today)
            ->groupBy('status')
            ->get();
        
        // Weekly stats
        $weeklyStats = DB::table('activity_plans')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->where('sales_internal_id', $salesInternalId)
            ->where('status', '!=', 'deleted')
            ->whereNull('deleted_at')
            ->whereBetween('plan_date', [$startOfWeek, $today])
            ->groupBy('status')
            ->get();
        
        // Monthly stats
        $monthlyStats = DB::table('activity_plans')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->where('sales_internal_id', $salesInternalId)
            ->where('status', '!=', 'deleted')
            ->whereNull('deleted_at')
            ->whereBetween('plan_date', [$startOfMonth, $today])
            ->groupBy('status')
            ->get();
        
        return [
            'daily' => $this->formatStats($dailyStats),
            'weekly' => $this->formatStats($weeklyStats),
            'monthly' => $this->formatStats($monthlyStats),
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
        $today = Carbon::today()->toDateString();
        $startOfWeek = Carbon::today()->subDays(6)->toDateString();
        $startOfMonth = Carbon::today()->day(1)->toDateString();
        
        // Daily stats by state
        $dailyStats = $this->getStateStatsForPeriod($salesInternalId, $today, $today);
        
        // Weekly stats by state
        $weeklyStats = $this->getStateStatsForPeriod($salesInternalId, $startOfWeek, $today);
        
        // Monthly stats by state
        $monthlyStats = $this->getStateStatsForPeriod($salesInternalId, $startOfMonth, $today);
        
        // All time stats by state
        $allTimeStats = $this->getStateStatsForPeriod($salesInternalId, null, null);
        
        return [
            'daily' => $this->formatStateStats($dailyStats),
            'weekly' => $this->formatStateStats($weeklyStats),
            'monthly' => $this->formatStateStats($monthlyStats),
            'all_time' => $this->formatStateStats($allTimeStats),
        ];
    }

    /**
     * Get state stats for a specific period
     */
    private function getStateStatsForPeriod($salesInternalId, $startDate, $endDate)
    {
        $query = DB::table('activity_plans as ap')
            ->leftJoin('master_customer as mc', 'ap.customer_id', '=', 'mc.id')
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
        $today = Carbon::today()->toDateString();
        $startOfWeek = Carbon::today()->subDays(6)->toDateString();
        $startOfMonth = Carbon::today()->day(1)->toDateString();
        
        // Daily visits
        $dailyVisits = $this->getCustomerVisitsForPeriod($salesInternalId, $today, $today);
        
        // Weekly visits
        $weeklyVisits = $this->getCustomerVisitsForPeriod($salesInternalId, $startOfWeek, $today);
        
        // Monthly visits
        $monthlyVisits = $this->getCustomerVisitsForPeriod($salesInternalId, $startOfMonth, $today);
        
        // All time visits
        $allTimeVisits = $this->getCustomerVisitsForPeriod($salesInternalId, null, null);
        
        return [
            'daily' => $this->formatCustomerVisits($dailyVisits),
            'weekly' => $this->formatCustomerVisits($weeklyVisits),
            'monthly' => $this->formatCustomerVisits($monthlyVisits),
            'all_time' => $this->formatCustomerVisits($allTimeVisits),
        ];
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