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
        $results = DB::table('master_customer as mc')
            ->leftJoin('fix_address as fa', 'fa.customer_id', '=', 'mc.id')
            ->select(
                'mc.id',
                'mc.customer_name',
                'mc.company_name',
                DB::raw('COALESCE(NULLIF(fa.address, \'\'), mc.address) as address'),
                'mc.city',
                'mc.state',
                'mc.phone',
                'mc.email'
            )
            ->where(function($q) use ($salesName, $salesInternalId) {
                // Match sales_rep with various formats
                $q->where('mc.sales_rep', $salesName)
                  ->orWhere('mc.sales_rep', $salesInternalId)
                  ->orWhere('mc.sales_rep', 'LIKE', "%{$salesName}%")
                  ->orWhere('mc.sales_rep', 'LIKE', "%{$salesInternalId}%");
            })
            ->where('mc.inactive', 'No')
            ->where(function($q) use ($query) {
                // Search in customer_name or company_name
                $q->where('mc.customer_name', 'LIKE', "%{$query}%")
                  ->orWhere('mc.company_name', 'LIKE', "%{$query}%");
            })
            ->orderBy('mc.customer_name')
            ->get();

        return response()->json($results);
    }
}
