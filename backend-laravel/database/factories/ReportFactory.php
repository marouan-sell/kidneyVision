<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Analysis;
use App\Models\Report;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Report>
 */
class ReportFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = Report::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'analysis_id' => Analysis::factory(),
            'title' => 'Kidney Analysis Report - ' . $this->faker->date(),
            'summary' => $this->faker->paragraph(3),
            'recommendations' => [
                $this->faker->sentence(),
                $this->faker->sentence(),
                $this->faker->sentence(),
            ],
            'metadata' => [
                'generated_at' => now()->toISOString(),
                'model_version' => '1.0.0',
                'report_version' => '1.0',
            ],
        ];
    }
}
