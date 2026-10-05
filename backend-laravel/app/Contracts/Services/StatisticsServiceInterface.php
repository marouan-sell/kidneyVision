<?php

declare(strict_types=1);

namespace App\Contracts\Services;

interface StatisticsServiceInterface
{
    /**
     * Get statistics for a specific user.
     */
    public function getUserStatistics(int $userId): array;

    /**
     * Get global platform statistics.
     */
    public function getGlobalStatistics(): array;
}
