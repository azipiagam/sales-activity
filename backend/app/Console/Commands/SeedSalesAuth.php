<?php
// app/Console/Commands/SeedSalesAuth.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\BigQueryService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class SeedSalesAuth extends Command
{
    protected $signature = 'sales:seed-auth';
    protected $description = 'Seed sales_auth from master_sales';

    public function handle(BigQueryService $bigQuery)
    {
        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
                
        // Get all sales from master_sales
        $sql = "
            SELECT internal_id, name, email
            FROM `{$project}.{$dataset}.master_sales`
        ";
        
        $salesList = $bigQuery->query($sql);
        
        $rows = [];
        foreach ($salesList as $sales) {
            // Generate username dari nama (lowercase, no space)
            $username = strtolower(str_replace(' ', '', $sales['name']));
            
            // Default password: password123 (hashed)
            $password = Hash::make('password123');
            
            $rows[] = [
                'insertId' => Str::uuid()->toString(),
                'data' => [
                    'id' => Str::uuid()->toString(),
                    'sales_internal_id' => $sales['internal_id'],
                    'sales_name' => $sales['name'],
                    'username' => $username,
                    'password' => $password,
                    'is_active' => true,
                    'created_at' => now()->toDateTimeString(),
                    'updated_at' => now()->toDateTimeString(),
                ]
            ];
        }
        
        $bigQuery->insert('sales_auth', $rows);
        
        $this->info('Sales auth seeded successfully!');
        $this->info('Default password for all sales: password123');
    }
}