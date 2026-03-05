<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\BigQueryService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class SeedSalesAuth extends Command
{
    protected $signature = 'sales:seed-auth';
    protected $description = 'Seed sales_auth from master_sales (skip existing)';

    public function handle(BigQueryService $bigQuery)
    {
        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');

        // Ambil semua sales dari master_sales
        $salesList = $bigQuery->query("
            SELECT internal_id, name, email
            FROM `{$project}.{$dataset}.master_sales`
        ");

        if (empty($salesList)) {
            $this->info('No sales found in master_sales.');
            return;
        }

        // Ambil username yang sudah ada di sales_auth
        $existingRows = $bigQuery->query("
            SELECT username
            FROM `{$project}.{$dataset}.sales_auth`
        ");
        $existingUsernames = array_column($existingRows, 'username');

        $rows = [];
        $skipped = 0;

        foreach ($salesList as $sales) {
            $username = strtolower(str_replace(' ', '', $sales['name']));

            // Skip kalau username sudah ada
            if (in_array($username, $existingUsernames)) {
                $skipped++;
                continue;
            }

            $rows[] = [
                'insertId' => Str::uuid()->toString(),
                'data' => [
                    'id'                => Str::uuid()->toString(),
                    'sales_internal_id' => $sales['internal_id'],
                    'sales_name'        => $sales['name'],
                    'username'          => $username,
                    'password'          => Hash::make('password123'),
                    'is_active'         => true,
                    'created_at'        => now()->toDateTimeString(),
                    'updated_at'        => now()->toDateTimeString(),
                ]
            ];
        }

        if (empty($rows)) {
            $this->info("No new sales to seed. Skipped: {$skipped}");
            return;
        }

        $bigQuery->insert('sales_auth', $rows);

        $this->info('Sales auth seeded successfully!');
        $this->info('Inserted: ' . count($rows) . ' | Skipped: ' . $skipped);
        $this->info('Default password for new sales: password123');

        Log::info('SeedSalesAuth: Inserted ' . count($rows) . ', Skipped ' . $skipped);
    }
}