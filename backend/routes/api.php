<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ActivityPlanController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (butuh token)
Route::middleware('auth.sales')->group(function () {
    
    // Customer search autocomplete - PINDAHIN KE PALING ATAS
    Route::get('/customers/search', [CustomerController::class, 'search']);
    
    // Activity Plans - urutan PENTING!
    Route::get('activity-plans/all', [ActivityPlanController::class, 'getAllPlans']);
    Route::get('/activity-plans', [ActivityPlanController::class, 'index']);
    Route::get('/activity-plans/{id}/check-location', [ActivityPlanController::class, 'checkLocation']);
    Route::post('/activity-plans', [ActivityPlanController::class, 'store']);
    Route::put('/activity-plans/{id}/done', [ActivityPlanController::class, 'markAsDone']);
    Route::put('/activity-plans/{id}/reschedule', [ActivityPlanController::class, 'reschedule']);
    Route::delete('/activity-plans/{id}', [ActivityPlanController::class, 'destroy']);
});