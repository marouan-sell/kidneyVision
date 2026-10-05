<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Repositories\AnalysisRepositoryInterface;
use App\Contracts\Services\StatisticsServiceInterface;

class StatisticsService implements StatisticsServiceInterface
{
    public function __construct(
        private readonly AnalysisRepositoryInterface $analysisRepository,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function getUserStatistics(int $userId): array
    {
        $stats = $this->analysisRepository->getStatsByUser($userId);
        $recent = $this->analysisRepository->getRecentByUser($userId, 5);

        return [
            'total_analyses' => $stats['total'],
            'completed' => $stats['completed'],
            'confirmed' => $stats['confirmed'] ?? 0,
            'review' => $stats['review'] ?? 0,
            'flagged' => $stats['flagged'] ?? 0,
            'pending' => $stats['pending'],
            'processing' => $stats['processing'],
            'failed' => $stats['failed'],
            'normal_count' => $stats['normal_count'] ?? 0,
            'stone_count' => $stats['stone_count'] ?? 0,
            'cyst_count' => $stats['cyst_count'] ?? 0,
            'tumor_count' => $stats['tumor_count'] ?? 0,
            'current_month_count' => $stats['current_month_count'] ?? 0,
            'last_month_count' => $stats['last_month_count'] ?? 0,
            'month_growth_percentage' => $stats['month_growth_percentage'] ?? null,
            'success_rate' => $stats['total'] > 0
                ? round(($stats['completed'] / $stats['total']) * 100, 2)
                : 0,
            'average_confidence' => $stats['average_confidence'] ? round((float) $stats['average_confidence'], 2) : null,
            'condition_distribution' => $stats['condition_distribution'],
            'scans_by_month' => $stats['scans_by_month'] ?? [],
            'recent_analyses' => $recent,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function getGlobalStatistics(): array
    {
        return $this->analysisRepository->getGlobalStats();
    }
}
