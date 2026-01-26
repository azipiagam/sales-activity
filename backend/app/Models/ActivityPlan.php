<?php
// app/Models/ActivityPlan.php

namespace App\Models;

class ActivityPlan
{
    protected $fillable = [
        'id', 'plan_no', 'sales_id', 'customer_id', 'customer_name',
        'plan_date', 'tujuan', 'keterangan_tambahan', 'status',
        'result', 'result_location_lat', 'result_location_lng',
        'result_location_accuracy', 'result_location_timestamp', 'user_photo'
    ];
}