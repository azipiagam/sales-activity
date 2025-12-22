<?php
// app/Services/BigQueryService.php

namespace App\Services;

use Google\Cloud\BigQuery\BigQueryClient;
use Google\Cloud\BigQuery\Numeric;
use Illuminate\Support\Facades\Log;

class BigQueryService
{
    protected $bigQuery;
    protected $projectId;

    public function __construct()
    {
        $keyFilePath = storage_path('app/google/even-gearbox-255203-10881c36321f.json');
        $this->projectId = env('BIGQUERY_PROJECT_ID');
        
        $this->bigQuery = new BigQueryClient([
            'projectId' => $this->projectId,
            'keyFilePath' => $keyFilePath,
        ]);
    }

    public function runQuery($query, $parameters = [])
    {
        try {
            $jobConfig = $this->bigQuery->query($query);
            
            // Add parameters if provided
            if (!empty($parameters)) {
                $jobConfig = $jobConfig->parameters($parameters);
            }
            
            $queryResults = $this->bigQuery->runQuery($jobConfig);

            $rows = [];
            foreach ($queryResults as $row) {
                $rows[] = $this->convertRow($row);
            }

            return $rows;

        } catch (\Exception $e) {
            Log::error('BigQuery Error: ' . $e->getMessage());
            throw $e;
        }
    }

    // Alias untuk compatibility
    public function query($sql, $parameters = [])
    {
        return $this->runQuery($sql, $parameters);
    }

    public function insert($tableName, $rows)
    {
        try {
            $dataset = $this->bigQuery->dataset(env('BIGQUERY_DATASET'));
            $table = $dataset->table($tableName);
            $insertResponse = $table->insertRows($rows);
            
            if ($insertResponse->isSuccessful()) {
                return true;
            } else {
                foreach ($insertResponse->failedRows() as $row) {
                    Log::error('Failed row: ' . json_encode($row));
                }
                return false;
            }
        } catch (\Exception $e) {
            Log::error('BigQuery Insert Error: ' . $e->getMessage());
            throw $e;
        }
    }

    protected function convertRow($row)
    {
        $converted = [];
        foreach ($row as $key => $value) {
            if ($value instanceof Numeric) {
                $converted[$key] = (float) $value->get();
            } elseif ($value instanceof \Google\Cloud\BigQuery\Date) {
                $converted[$key] = $value->formatAsString();
            } elseif ($value instanceof \Google\Cloud\BigQuery\Timestamp) {
                $converted[$key] = $value->get()->format('Y-m-d H:i:s');
            } elseif (is_null($value)) {
                $converted[$key] = null; // Changed from 0 to null
            } else {
                $converted[$key] = $value;
            }
        }
        return $converted;
    }
}