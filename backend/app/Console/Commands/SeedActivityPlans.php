<?php
// app/Console/Commands/SeedActivityPlans.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\BigQueryService;
use Illuminate\Support\Str;
use Carbon\Carbon;

class SeedActivityPlans extends Command
{
    protected $signature = 'activity-plans:seed {--date= : Date for activity plans (YYYY-MM-DD)} {--sales-id= : Sales internal ID}';
    protected $description = 'Seed activity plans for testing';

    public function handle(BigQueryService $bigQuery)
    {
        $dataset = env('BIGQUERY_DATASET');
        $project = env('BIGQUERY_PROJECT_ID');
        
        // Get date from option or use today
        $dateStr = $this->option('date') ?? Carbon::today()->toDateString();
        $salesId = $this->option('sales-id') ?? '3355'; // Default to existing user
        
        try {
            // Verify sales exists
            $checkSql = "
                SELECT sales_internal_id, sales_name
                FROM `{$project}.{$dataset}.sales_auth`
                WHERE sales_internal_id = @sales_id
                LIMIT 1
            ";
            
            $salesExists = $bigQuery->query($checkSql, ['sales_id' => $salesId]);
            
            if (empty($salesExists)) {
                $this->error("Sales with ID $salesId not found!");
                return 1;
            }
            
            $salesName = $salesExists[0]['sales_name'];
            $this->info("Creating activity plans for $salesName (ID: $salesId) on $dateStr");
            
            // Create sample activity plans
            $plans = [
                [
                    'customer_id' => 'PC-2200433',
                    'customer_name' => 'BAJA UTAMA TEKNIK, UD',
                    'tujuan' => 'Visit',
                    'description' => 'Penawaran produk baru'
                ],
                [
                    'customer_id' => 'CUST00070',
                    'customer_name' => 'ANUGRAH TEKNIK JAYA, CV',
                    'tujuan' => 'Follow Up',
                    'description' => 'Follow up order sebelumnya'
                ],
                [
                    'customer_id' => 'CUST00105',
                    'customer_name' => 'PT MITRA TEKNOLOGI',
                    'tujuan' => 'Visit',
                    'description' => 'Demo produk untuk procurement team'
                ],
            ];
            
            $rows = [];
            $now = Carbon::now()->toDateTimeString();
            
            foreach ($plans as $plan) {
                $planNo = $this->generatePlanNo($bigQuery, $dataset, $project);
                
                $rows[] = [
                    'insertId' => Str::uuid()->toString(),
                    'data' => [
                        'id' => Str::uuid()->toString(),
                        'plan_no' => $planNo,
                        'sales_internal_id' => $salesId,
                        'sales_name' => $salesName,
                        'customer_id' => $plan['customer_id'],
                        'customer_name' => $plan['customer_name'],
                        'plan_date' => $dateStr,
                        'tujuan' => $plan['tujuan'],
                        'keterangan_tambahan' => $plan['description'],
                        'customer_location_lat' => null,
                        'customer_location_lng' => null,
                        'status' => 'in progress',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                ];
            }
            
            $bigQuery->insert('activity_plans', $rows);
            
            $this->info('Activity plans seeded successfully!');
            $this->table(
                ['Plan No', 'Customer', 'Date', 'Status'],
                array_map(function ($row) use ($dateStr) {
                    return [
                        $row['data']['plan_no'],
                        $row['data']['customer_name'],
                        $dateStr,
                        $row['data']['status']
                    ];
                }, $rows)
            );
            
            return 0;
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
    }
    
    protected function generatePlanNo($bigQuery, $dataset, $project)
    {
        $sql = "
            SELECT COALESCE(MAX(CAST(SUBSTR(plan_no, 4) AS INT64)), 0) as last_no
            FROM `{$project}.{$dataset}.activity_plans`
        ";
        
        $result = $bigQuery->query($sql);
        $lastNo = $result[0]['last_no'] ?? 0;
        $newNo = $lastNo + 1;
        
        return 'AP-' . str_pad($newNo, 6, '0', STR_PAD_LEFT);
    }
}
