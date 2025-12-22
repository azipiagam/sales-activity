<?php
// app/Console/Commands/TestBigQueryConnection.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Google\Cloud\BigQuery\BigQueryClient;

class TestBigQueryConnection extends Command
{
    protected $signature = 'bigquery:test-connection';
    protected $description = 'Test BigQuery connection directly';

    public function handle()
    {
        try {
            $keyFilePath = storage_path('app/google/even-gearbox-255203-10881c36321f.json');
            $projectId = env('BIGQUERY_PROJECT_ID');
            $dataset = env('BIGQUERY_DATASET');
            
            $this->info("Testing BigQuery Connection...");
            $this->info("Key File: {$keyFilePath}");
            $this->info("Project ID: {$projectId}");
            $this->info("Dataset: {$dataset}");
            $this->info("File exists: " . (file_exists($keyFilePath) ? 'YES' : 'NO'));
            $this->newLine();
            
            // Create client
            $bigQuery = new BigQueryClient([
                'projectId' => $projectId,
                'keyFilePath' => $keyFilePath,
            ]);
            
            $this->info("✓ BigQuery client created");
            
            // Test query
            $sql = "SELECT 1 as test";
            $jobConfig = $bigQuery->query($sql);
            $queryResults = $bigQuery->runQuery($jobConfig);
            
            foreach ($queryResults as $row) {
                $this->info("✓ Query executed successfully");
                $this->info("Result: " . json_encode($row));
            }
            
            // Test dataset access
            $datasetObj = $bigQuery->dataset($dataset);
            $this->info("✓ Dataset accessed: {$dataset}");
            
            // List tables
            $this->newLine();
            $this->info("Tables in dataset:");
            foreach ($datasetObj->tables() as $table) {
                $this->info("  - " . $table->id());
            }
            
            return 0;
            
        } catch (\Exception $e) {
            $this->error("✗ Error: " . $e->getMessage());
            $this->error("File: " . $e->getFile());
            $this->error("Line: " . $e->getLine());
            return 1;
        }
    }
}