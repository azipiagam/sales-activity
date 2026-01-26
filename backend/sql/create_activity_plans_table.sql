-- BigQuery DDL: Create activity_plans table dengan schema baru
-- Ganti PROJECT_ID dan DATASET_NAME sesuai nilai mu

-- Drop table lama jika ada (optional, buat backup dulu!)
-- DROP TABLE IF EXISTS `PROJECT_ID.DATASET_NAME.activity_plans`;

-- Create table dengan Partition dan Clustering
CREATE TABLE `PROJECT_ID.DATASET_NAME.activity_plans` (
  id STRING NOT NULL,
  plan_no STRING,
  sales_internal_id STRING,
  sales_name STRING,
  customer_id STRING,
  customer_name STRING,
  customer_address STRING,
  plan_date DATE,
  tujuan STRING,
  keterangan_tambahan STRING,
  status STRING,
  user_photo STRING,
  result STRING,
  
  -- Lokasi actual saat mark as done
  result_location_lat FLOAT64,
  result_location_lng FLOAT64,
  result_location_accuracy FLOAT64,
  
  -- Lokasi customer (dari geocoding address)
  customer_location_lat FLOAT64,
  customer_location_lng FLOAT64,
  
  -- Jarak antara customer location dan actual location
  result_location_distance FLOAT64,
  
  -- Timestamps
  result_location_timestamp DATETIME,
  result_saved_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME,
  deleted_at DATETIME
)
PARTITION BY plan_date
CLUSTER BY sales_internal_id, customer_id, status
OPTIONS (
  description = "Activity Plans dengan location validation - partitioned by plan_date dan clustered by sales_internal_id, customer_id, status",
  require_partition_filter = FALSE,
  labels = [("env", "production"), ("team", "sales")]
);

-- Create indexes untuk query performance (optional, untuk BigQuery biasanya gak perlu explicit index)
-- Tapi bisa bikin clustering strategy untuk optimasi

-- Verify table structure
DESCRIBE `PROJECT_ID.DATASET_NAME.activity_plans`;

-- Check partition dan clustering info
SELECT 
  table_name,
  partition_field,
  clustering_ordinal_position,
  clustering_field_name
FROM `PROJECT_ID.DATASET_NAME.INFORMATION_SCHEMA.TABLE_STORAGE`
WHERE table_name = 'activity_plans';
