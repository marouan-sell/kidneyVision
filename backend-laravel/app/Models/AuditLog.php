<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            $model->created_at = $model->created_at ?? now();
        });

        static::updating(function () {
            throw new \RuntimeException('Audit logs are immutable and cannot be updated.');
        });

        static::deleting(function () {
            throw new \RuntimeException('Audit logs are immutable and cannot be deleted.');
        });
    }

    protected $fillable = [
        'user_id',
        'action',
        'resource_type',
        'resource_id',
        'ip_address',
        'user_agent',
        'metadata',
        'previous_hash',
        'record_hash',
        'created_at',
    ];

    /**
     * Compute a canonical SHA-256 hash for tamper evidence.
     */
    public static function computeHash(
        ?string $previousHash,
        ?int $userId,
        string $action,
        ?string $resourceType,
        ?string $resourceId,
        ?string $ipAddress,
        string $createdAt,
        ?array $metadata
    ): string {
        $canonicalMetadata = '';
        if ($metadata !== null) {
            ksort($metadata);
            $canonicalMetadata = json_encode($metadata, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }

        $payload = implode('|', [
            $previousHash ?? 'GENESIS',
            (string) ($userId ?? 'system'),
            $action,
            (string) ($resourceType ?? ''),
            (string) ($resourceId ?? ''),
            (string) ($ipAddress ?? ''),
            $createdAt,
            $canonicalMetadata,
        ]);

        return hash('sha256', $payload);
    }

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
