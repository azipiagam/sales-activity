-- Script untuk recreate table activity_plans dengan Partition dan Clustering
-- CATATAN: Ganti PROJECT_ID dan DATASET_NAME dengan nilai yang sesuai

-- Step 1: Backup data lama (jika tabel sudah ada)
CREATE OR REPLACE TABLE `PROJECT_ID.DATASET_NAME.activity_plans_backup` AS
SELECT * FROM `PROJECT_ID.DATASET_NAME.activity_plans`;

-- Step 2: Drop tabel lama
DROP TABLE IF EXISTS `PROJECT_ID.DATASET_NAME.activity_plans`;

-- Step 3: Create tabel baru dengan Partition dan Clustering
CREATE TABLE `PROJECT_ID.DATASET_NAME.activity_plans` (
  id STRING,
  plan_no STRING,
  sales_internal_id STRING,
  sales_name STRING,
  customer_id STRING,
  customer_name STRING,
  plan_date DATE,
  tujuan STRING,
  keterangan_tambahan STRING,
  status STRING,
  result STRING,
  result_location_lat FLOAT64,
  result_location_lng FLOAT64,
  result_location_accuracy FLOAT64,
  result_location_distance FLOAT64,
  result_location_timestamp DATETIME,
  result_saved_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME,
  deleted_at DATETIME
)
PARTITION BY plan_date
CLUSTER BY sales_internal_id, customer_id, status
OPTIONS(
  description="Tabel Activity Plans dengan Partition dan Clustering",
  require_partition_filter=FALSE
);

-- Step 4: Restore data dari backup (jika ada data lama)
INSERT INTO `PROJECT_ID.DATASET_NAME.activity_plans`
SELECT * FROM `PROJECT_ID.DATASET_NAME.activity_plans_backup`;

-- Step 5: Verify data
SELECT COUNT(*) as total_records FROM `PROJECT_ID.DATASET_NAME.activity_plans`;

-- Step 6: Check partition dan clustering info
SELECT 
  table_name,
  partition_field,
  clustering_ordinal_position,
  clustering_field_name
FROM `PROJECT_ID.DATASET_NAME.INFORMATION_SCHEMA.TABLE_STORAGE`
WHERE table_name = 'activity_plans';

-- Optional: Drop backup table setelah memastikan data lengkap
-- DROP TABLE `PROJECT_ID.DATASET_NAME.activity_plans_backup`;
