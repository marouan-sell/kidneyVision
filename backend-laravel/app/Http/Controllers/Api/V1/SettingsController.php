<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class SettingsController extends Controller
{
    public function __construct(
        private readonly SettingsService $settingsService
    ) {}

    /**
     * Get all active system and clinical settings.
     */
    public function index(Request $request): JsonResponse
    {
        $settings = $this->settingsService->getSettings($request->user()?->id);

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Update clinical and system settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ai_confidence_threshold' => 'sometimes|integer|min:50|max:95',
            'alert_kidney_stone' => 'sometimes|boolean',
            'alert_low_confidence' => 'sometimes|boolean',
            'alert_system_errors' => 'sometimes|boolean',
            'demo_mode' => 'sometimes|boolean',
            'audit_logging_enabled' => 'sometimes|boolean',
            'session_timeout_minutes' => 'sometimes|integer|min:5|max:1440',
            'auto_logout_enabled' => 'sometimes|boolean',
            'data_retention_days' => 'sometimes|integer|min:30|max:3650',
        ]);

        try {
            $updated = $this->settingsService->updateSettings($validated, $request->user());

            return response()->json([
                'success' => true,
                'message' => 'Settings updated successfully.',
                'data' => $updated,
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
