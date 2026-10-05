<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use InvalidArgumentException;

class SettingsService
{
    public function __construct(
        private readonly AuditLogService $auditLogService
    ) {}

    /**
     * Default settings dictionary.
     */
    private const DEFAULTS = [
        'ai_confidence_threshold' => 85,
        'alert_kidney_stone' => true,
        'alert_low_confidence' => true,
        'alert_system_errors' => true,
        'demo_mode' => false,
        'audit_logging_enabled' => true,
        'session_timeout_minutes' => 30,
        'auto_logout_enabled' => true,
        'data_retention_days' => 365,
    ];

    /**
     * Get all resolved settings.
     *
     * @return array<string, mixed>
     */
    public function getSettings(?int $userId = null): array
    {
        $settings = self::DEFAULTS;

        // Fetch global and user-specific settings
        $query = Setting::query();
        if ($userId !== null) {
            $query->where(function ($q) use ($userId) {
                $q->whereNull('user_id')->orWhere('user_id', $userId);
            });
        } else {
            $query->whereNull('user_id');
        }

        $records = $query->get();

        foreach ($records as $record) {
            $settings[$record->key] = $record->value;
        }

        // Safety override: if running in production, ensure demo_mode is strictly false unless explicitly allowed
        if (app()->environment('production') && !config('app.allow_demo_in_prod', false)) {
            $settings['demo_mode'] = false;
        }

        return $settings;
    }

    /**
     * Update settings with validation.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function updateSettings(array $data, ?User $user = null): array
    {
        $userId = $user?->id;
        $allowedKeys = array_keys(self::DEFAULTS);
        $changed = [];

        foreach ($data as $key => $value) {
            if (!in_array($key, $allowedKeys, true)) {
                continue;
            }

            // Clinical validation: Confidence threshold must be 50-95%
            if ($key === 'ai_confidence_threshold') {
                $val = (int) $value;
                if ($val < 50 || $val > 95) {
                    throw new InvalidArgumentException('AI Confidence Threshold must be an integer between 50% and 95%.');
                }
                $value = $val;
            }

            // Safety rule: Demo Mode cannot be enabled in production
            if ($key === 'demo_mode' && (bool) $value === true && app()->environment('production')) {
                if (!config('app.allow_demo_in_prod', false)) {
                    throw new InvalidArgumentException('Demo / Simulation Mode is strictly disabled in production environments.');
                }
            }

            // Session timeout validation (15 to 1440 minutes)
            if ($key === 'session_timeout_minutes') {
                $val = (int) $value;
                if ($val < 5 || $val > 1440) {
                    throw new InvalidArgumentException('Session timeout must be between 5 and 1440 minutes.');
                }
                $value = $val;
            }

            // Determine data type
            $type = is_bool($value) ? 'boolean' : (is_int($value) ? 'integer' : 'string');

            // Persist setting
            Setting::updateOrCreate(
                [
                    'key' => $key,
                    'user_id' => null, // System-wide for clinical consistency
                ],
                [
                    'value' => $value,
                    'type' => $type,
                    'updated_by' => $userId,
                ]
            );

            $changed[$key] = $value;
        }

        // Record audit event
        if (!empty($changed)) {
            $this->auditLogService->log(
                action: 'settings_changed',
                resourceType: 'Setting',
                metadata: [
                    'updated_keys' => array_keys($changed),
                    'new_values' => $changed,
                ],
                user: $user
            );
        }

        return $this->getSettings($userId);
    }
}
