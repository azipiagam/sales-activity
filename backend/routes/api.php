<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ActivityPlanController;
use App\Http\Controllers\CheckInController;
use App\Http\Controllers\GeocodeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::get('/geocode', [GeocodeController::class, 'geocode']);
Route::get('/reverse-geocode', [GeocodeController::class, 'reverseGeocode']);

// Public test route
Route::get('/test', function () {
    return response()->json(['message' => 'API is working', 'timestamp' => now()]);
});

// Protected routes (butuh token)
Route::middleware('auth.sales')->group(function () {


    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
    Route::get('/dashboard/state-stats', [DashboardController::class, 'getStateStats']);
    Route::get('/dashboard/customer-visits', [DashboardController::class, 'getCustomerVisits']);

    // Customer search autocomplete
    Route::get('/customers/search', [CustomerController::class, 'search']);

    // Check-in
    Route::post('/check-in', [CheckInController::class, 'checkIn']);

    // Activity Plans - urutan PENTING!
    Route::get('activity-plans/all', [ActivityPlanController::class, 'getAllPlans']);
    Route::get('/activity-plans', [ActivityPlanController::class, 'index']);
    Route::get('/activity-plans/{id}/check-location', [ActivityPlanController::class, 'checkLocation']);
    Route::post('/activity-plans', [ActivityPlanController::class, 'store']);
    Route::put('/activity-plans/{id}/done', [ActivityPlanController::class, 'markAsDone']);
    Route::put('/activity-plans/{id}/reschedule', [ActivityPlanController::class, 'reschedule']);
    Route::delete('/activity-plans/{id}', [ActivityPlanController::class, 'destroy']);

    // Profile
    Route::put('/auth/change-profile', [ProfileController::class, 'changeProfile']);
    });