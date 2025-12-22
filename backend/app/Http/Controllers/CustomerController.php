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
        $salesInternalId = $request->sales_internal_id;
        $salesName = $request->sales_name;

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
        
        $sql = "
            SELECT 
                c.id, 
                c.customer_name, 
                c.company_name, 
                c.address, 
                c.city,
                c.state,
                c.phone,
                c.email
            FROM `{$project}.{$dataset}.master_customer` c
            WHERE (
                -- Match dengan berbagai format sales_rep
                c.sales_rep = @sales_name
                OR c.sales_rep = @sales_internal_id
                OR LOWER(c.sales_rep) LIKE CONCAT('%', LOWER(@sales_name), '%')
                OR LOWER(c.sales_rep) LIKE CONCAT('%', LOWER(@sales_internal_id), '%')
            )
            AND c.inactive = 'No'
            AND (
                LOWER(c.customer_name) LIKE CONCAT('%', LOWER(@query), '%')
                OR LOWER(c.company_name) LIKE CONCAT('%', LOWER(@query), '%')
            )
            ORDER BY c.customer_name
        ";
        
        $results = $this->bigQuery->query($sql, [
            'sales_name' => $salesName,
            'sales_internal_id' => $salesInternalId,
            'query' => $query,
        ]);

        return response()->json($results);
    }
}