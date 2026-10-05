<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StatisticsResource;
use App\Contracts\Services\StatisticsServiceInterface;
use Illuminate\Http\Request;

class StatisticsController extends Controller
{
    public function __construct(
        private readonly StatisticsServiceInterface $statisticsService,
    ) {}

    /**
     * Get dashboard statistics for the authenticated user.
     *
     * GET /api/statistics
     */
    public function index(Request $request): StatisticsResource
    {
        $stats = $this->statisticsService->getUserStatistics(
            (int) $request->user()->id,
        );

        return new StatisticsResource($stats);
    }
}
