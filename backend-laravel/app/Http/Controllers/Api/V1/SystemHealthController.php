<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\SystemHealthService;
use Illuminate\Http\JsonResponse;

class SystemHealthController extends Controller
{
    public function __construct(
        private readonly SystemHealthService $systemHealthService
    ) {}

    /**
     * Get real-time system and microservice health status.
     */
    public function index(): JsonResponse
    {
        $health = $this->systemHealthService->getHealthStatus();

        return response()->json([
            'success' => true,
            'data' => $health,
        ]);
    }
}
