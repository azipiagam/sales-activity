<?php
// app/Http/Middleware/SalesAuth.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\BigQueryService;

class SalesAuth
{
    protected $bigQuery;

    public function __construct(BigQueryService $bigQuery)
    {
        $this->bigQuery = $bigQuery;
    }

    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Decode token
        $decoded = base64_decode($token);
        $parts = explode('|', $decoded);
        
        if (count($parts) < 3) {
            return response()->json(['message' => 'Invalid token'], 401);
        }

        $salesInternalId = $parts[0];
        
        // Verify sales exists dan ambil data lengkap
        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
        
        $sql = "
            SELECT 
                sa.sales_internal_id,
                sa.sales_name,
                ms.name as full_name,
                ms.email,
                ms.department
            FROM `{$project}.{$dataset}.sales_auth` sa
            LEFT JOIN `{$project}.{$dataset}.master_sales` ms
                ON sa.sales_internal_id = ms.internal_id
            WHERE sa.sales_internal_id = @sales_internal_id
            AND sa.is_active = true
            LIMIT 1
        ";
        
        $result = $this->bigQuery->query($sql, [
            'sales_internal_id' => $salesInternalId
        ]);

        if (empty($result)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $sales = $result[0];

        // Attach data ke request
        $request->merge([
            'sales_internal_id' => $sales['sales_internal_id'],
            'sales_name' => $sales['sales_name'] ?: $sales['full_name'],
        ]);

        return $next($request);
    }
}