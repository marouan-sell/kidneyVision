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
        ->middleware('throttle:10,1')
        ->name('auth.register');

    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1')
        ->name('login');

    Route::post('/password/email', [\App\Http\Controllers\Api\V1\PasswordResetController::class, 'sendResetLinkEmail'])
        ->middleware('throttle:5,1')
        ->name('password.email');

    Route::post('/password/reset', [\App\Http\Controllers\Api\V1\PasswordResetController::class, 'reset'])
        ->middleware('throttle:5,1')
        ->name('password.reset');
});

Route::post('/guest-predict', [\App\Http\Controllers\Api\V1\GuestAnalysisController::class, 'predict'])
    ->middleware('throttle:20,1')
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

    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])
        ->name('profile.avatar.update');

    Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar'])
        ->name('profile.avatar.delete');

    Route::get('/profile/signature', [ProfileController::class, 'streamSignature'])
        ->name('profile.signature.stream');

    Route::post('/profile/signature', [ProfileController::class, 'updateSignature'])
        ->name('profile.signature.update');

    Route::delete('/profile/signature', [ProfileController::class, 'deleteSignature'])
        ->name('profile.signature.delete');

    Route::post('/profile/password', [ProfileController::class, 'updatePassword'])
        ->name('profile.password');

    Route::post('/profile/revoke-sessions', [ProfileController::class, 'revokeSessions'])
        ->name('profile.revoke-sessions');

    // Optional Two-Factor Authentication (MFA)
    Route::get('/profile/mfa', [\App\Http\Controllers\Api\V1\MfaController::class, 'status'])
        ->name('profile.mfa.status');

    Route::post('/profile/mfa/setup', [\App\Http\Controllers\Api\V1\MfaController::class, 'setup'])
        ->middleware('throttle:5,1')
        ->name('profile.mfa.setup');

    Route::post('/profile/mfa/confirm', [\App\Http\Controllers\Api\V1\MfaController::class, 'confirm'])
        ->middleware('throttle:5,1')
        ->name('profile.mfa.confirm');

    Route::post('/profile/mfa/disable', [\App\Http\Controllers\Api\V1\MfaController::class, 'disable'])
        ->middleware('throttle:5,1')
        ->name('profile.mfa.disable');


    // Patients & Follow-up Center
    Route::get('/patients', [\App\Http\Controllers\Api\V1\PatientController::class, 'index'])
        ->name('patients.index');

    Route::get('/patients/list', [\App\Http\Controllers\Api\V1\PatientController::class, 'listAll'])
        ->name('patients.list');

    Route::get('/patients/stats', [\App\Http\Controllers\Api\V1\PatientController::class, 'stats'])
        ->name('patients.stats');

    Route::get('/patients/next-id', [\App\Http\Controllers\Api\V1\PatientController::class, 'nextId'])
        ->name('patients.nextId');

    Route::post('/patients', [\App\Http\Controllers\Api\V1\PatientController::class, 'store'])
        ->name('patients.store');

    Route::get('/patients/{patient_id}', [\App\Http\Controllers\Api\V1\PatientController::class, 'show'])
        ->name('patients.show');

    Route::put('/patients/{patient_id}', [\App\Http\Controllers\Api\V1\PatientController::class, 'update'])
        ->name('patients.update');

    Route::post('/patients/{patient_id}/follow-ups', [\App\Http\Controllers\Api\V1\PatientController::class, 'scheduleFollowUp'])
        ->name('patients.followUps.store');

    Route::put('/patients/{patient_id}/follow-ups/{follow_up_id}', [\App\Http\Controllers\Api\V1\PatientController::class, 'updateFollowUp'])
        ->where('follow_up_id', '[0-9]+')
        ->name('patients.followUps.update');

    Route::delete('/patients/{patient_id}/follow-ups/{follow_up_id}', [\App\Http\Controllers\Api\V1\PatientController::class, 'deleteFollowUp'])
        ->where('follow_up_id', '[0-9]+')
        ->name('patients.followUps.destroy');

    Route::get('/patients/{patient_id}/compare', [\App\Http\Controllers\Api\V1\PatientController::class, 'compareScans'])
        ->name('patients.compare');

    Route::get('/patients/{patient_id}/history/pdf', [\App\Http\Controllers\Api\V1\PatientController::class, 'downloadHistoryPdf'])
        ->name('patients.history.pdf');

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
