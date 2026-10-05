<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'key',
        'value',
        'type',
        'description',
        'updated_by',
    ];

    /**
     * Get casted value based on type.
     */
    public function getValueAttribute($val): mixed
    {
        return match ($this->type) {
            'integer', 'int' => (int) $val,
            'boolean', 'bool' => filter_var($val, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode((string) $val, true),
            'float' => (float) $val,
            default => (string) $val,
        };
    }

    /**
     * Mutate value for database storage.
     */
    public function setValueAttribute($val): void
    {
        $this->attributes['value'] = is_bool($val) ? ($val ? '1' : '0') : (is_array($val) ? json_encode($val) : (string) $val);
    }

    public function getTypedValueAttribute(): mixed
    {
        return $this->value;
    }

    /**
     * Helper to get a setting value with fallback.
     */
    public static function getValue(string $key, mixed $default = null, ?int $userId = null): mixed
    {
        if ($userId) {
            $userSetting = static::where('user_id', $userId)->where('key', $key)->first();
            if ($userSetting) {
                return $userSetting->typed_value;
            }
        }

        $globalSetting = static::whereNull('user_id')->where('key', $key)->first();
        return $globalSetting ? $globalSetting->typed_value : $default;
    }

    /**
     * Helper to set a setting value.
     */
    public static function setValue(string $key, mixed $value, string $type = 'string', ?int $userId = null, ?int $updatedBy = null): self
    {
        $serializedValue = match ($type) {
            'boolean', 'bool' => $value ? '1' : '0',
            'json' => json_encode($value),
            default => (string) $value,
        };

        return static::updateOrCreate(
            ['user_id' => $userId, 'key' => $key],
            [
                'value' => $serializedValue,
                'type' => $type,
                'updated_by' => $updatedBy,
            ]
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
