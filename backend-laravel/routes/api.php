<?php

use App\Http\Controllers\Api\V1\AnalysisController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PDFReportController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\StatisticsController;
use App\Http\Controllers\Api\V1\SystemHealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — KidneyVision AI
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api automatically.
|
*/

// ──────────────────────────────────────────────
// Public Routes (no authentication required)
// ──────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])
        ->name('auth.register');

    Route::post('/login', [AuthController::class, 'login'])
        ->name('login');

    Route::post('/password/email', [\App\Http\Controllers\Api\V1\PasswordResetController::class, 'sendResetLinkEmail'])
        ->middleware('throttle:5,1')
        ->name('password.email');

    Route::post('/password/reset', [\App\Http\Controllers\Api\V1\PasswordResetController::class, 'reset'])
        ->name('password.reset');
});

Route::post('/guest-predict', [\App\Http\Controllers\Api\V1\GuestAnalysisController::class, 'predict'])
    ->name('guest.predict');

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
})->name('health');

Route::get('/system/health', [SystemHealthController::class, 'index'])
    ->name('system.health');

// ──────────────────────────────────────────────
// Protected Routes (Sanctum authentication)
// ──────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth & Profile
    Route::post('/auth/logout', [AuthController::class, 'logout'])
        ->name('auth.logout');

    Route::get('/auth/me', [AuthController::class, 'me'])
        ->name('auth.me');

    Route::get('/profile', [ProfileController::class, 'show'])
        ->name('profile.show');

    Route::put('/profile', [ProfileController::class, 'update'])
        ->name('profile.update');

    Route::post('/profile/password', [ProfileController::class, 'updatePassword'])
        ->name('profile.password');

    Route::post('/profile/revoke-sessions', [ProfileController::class, 'revokeSessions'])
        ->name('profile.revoke-sessions');

    // System Settings
    Route::get('/settings', [SettingsController::class, 'index'])
        ->name('settings.index');

    Route::put('/settings', [SettingsController::class, 'update'])
        ->name('settings.update');

    // Audit Logging
    Route::get('/audit-logs', [AuditLogController::class, 'index'])
        ->name('audit-logs.index');

    // Prediction
    Route::post('/predict', [AnalysisController::class, 'predict'])
        ->name('analysis.predict');

    // Analyses CRUD
    Route::get('/analyses', [AnalysisController::class, 'index'])
        ->name('analyses.index');

    Route::get('/analyses/{id}', [AnalysisController::class, 'show'])
        ->where('id', '[0-9]+')
        ->name('analyses.show');

    Route::match(['put', 'patch'], '/analyses/{id}', [AnalysisController::class, 'update'])
        ->where('id', '[0-9]+')
        ->name('analyses.update');

    Route::delete('/analyses/{id}', [AnalysisController::class, 'destroy'])
        ->where('id', '[0-9]+')
        ->name('analyses.destroy');

    Route::post('/analyses/{id}/confirm', [AnalysisController::class, 'confirm'])
        ->where('id', '[0-9]+')
        ->name('analyses.confirm');

    Route::post('/analyses/{id}/flag', [AnalysisController::class, 'flag'])
        ->where('id', '[0-9]+')
        ->name('analyses.flag');

    // Authenticated Image Access
    Route::get('/analyses/{id}/image', [AnalysisController::class, 'image'])
        ->where('id', '[0-9]+')
        ->name('analyses.image');

    // Statistics
    Route::get('/statistics', [StatisticsController::class, 'index'])
        ->name('statistics.index');

    // PDF Report
    Route::get('/analyses/{id}/report/pdf', [PDFReportController::class, 'download'])
        ->where('id', '[0-9]+')
        ->name('analyses.report.pdf');

    Route::get('/analyses/{id}/report/preview', [PDFReportController::class, 'preview'])
        ->where('id', '[0-9]+')
        ->name('analyses.report.preview');
});
