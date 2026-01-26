<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Services\BigQueryService;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    protected $bigQuery;

    public function __construct(BigQueryService $bigQuery)
    {
        $this->bigQuery = $bigQuery;
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
        
        // Join sales_auth dengan master_sales untuk dapetin data lengkap
        $sql = "
            SELECT 
                sa.id,
                sa.sales_internal_id,
                sa.sales_name,
                sa.username,
                sa.password,
                ms.email,
                ms.job_title,
                ms.department,
                ms.locationn
            FROM `{$project}.{$dataset}.sales_auth` sa
            LEFT JOIN `{$project}.{$dataset}.master_sales` ms
                ON sa.sales_internal_id = ms.internal_id
            WHERE sa.username = @username
            AND sa.is_active = true
            LIMIT 1
        ";
        
        $result = $this->bigQuery->query($sql, [
            'username' => $request->username,
        ]);

        if (empty($result)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $sales = $result[0];

        if (!Hash::check($request->password, $sales['password'])) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Update last_login
        $now = now()->toDateTimeString();
        $updateSql = "
            UPDATE `{$project}.{$dataset}.sales_auth`
            SET last_login = @last_login
            WHERE id = @id
        ";
        $this->bigQuery->query($updateSql, [
            'id' => $sales['id'],
            'last_login' => $now,
        ]);

        // Generate token
        $token = base64_encode($sales['sales_internal_id'] . '|' . time() . '|' . Str::random(40));

        return response()->json([
            'token' => $token,
            'sales' => [
                'internal_id' => $sales['sales_internal_id'],
                'name' => $sales['sales_name'],
                'username' => $sales['username'],
                'email' => $sales['email'],
                'job_title' => $sales['job_title'],
                'department' => $sales['department'],
            ]
        ]);
    }
}