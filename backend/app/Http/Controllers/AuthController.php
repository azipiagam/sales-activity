<?php
// app/Http/Controllers/AuthController.php
// UPDATED: MySQL Version

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        // Join sales_auth dengan master_sales untuk data lengkap
        $sales = DB::table('sales_auth as sa')
            ->leftJoin('master_sales as ms', 'sa.sales_internal_id', '=', 'ms.internal_id')
            ->select(
                'sa.id',
                'sa.sales_internal_id',
                'sa.sales_name',
                'sa.username',
                'sa.password',
                'ms.email',
                'ms.job_title',
                'ms.department',
                'ms.location'
            )
            ->where('sa.username', $request->username)
            ->where('sa.is_active', true)
            ->first();

        if (!$sales) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (!Hash::check($request->password, $sales->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Update last_login
        DB::table('sales_auth')
            ->where('id', $sales->id)
            ->update([
                'last_login' => now()->toDateTimeString()
            ]);

        // Generate token
        $token = base64_encode($sales->sales_internal_id . '|' . time() . '|' . Str::random(40));

        return response()->json([
            'token' => $token,
            'sales' => [
                'internal_id' => $sales->sales_internal_id,
                'name' => $sales->sales_name,
                'username' => $sales->username,
                'email' => $sales->email,
                'job_title' => $sales->job_title,
                'department' => $sales->department,
            ]
        ]);
    }
}