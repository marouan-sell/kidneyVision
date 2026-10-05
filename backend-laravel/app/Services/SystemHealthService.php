<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SystemHealthService
{
    /**
     * Check comprehensive health of all system components.
     *
     * @return array<string, mixed>
     */
    public function getHealthStatus(): array
    {
        $dbStatus = $this->checkDatabase();
        $aiStatus = $this->checkAIService();

        $allHealthy = $dbStatus['connected'] && $aiStatus['connected'] && $aiStatus['model_loaded'];

        return [
            'status' => $allHealthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toISOString(),
            'services' => [
                'laravel_api' => [
                    'name' => 'Laravel API',
                    'status' => 'online',
                    'version' => app()->version(),
                    'php_version' => PHP_VERSION,
                    'environment' => config('app.env'),
                ],
                'database' => [
                    'name' => 'Database',
                    'status' => $dbStatus['connected'] ? 'connected' : 'offline',
                    'driver' => config('database.default'),
                    'error' => $dbStatus['error'] ?? null,
                ],
                'ai_service' => [
                    'name' => 'AI / Flask Service',
                    'status' => $aiStatus['connected'] ? 'connected' : 'offline',
                    'endpoint' => config('ai.flask_base_url'),
                    'model_status' => $aiStatus['model_loaded'] ? 'loaded' : 'unloaded',
                    'model_version' => $aiStatus['model_version'] ?? 'Unknown',
                    'error' => $aiStatus['error'] ?? null,
                ],
            ],
            'system_info' => [
                'application' => config('app.name', 'KidneyVision AI'),
                'version' => '3.0.0-sota',
                'environment' => config('app.env'),
                'frontend' => 'React 18 + Vite + TypeScript',
                'backend' => 'Laravel ' . app()->version(),
                'ai_runtime' => 'Flask + PyTorch 2.14 / TorchVision',
                'model_name' => 'ConvNeXt-Tiny (4-Class SOTA) & MobileNetV3 Gatekeeper',
                'api_endpoint' => url('/api'),
            ],
        ];
    }

    /**
     * Check database connectivity.
     */
    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            return [
                'connected' => true,
            ];
        } catch (\Throwable $e) {
            Log::error('Database health check failed', ['error' => $e->getMessage()]);
            return [
                'connected' => false,
                'error' => 'Database connection failed',
            ];
        }
    }

    /**
     * Check Flask AI microservice status.
     */
    private function checkAIService(): array
    {
        $baseUrl = config('ai.flask_base_url', 'http://127.0.0.1:5000');
        $healthEndpoint = config('ai.health_endpoint', '/health');

        try {
            $response = Http::timeout(4)->get("{$baseUrl}{$healthEndpoint}");

            if ($response->successful()) {
                $data = $response->json();
                $master = $data['models']['master_model'] ?? 'ConvNeXt-Tiny (4-Class)';
                $gate = $data['models']['gatekeeper_model'] ?? 'MobileNetV3 Gate';
                return [
                    'connected' => true,
                    'model_loaded' => ($data['status'] ?? '') === 'healthy',
                    'model_version' => "{$master} + {$gate}",
                ];
            }

            return [
                'connected' => true,
                'model_loaded' => false,
                'error' => 'Model reported unhealthy status',
            ];
        } catch (\Throwable $e) {
            return [
                'connected' => false,
                'model_loaded' => false,
                'error' => 'AI service unreachable at ' . $baseUrl,
            ];
        }
    }
}
