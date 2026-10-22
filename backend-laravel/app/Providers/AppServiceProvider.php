<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Patient::class, \App\Policies\PatientPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Analysis::class, \App\Policies\AnalysisPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Report::class, \App\Policies\ReportPolicy::class);

        \Illuminate\Auth\Notifications\ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
            $encodedEmail = urlencode((string) $notifiable->getEmailForPasswordReset());
            return "{$frontendUrl}/reset-password?token={$token}&email={$encodedEmail}";
        });
    }
}
