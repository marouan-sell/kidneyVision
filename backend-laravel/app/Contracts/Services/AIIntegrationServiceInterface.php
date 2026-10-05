<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\DTOs\PredictionResultDTO;

interface AIIntegrationServiceInterface
{
    /**
     * Send an image to the AI service for prediction.
     */
    public function predict(string $imagePath): PredictionResultDTO;

    /**
     * Check if the AI service is healthy.
     */
    public function healthCheck(): bool;
}
