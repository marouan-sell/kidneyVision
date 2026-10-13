<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'hospital',
        'role',
        'avatar_path',
        'signature_configured',
        'signature_path',
        'signature_updated_at',
        'is_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'signature_configured' => 'boolean',
            'signature_updated_at' => 'datetime',
            'is_admin' => 'boolean',
        ];
    }

    /**
     * Get full URL to user avatar image.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar_path) {
            return null;
        }

        $path = str_replace('\\', '/', $this->avatar_path);
        $path = ltrim($path, '/');
        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8);
        }

        return asset('storage/' . $path);
    }

    /**
     * Get full URL to user signature image.
     */
    public function getSignatureUrlAttribute(): ?string
    {
        if (!$this->signature_path) {
            return null;
        }

        $path = str_replace('\\', '/', $this->signature_path);
        $path = ltrim($path, '/');
        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8);
        }

        return asset('storage/' . $path);
    }

    /**
     * Always lowercase the email address when reading or writing to prevent case-sensitivity issues with Resend API.
     */
    protected function email(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn (string $value) => strtolower($value),
            set: fn (string $value) => strtolower($value),
        );
    }

    /**
     * Get the analyses for the user.
     */
    public function analyses(): HasMany
    {
        return $this->hasMany(Analysis::class);
    }

    /**
     * Get the settings for the user.
     */
    public function settings(): HasMany
    {
        return $this->hasMany(Setting::class);
    }

    /**
     * Get the audit logs for the user.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    /**
     * Scope to include analysis count.
     */
    public function scopeWithAnalysisCount($query)
    {
        return $query->withCount('analyses');
    }
}
