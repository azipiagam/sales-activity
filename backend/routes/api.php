<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ActivityPlanController;
use App\Http\Controllers\GeocodeController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::get('/geocode', [GeocodeController::class, 'geocode']);
Route::get('/reverse-geocode', [GeocodeController::class, 'reverseGeocode']);

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