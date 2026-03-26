<?php
// app/Http/Controllers/ProfileController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Services\BigQueryService;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    protected $bigQueryService;

    public function __construct(BigQueryService $bigQueryService)
    {
        $this->bigQueryService = $bigQueryService;
    }

    public function changeProfile(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_username'     => 'nullable|string|min:3',
            'new_password'     => 'nullable|string|min:6',
        ]);

        // Minimal salah satu harus diisi
        if (!$request->new_username && !$request->new_password) {
            return response()->json([
                'success' => false,
                'message' => 'Isi minimal new_username atau new_password'
            ], 422);
        }

        $salesInternalId = $request->sales_internal_id;

        // Ambil data user
        $user = DB::table('sales_auth')
            ->where('sales_internal_id', $salesInternalId)
            ->where('is_active', true)
            ->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        // Verifikasi password saat ini
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Password saat ini salah'], 401);
        }

        $updates = ['updated_at' => now()->toDateTimeString()];
        $bqUpdates = ["updated_at = '" . now()->toDateTimeString() . "'"];
        $changed = [];

        // Ganti username
        if ($request->new_username) {
            $exists = DB::table('sales_auth')
                ->where('username', $request->new_username)
                ->where('sales_internal_id', '!=', $salesInternalId)
                ->exists();

            if ($exists) {
                return response()->json(['success' => false, 'message' => 'Username sudah digunakan'], 422);
            }

            $updates['username'] = $request->new_username;
            $bqUpdates[] = "username = '{$request->new_username}'";
            $changed[] = 'username';
        }

        // Ganti password
        if ($request->new_password) {
            $newHashedPassword = Hash::make($request->new_password);
            $updates['password'] = $newHashedPassword;
            $bqUpdates[] = "password = '{$newHashedPassword}'";
            $changed[] = 'password';
        }

        // Update MySQL
        DB::table('sales_auth')
            ->where('sales_internal_id', $salesInternalId)
            ->update($updates);

        // Sync ke BigQuery
        try {
            $dataset = env('BIGQUERY_DATASET');
            $project = env('BIGQUERY_PROJECT_ID');
            $setClause = implode(', ', $bqUpdates);

            $this->bigQueryService->runQuery("
                UPDATE \`{$project}.{$dataset}.sales_auth\`
                SET {$setClause}
                WHERE sales_internal_id = '{$salesInternalId}'
            ");
        } catch (\Exception $e) {
            Log::warning('BigQuery profile sync failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengubah ' . implode(' dan ', $changed),
        ]);
    }
}