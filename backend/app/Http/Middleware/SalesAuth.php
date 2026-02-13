<?php
// app/Http/Middleware/SalesAuth.php
// UPDATED: MySQL Version

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesAuth
{
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
        $sales = DB::table('sales_auth as sa')
            ->leftJoin('master_sales as ms', 'sa.sales_internal_id', '=', 'ms.internal_id')
            ->select(
                'sa.sales_internal_id',
                'sa.sales_name',
                'ms.name as full_name',
                'ms.email',
                'ms.department'
            )
            ->where('sa.sales_internal_id', $salesInternalId)
            ->where('sa.is_active', true)
            ->first();

        if (!$sales) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Attach data ke request
        $request->merge([
            'sales_internal_id' => $sales->sales_internal_id,
            'sales_name' => $sales->sales_name ?: $sales->full_name,
        ]);

        return $next($request);
    }
}