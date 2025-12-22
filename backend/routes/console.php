<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Services\ActivityPlanService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


Schedule::call(function () {
    app(ActivityPlanService::class)->markMissedPlans();
})->daily();

// Atau kalau mau pake command class
Schedule::command('plans:mark-missed')->daily();