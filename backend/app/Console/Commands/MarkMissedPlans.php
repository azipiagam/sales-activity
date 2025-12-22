<?php
// app/Console/Commands/MarkMissedPlans.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ActivityPlanService;

class MarkMissedPlans extends Command
{
    protected $signature = 'plans:mark-missed';
    protected $description = 'Mark pending plans as missed if date has passed';

    public function handle(ActivityPlanService $service)
    {
        $service->markMissedPlans();
        $this->info('Missed plans marked successfully');
    }
}