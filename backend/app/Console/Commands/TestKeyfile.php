<?php
// app/Console/Commands/TestKeyfile.php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class TestKeyfile extends Command
{
    protected $signature = 'bigquery:test-keyfile';
    protected $description = 'Test if BigQuery keyfile exists';

    public function handle()
    {
        $this->info("Testing keyfile paths...\n");
        
        // Test 1: Raw env
        $envPath = env('GOOGLE_CLOUD_KEY_FILE');
        $this->info("ENV value: {$envPath}");
        $this->info("Exists: " . (file_exists($envPath) ? '✓ YES' : '✗ NO'));
        
        // Test 2: storage_path
        $storagePath = storage_path('app/google/' . basename($envPath));
        $this->info("\nstorage_path: {$storagePath}");
        $this->info("Exists: " . (file_exists($storagePath) ? '✓ YES' : '✗ NO'));
        
        // Test 3: base_path
        $basePath = base_path($envPath);
        $this->info("\nbase_path: {$basePath}");
        $this->info("Exists: " . (file_exists($basePath) ? '✓ YES' : '✗ NO'));
        
        // Test 4: Config (if using config)
        if (config('bigquery.key_file')) {
            $configPath = config('bigquery.key_file');
            $this->info("\nconfig path: {$configPath}");
            $this->info("Exists: " . (file_exists($configPath) ? '✓ YES' : '✗ NO'));
        }
        
        // List files in storage/app/google
        $this->info("\n=== Files in storage/app/google ===");
        $googleDir = storage_path('app/google');
        if (is_dir($googleDir)) {
            $files = scandir($googleDir);
            foreach ($files as $file) {
                if ($file !== '.' && $file !== '..') {
                    $this->info("  - {$file}");
                }
            }
        } else {
            $this->warn("Directory not found: {$googleDir}");
        }
        
        return 0;
    }
}