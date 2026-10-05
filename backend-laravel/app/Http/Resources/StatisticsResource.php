<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StatisticsResource extends JsonResource
{
    /**
     * Remove the data wrapper.
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'success' => true,
            'data' => [
                'total_analyses' => $this->resource['total_analyses'],
                'completed' => $this->resource['completed'],
                'confirmed' => $this->resource['confirmed'] ?? 0,
                'pending' => $this->resource['pending'],
                'review' => $this->resource['review'] ?? 0,
                'flagged' => $this->resource['flagged'] ?? 0,
                'processing' => $this->resource['processing'],
                'failed' => $this->resource['failed'],
                'normal_count' => $this->resource['normal_count'] ?? 0,
                'stone_count' => $this->resource['stone_count'] ?? 0,
                'cyst_count' => $this->resource['cyst_count'] ?? 0,
                'tumor_count' => $this->resource['tumor_count'] ?? 0,
                'current_month_count' => $this->resource['current_month_count'] ?? 0,
                'last_month_count' => $this->resource['last_month_count'] ?? 0,
                'month_growth_percentage' => $this->resource['month_growth_percentage'] ?? null,
                'success_rate' => $this->resource['success_rate'],
                'average_confidence' => $this->resource['average_confidence'],
                'condition_distribution' => $this->resource['condition_distribution'],
                'scans_by_month' => $this->resource['scans_by_month'] ?? [],
                'recent_analyses' => AnalysisResource::collection($this->resource['recent_analyses']),
            ],
        ];
    }
}
