<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Contracts\Repositories\AnalysisRepositoryInterface;
use App\Enums\AnalysisStatus;
use App\Models\Analysis;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AnalysisRepository implements AnalysisRepositoryInterface
{
    public function __construct(
        private readonly Analysis $model,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function findById(int $id): ?Analysis
    {
        return $this->model
            ->with('report')
            ->find($id);
    }

    /**
     * {@inheritDoc}
     */
    public function findByUser(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->forUser($userId)
            ->with('report')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * {@inheritDoc}
     */
    public function create(array $data): Analysis
    {
        return $this->model->create($data);
    }

    /**
     * {@inheritDoc}
     */
    public function update(Analysis $analysis, array $data): Analysis
    {
        $analysis->update($data);

        return $analysis->fresh(['report']);
    }

    /**
     * {@inheritDoc}
     */
    public function delete(Analysis $analysis): bool
    {
        return (bool) $analysis->delete();
    }

    /**
     * {@inheritDoc}
     */
    public function getStatsByUser(int $userId): array
    {
        $analyses = $this->model->forUser($userId);
        $total = (clone $analyses)->count();

        // Normal results count (processed analyses)
        $normalCount = (clone $analyses)
            ->whereNotNull('prediction')
            ->whereRaw("LOWER(prediction) = 'normal'")
            ->count();

        // Stone results count (processed analyses)
        $stoneCount = (clone $analyses)
            ->whereNotNull('prediction')
            ->whereRaw("LOWER(prediction) = 'stone'")
            ->count();

        // Cyst results count
        $cystCount = (clone $analyses)
            ->whereNotNull('prediction')
            ->whereRaw("LOWER(prediction) = 'cyst'")
            ->count();

        // Tumor results count
        $tumorCount = (clone $analyses)
            ->whereNotNull('prediction')
            ->whereRaw("LOWER(prediction) = 'tumor'")
            ->count();

        $completedCount = (clone $analyses)->whereIn('status', [AnalysisStatus::COMPLETED, AnalysisStatus::CONFIRMED])->count();
        $confirmedCount = (clone $analyses)->where('status', AnalysisStatus::CONFIRMED)->count();
        $reviewCount = (clone $analyses)->where('status', AnalysisStatus::REVIEW)->count();
        $flaggedCount = (clone $analyses)->where('status', AnalysisStatus::FLAGGED)->count();
        $pendingCount = (clone $analyses)->where('status', AnalysisStatus::PENDING)->count();
        $processingCount = (clone $analyses)->where('status', AnalysisStatus::PROCESSING)->count();
        $failedCount = (clone $analyses)->where('status', AnalysisStatus::FAILED)->count();

        // Average confidence across all analyzed scans
        $avgConfidence = (clone $analyses)->whereNotNull('confidence')->avg('confidence');

        // Current month and previous month counts for real trend calculation
        $startOfCurrentMonth = Carbon::now()->startOfMonth();
        $endOfCurrentMonth = Carbon::now()->endOfMonth();
        $startOfLastMonth = Carbon::now()->subMonth()->startOfMonth();
        $endOfLastMonth = Carbon::now()->subMonth()->endOfMonth();

        $currentMonthCount = (clone $analyses)->whereBetween('created_at', [$startOfCurrentMonth, $endOfCurrentMonth])->count();
        $lastMonthCount = (clone $analyses)->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->count();

        $monthGrowthPercentage = null;
        if ($lastMonthCount > 0) {
            $monthGrowthPercentage = round((($currentMonthCount - $lastMonthCount) / $lastMonthCount) * 100, 1);
        } elseif ($currentMonthCount > 0) {
            $monthGrowthPercentage = 100.0;
        }

        return [
            'total' => $total,
            'completed' => $completedCount,
            'confirmed' => $confirmedCount,
            'review' => $reviewCount,
            'flagged' => $flaggedCount,
            'pending' => $pendingCount,
            'processing' => $processingCount,
            'failed' => $failedCount,
            'normal_count' => $normalCount,
            'stone_count' => $stoneCount,
            'cyst_count' => $cystCount,
            'tumor_count' => $tumorCount,
            'current_month_count' => $currentMonthCount,
            'last_month_count' => $lastMonthCount,
            'month_growth_percentage' => $monthGrowthPercentage,
            'condition_distribution' => $this->getConditionDistribution($userId),
            'average_confidence' => $avgConfidence,
            'scans_by_month' => $this->getMonthlyScansByUser($userId),
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function getGlobalStats(): array
    {
        return [
            'total_analyses' => $this->model->count(),
            'total_completed' => $this->model->completed()->count(),
            'total_users' => $this->model->distinct('user_id')->count('user_id'),
            'average_confidence' => $this->model->completed()->avg('confidence'),
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function getRecentByUser(int $userId, int $limit = 5): Collection
    {
        return $this->model
            ->forUser($userId)
            ->with('report')
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * {@inheritDoc}
     */
    public function getMonthlyScansByUser(int $userId): array
    {
        $total = $this->model->forUser($userId)->count();
        if ($total === 0) {
            return [];
        }

        $driver = DB::connection()->getDriverName();
        $monthExpr = match ($driver) {
            'sqlite' => "strftime('%Y-%m', created_at)",
            'pgsql' => "to_char(created_at, 'YYYY-MM')",
            default => "DATE_FORMAT(created_at, '%Y-%m')",
        };

        $rows = $this->model
            ->forUser($userId)
            ->selectRaw("
                {$monthExpr} as month_key,
                COUNT(*) as total,
                SUM(CASE WHEN LOWER(prediction) = 'normal' THEN 1 ELSE 0 END) as normals,
                SUM(CASE WHEN LOWER(prediction) IN ('stone', 'cyst', 'tumor') THEN 1 ELSE 0 END) as anomalies
            ")
            ->groupBy('month_key')
            ->orderBy('month_key', 'asc')
            ->get();

        return $rows->map(function ($row) {
            $carbonDate = Carbon::createFromFormat('Y-m', $row->month_key);
            return [
                'month_key' => $row->month_key,
                'month' => $carbonDate ? $carbonDate->format('M Y') : $row->month_key,
                'short_month' => $carbonDate ? $carbonDate->format('M') : $row->month_key,
                'total' => (int) $row->total,
                'normals' => (int) $row->normals,
                'anomalies' => (int) $row->anomalies,
            ];
        })->values()->toArray();
    }

    /**
     * Get condition distribution for a user.
     */
    private function getConditionDistribution(int $userId): array
    {
        return $this->model
            ->forUser($userId)
            ->whereNotNull('prediction')
            ->selectRaw('prediction, COUNT(*) as count')
            ->groupBy('prediction')
            ->pluck('count', 'prediction')
            ->toArray();
    }
}
