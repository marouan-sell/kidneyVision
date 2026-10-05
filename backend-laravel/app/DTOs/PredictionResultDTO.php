<?php

declare(strict_types=1);

namespace App\DTOs;

final readonly class PredictionResultDTO
{
    public function __construct(
        public string $prediction,
        public float $confidence,
        public array $rawPayload = [],
        public bool $isUncertain = false,
        public ?string $reviewReason = null,
    ) {}

    public static function fromAIResponse(array $response): self
    {
        $confidence = (float) ($response['confidence'] ?? 0.0);
        $isUncertain = (bool) ($response['is_uncertain'] ?? ($confidence < 70.0));
        $reviewReason = $response['review_reason'] ?? ($isUncertain ? 'Detection confidence is below 70%. Clinical review recommended.' : null);

        return new self(
            prediction: $response['prediction'] ?? 'Unknown',
            confidence: $confidence,
            rawPayload: $response,
            isUncertain: $isUncertain,
            reviewReason: $reviewReason,
        );
    }

    /**
     * Create a mock prediction for development.
     */
    public static function mock(): self
    {
        $conditions = ['Normal', 'Stone', 'Cyst', 'Tumor'];
        $prediction = $conditions[array_rand($conditions)];
        $confidence = round(mt_rand(7500, 9950) / 100, 2);
        $isUncertain = $confidence < 75.0;

        return new self(
            prediction: $prediction,
            confidence: $confidence,
            rawPayload: [
                'task' => 'Multi-Pathology Kidney Diagnostic & Gate System',
                'prediction' => $prediction,
                'confidence' => $confidence,
                'is_uncertain' => $isUncertain,
                'class_probabilities' => [
                    'Normal' => $prediction === 'Normal' ? $confidence : round((100 - $confidence) * 0.3, 1),
                    'Stone' => $prediction === 'Stone' ? $confidence : round((100 - $confidence) * 0.3, 1),
                    'Cyst' => $prediction === 'Cyst' ? $confidence : round((100 - $confidence) * 0.2, 1),
                    'Tumor' => $prediction === 'Tumor' ? $confidence : round((100 - $confidence) * 0.2, 1),
                ],
                'model_version' => 'ConvNeXt-Tiny Master 4-Class SOTA + MobileNetV3 Gate',
                'mock' => true,
            ],
            isUncertain: $isUncertain,
            reviewReason: $isUncertain ? 'Borderline confidence in mock triage.' : null,
        );
    }
}
