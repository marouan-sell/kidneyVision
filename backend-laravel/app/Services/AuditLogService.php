<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuditLogService
{
    /**
     * Forbidden sensitive keys in metadata to prevent accidental leaks.
     */
    private const FORBIDDEN_KEYS = [
        'password',
        'password_confirmation',
        'current_password',
        'token',
        'access_token',
        'authorization',
        'jwt',
        'secret',
        'image',
        'file',
        'image_base64',
    ];

    /**
     * Record an audit log entry.
     */
    public function log(
        string $action,
        ?string $resourceType = null,
        ?string $resourceId = null,
        ?array $metadata = null,
        ?User $user = null,
        ?Request $request = null
    ): AuditLog {
        $user = $user ?? auth()->user();
        $request = $request ?? request();

        $cleanMetadata = $metadata ? $this->sanitizeMetadata($metadata) : null;

        try {
            return AuditLog::create([
                'user_id' => $user?->id,
                'action' => $action,
                'resource_type' => $resourceType,
                'resource_id' => $resourceId ? (string) $resourceId : null,
                'ip_address' => $request?->ip() ?? '127.0.0.1',
                'user_agent' => $request ? substr($request->userAgent() ?? '', 0, 255) : null,
                'metadata' => $cleanMetadata,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to write audit log entry', [
                'action' => $action,
                'error' => $e->getMessage(),
            ]);

            // Return unpersisted instance fallback so app flow never crashes from logging failure
            return new AuditLog([
                'action' => $action,
                'user_id' => $user?->id,
            ]);
        }
    }

    /**
     * Strip forbidden/sensitive keys and truncate large values.
     */
    private function sanitizeMetadata(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            $lowerKey = strtolower((string) $key);

            // Skip sensitive parameters
            if (in_array($lowerKey, self::FORBIDDEN_KEYS, true)) {
                $sanitized[$key] = '[REDACTED]';
                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeMetadata($value);
            } elseif (is_string($value) && strlen($value) > 500) {
                $sanitized[$key] = substr($value, 0, 500) . '... [TRUNCATED]';
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }
}
