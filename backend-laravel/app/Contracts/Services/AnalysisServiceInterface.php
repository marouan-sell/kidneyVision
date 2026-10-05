<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\DTOs\AnalysisDTO;
use App\Http\Resources\AnalysisResource;
use App\Models\Analysis;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AnalysisServiceInterface
{
    /**
     * Create a new analysis and trigger AI prediction.
     */
    public function createAnalysis(AnalysisDTO $dto): Analysis;

    /**
     * Get a single analysis by ID for a specific user.
     */
    public function getAnalysis(int $id, int $userId): Analysis;

    /**
     * Get paginated analyses for a user.
     */
    public function getUserAnalyses(int $userId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Delete an analysis (soft delete).
     */
    public function deleteAnalysis(int $id, int $userId): bool;

    /**
     * Update an analysis and patient metadata for a specific user.
     */
    public function updateAnalysis(int $id, int $userId, array $data): Analysis;

    /**
     * Ensure a diagnostic report exists for an analysis, generating one if missing.
     */
    public function ensureReportExists(Analysis $analysis): \App\Models\Report;

    /**
     * Sign and confirm an analysis finding by clinician.
     */
    public function confirmAnalysis(int $id, int $userId, ?string $notes = null): Analysis;

    /**
     * Flag an analysis for specialist triage consultation (e.g. Urology, Oncology).
     */
    public function flagAnalysis(int $id, int $userId, string $department = 'urology', ?string $reason = null): Analysis;
}
