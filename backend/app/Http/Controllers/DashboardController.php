<?php
// app/Http/Controllers/DashboardController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\DashboardService;

class DashboardController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * GET /api/dashboard/stats
     */
    public function getStats(Request $request)
    {
        try {
            $salesInternalId = $request->sales_internal_id;
            
            if (!$salesInternalId) {
                return response()->json(['message' => 'Sales internal ID not found'], 400);
            }
            
            $stats = $this->dashboardService->getStatusStats($salesInternalId);
            
            return response()->json([
                'data' => $stats,
                'message' => 'Dashboard stats retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Dashboard Stats Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve dashboard stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/dashboard/state-stats
     */
    public function getStateStats(Request $request)
    {
        try {
            $salesInternalId = $request->sales_internal_id;
            
            if (!$salesInternalId) {
                return response()->json(['message' => 'Sales internal ID not found'], 400);
            }
            
            $stats = $this->dashboardService->getStateStats($salesInternalId);
            
            return response()->json([
                'data' => $stats,
                'message' => 'State statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('State Stats Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve state statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/dashboard/customer-visits
     */
    public function getCustomerVisits(Request $request)
    {
        try {
            $salesInternalId = $request->sales_internal_id;
            
            if (!$salesInternalId) {
                return response()->json(['message' => 'Sales internal ID not found'], 400);
            }
            
            $stats = $this->dashboardService->getCustomerVisitStats($salesInternalId);
            
            return response()->json([
                'data' => $stats,
                'message' => 'Customer visit statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Customer Visits Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve customer visit statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/dashboard/customer-visits-weekly-export
     */
    public function getCustomerVisitsWeeklyExport(Request $request)
    {
        try {
            $salesInternalId = $request->sales_internal_id;
            $periodKey = $request->get('period', 'monthly');
            $province = $request->get('province');

            if (!$salesInternalId) {
                return response()->json(['message' => 'Sales internal ID not found'], 400);
            }

            $exportData = $this->dashboardService->getCustomerVisitsWeeklyExport(
                $salesInternalId,
                $periodKey,
                $province
            );

            return response()->json([
                'data' => $exportData,
                'message' => 'Customer weekly export data retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Customer Weekly Export Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve customer weekly export data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
