# BigQuery Streaming Buffer & Activity Plan Service

## Problem

BigQuery memiliki batasan pada **streaming buffer**:
- Data yang di-insert melalui streaming API tidak langsung bisa di-UPDATE atau DELETE
- Error: `UPDATE or DELETE statement would affect rows in the streaming buffer, which is not supported`
- Waktu waiting: **30 menit - beberapa jam**

## Solution

### Architecture

```
Status Change Request
        ↓
    INSERT new row
   (with latest status + updated_at)
        ↓
    Old row stays
   (doesn't get deleted immediately)
        ↓
    Query uses ROW_NUMBER()
   (picks latest version only)
        ↓
    Frontend sees only latest status ✅
        ↓
   (30+ minutes later)
        ↓
   Cleanup job runs DELETE
   (removes old versions when buffer is flushed)
```

### How It Works

**Example: Reschedule tanggal 29 ke tanggal 30**

#### Step 1: Awal
```
Database:
  id: 4bc31268-725e...
  plan_date: 2025-12-29
  status: in progress
  updated_at: 2025-12-29 10:00:00
```

#### Step 2: Reschedule (INSERT new row, don't delete old)
```
Database:
  Row 1 (lama):
    id: 4bc31268-725e...
    plan_date: 2025-12-29
    status: in progress
    updated_at: 2025-12-29 10:00:00
  
  Row 2 (baru):  ← New row inserted
    id: 4bc31268-725e...
    plan_date: 2025-12-30
    status: rescheduled
    updated_at: 2025-12-29 11:30:00
```

#### Step 3: Query untuk tanggal 29
```sql
WITH latest_versions AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC) as rn
    FROM activity_plans
)
SELECT * FROM latest_versions
WHERE rn = 1          -- Hanya Row 2 (latest updated_at)
AND plan_date = '2025-12-29'  -- Row 2 plan_date = 2025-12-30 ❌
AND status NOT IN ('deleted')
```
**Result:** Kosong (Row 2 tidak match tanggal 29)

#### Step 4: Query untuk tanggal 30
```sql
SELECT * FROM latest_versions
WHERE rn = 1          -- Hanya Row 2 (latest updated_at)
AND plan_date = '2025-12-30'  -- Row 2 plan_date = 2025-12-30 ✅
AND status NOT IN ('deleted')
```
**Result:** Row 2 ditampilkan dengan status 'rescheduled'

#### Step 5: Cleanup (30+ minutes later)
```
DELETE FROM activity_plans
WHERE id = '4bc31268-725e...'
AND updated_at < '2025-12-29 11:30:00'
```
Sekarang Row 1 bisa didelete karena streaming buffer sudah di-flush.

---

## Implementation Details

### Methods Using This Pattern

1. **`reschedule($planId, $newDate)`** - Status berubah jadi 'rescheduled'
2. **`markAsDone($planId, $result, ...)`** - Status berubah jadi 'done'
3. **`delete($planId)`** - Status berubah jadi 'deleted'
4. **`markMissedPlans()`** - Status berubah jadi 'missed'

### Query Methods (Handle Duplicates)

1. **`getByDateAndSales($salesInternalId, $date)`**
   - Ambil latest version per ID
   - Filter by plan_date
   - Exclude status 'deleted'

2. **`getAllBySales($salesInternalId)`**
   - Ambil latest version per ID
   - Exclude status 'deleted'

### Cleanup

- **`scheduleCleanupDuplicates($planId)`** - Schedule cleanup (akan retry jika streaming buffer masih aktif)
- **`cleanupDuplicates($planId)`** - Actual cleanup logic

---

## Production Recommendations

### Option 1: Scheduled Job (Recommended)

```php
// app/Console/Commands/CleanupActivityPlanDuplicates.php
public function handle()
{
    // Jalankan setiap 1 jam
    $service = new ActivityPlanService();
    
    // Get all plans yang punya multiple versions
    $planIds = DB::select("
        SELECT DISTINCT id 
        FROM activity_plans
        WHERE updated_at < NOW() - INTERVAL 35 MINUTE
        GROUP BY id HAVING COUNT(*) > 1
    ");
    
    foreach ($planIds as $plan) {
        $service->cleanupDuplicates($plan->id);
    }
}
```

### Option 2: Queue Job (For Large Scale)

```php
// In reschedule(), delete(), etc:
dispatch(new CleanupActivityPlanDuplicates($planId))
    ->delay(now()->addMinutes(35));
```

### Option 3: Background Task with Retry

```php
// Create cleanup job in database/queue
// Run with Laravel Horizon or similar
// Automatically retry if UPDATE fails
```

---

## Monitoring

Check for errors in logs:
```
Could not cleanup duplicates for plan {planId}: UPDATE or DELETE...
```

When you see this, it means:
- ✅ Data masih di streaming buffer
- ✅ Will be retried by cleanup job
- ✅ Frontend query masih bekerja dengan ROW_NUMBER()

---

## Waitlist Times

| Situation | Time |
|-----------|------|
| Immediately after insert | 30 min - 1 hour |
| Peak hours | 1 - 2 hours |
| Off-peak | 30 minutes |
| Manual DELETE after wait | Instant ✅ |

**Best Practice:** Schedule cleanup untuk 35+ minutes setelah perubahan.
