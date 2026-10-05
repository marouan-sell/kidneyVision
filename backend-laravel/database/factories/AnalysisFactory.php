<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Analysis;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Analysis>
 */
class AnalysisFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = Analysis::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $predictions = ['Normal', 'Stone'];
        $statuses = ['pending', 'processing', 'completed', 'review', 'failed'];

        return [
            'user_id' => User::factory(),
            'image_path' => 'kidney_images/' . $this->faker->uuid() . '.jpg',
            'original_filename' => $this->faker->word() . '_kidney_scan.jpg',
            'prediction' => $this->faker->randomElement($predictions),
            'confidence' => $this->faker->randomFloat(2, 70, 99.99),
            'status' => $this->faker->randomElement($statuses),
            'ai_response_payload' => [
                'task' => 'Kidney Stone Detection',
                'model_version' => '1.0.0',
                'predictions' => [
                    ['class' => 'Normal', 'probability' => $this->faker->randomFloat(4, 0, 1)],
                    ['class' => 'Stone', 'probability' => $this->faker->randomFloat(4, 0, 1)],
                ],
            ],
            'processed_at' => $this->faker->optional(0.7)->dateTimeBetween('-1 month', 'now'),
        ];
    }

    /**
     * Indicate that the analysis is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'prediction' => null,
            'confidence' => null,
            'ai_response_payload' => null,
            'processed_at' => null,
        ]);
    }

    /**
     * Indicate that the analysis is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'processed_at' => now(),
        ]);
    }

    /**
     * Indicate that the analysis has failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'prediction' => null,
            'confidence' => null,
            'processed_at' => now(),
        ]);
    }
}
