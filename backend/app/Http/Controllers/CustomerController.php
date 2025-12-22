<?php
// app/Http/Controllers/CustomerController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\BigQueryService;

class CustomerController extends Controller
{
    protected $bigQuery;

    public function __construct(BigQueryService $bigQuery)
    {
        $this->bigQuery = $bigQuery;
    }

    /**
     * Search customer by sales_rep (autocomplete)
     * URL: GET /api/customers/search?q=customer_name
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');
        $salesInternalId = $request->sales_internal_id; // dari middleware
        $salesName = $request->sales_name; // dari middleware

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
        
        // Query berdasarkan sales_rep (yang isinya nama sales)
        $sql = "
            SELECT 
                id, 
                customer_name, 
                company_name, 
                address, 
                city,
                state,
                phone,
                email
            FROM `{$project}.{$dataset}.master_customer`
            WHERE sales_rep = @sales_name
            AND inactive = 'F'
            AND (
                LOWER(customer_name) LIKE LOWER(@query)
                OR LOWER(company_name) LIKE LOWER(@query)
            )
            ORDER BY customer_name
            LIMIT 20
        ";
        
        $results = $this->bigQuery->query($sql, [
            'sales_name' => $salesName,
            'query' => "%{$query}%",
        ]);

        return response()->json($results);
    }
}