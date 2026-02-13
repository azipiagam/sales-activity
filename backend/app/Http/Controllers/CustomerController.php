<?php
// app/Http/Controllers/CustomerController.php
// UPDATED: MySQL Version (removed BigQueryService dependency)

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * Search customer by sales_rep (autocomplete)
     * Changed: MySQL query instead of BigQuery
     * 
     * URL: GET /api/customers/search?q=customer_name
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');
        $salesInternalId = $request->sales_internal_id;
        $salesName = $request->sales_name;

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        // MySQL query with LIKE for flexible matching
        $results = DB::table('master_customer')
            ->select(
                'id',
                'customer_name',
                'company_name',
                'address',
                'city',
                'state',
                'phone',
                'email'
            )
            ->where(function($q) use ($salesName, $salesInternalId) {
                // Match sales_rep with various formats
                $q->where('sales_rep', $salesName)
                  ->orWhere('sales_rep', $salesInternalId)
                  ->orWhere('sales_rep', 'LIKE', "%{$salesName}%")
                  ->orWhere('sales_rep', 'LIKE', "%{$salesInternalId}%");
            })
            ->where('inactive', 'No')
            ->where(function($q) use ($query) {
                // Search in customer_name or company_name
                $q->where('customer_name', 'LIKE', "%{$query}%")
                  ->orWhere('company_name', 'LIKE', "%{$query}%");
            })
            ->orderBy('customer_name')
            ->get();

        return response()->json($results);
    }
}