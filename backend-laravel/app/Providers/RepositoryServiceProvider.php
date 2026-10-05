<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Contracts\Repositories\AnalysisRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use App\Contracts\Services\AnalysisServiceInterface;
use App\Contracts\Services\AIIntegrationServiceInterface;
use App\Contracts\Services\StatisticsServiceInterface;
use App\Repositories\AnalysisRepository;
use App\Repositories\UserRepository;
use App\Services\AnalysisService;
use App\Services\AIIntegrationService;
use App\Services\StatisticsService;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * All of the container bindings that should be registered.
     *
     * @var array<string, string>
     */
    public array $bindings = [
        AnalysisRepositoryInterface::class => AnalysisRepository::class,
        UserRepositoryInterface::class => UserRepository::class,
        AnalysisServiceInterface::class => AnalysisService::class,
        AIIntegrationServiceInterface::class => AIIntegrationService::class,
        StatisticsServiceInterface::class => StatisticsService::class,
    ];

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
        //
    }
}
