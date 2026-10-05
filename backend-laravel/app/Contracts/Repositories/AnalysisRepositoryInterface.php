<?php

declare(strict_types=1);

namespace App\Contracts\Repositories;

use App\Models\Analysis;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface AnalysisRepositoryInterface
{
    /**
     * Find an analysis by ID.
     */
    public function findById(int $id): ?Analysis;

    /**
     * Find all analyses for a specific user (paginated).
     */
    public function findByUser(int $userId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Create a new analysis.
     */
    public function create(array $data): Analysis;

    /**
     * Update an existing analysis.
     */
    public function update(Analysis $analysis, array $data): Analysis;

    /**
     * Soft delete an analysis.
     */
    public function delete(Analysis $analysis): bool;

    /**
     * Get aggregated statistics for a user.
     */
    public function getStatsByUser(int $userId): array;

    /**
     * Get global statistics.
     */
    public function getGlobalStats(): array;

    /**
     * Get recent analyses for a user.
     */
    public function getRecentByUser(int $userId, int $limit = 5): Collection;

    /**
     * Get monthly scan aggregations for a user.
     */
    public function getMonthlyScansByUser(int $userId): array;
}
