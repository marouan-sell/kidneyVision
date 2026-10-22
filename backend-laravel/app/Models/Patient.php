<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'user_id',
        'name',
        'age',
        'gender',
        'phone',
        'email',
        'phone_bidx',
        'email_bidx',
        'notes',
        'flagged_for_review',
        'review_reason',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $patient) {
            // Automatically synchronize blind indexes on write/update
            if ($patient->isDirty('phone')) {
                $patient->phone_bidx = self::generateBlindIndex($patient->phone, 'phone');
            }
            if ($patient->isDirty('email')) {
                $patient->email_bidx = self::generateBlindIndex($patient->email, 'email');
            }
        });
    }

    protected function casts(): array
    {
        return [
            'name' => 'encrypted',
            'phone' => 'encrypted',
            'email' => 'encrypted',
            'notes' => 'encrypted',
            'age' => 'integer',
            'flagged_for_review' => 'boolean',
        ];
    }

    /**
     * Compute a deterministic HMAC-SHA256 blind index for exact search on encrypted data.
     */
    public static function generateBlindIndex(?string $value, string $type = 'general'): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $normalized = trim($value);
        if ($type === 'email') {
            $normalized = strtolower($normalized);
        } elseif ($type === 'phone') {
            // Strip non-digits and normalize country prefix for phone numbers
            $normalized = preg_replace('/[^0-9]/', '', $normalized) ?? $normalized;
        }

        // Use dedicated blind index secret with fallback derived from APP_KEY
        $key = (string) config('app.blind_index_key', hash('sha256', (string) config('app.key') . '_blind_index_salt'));

        return hash_hmac('sha256', $normalized, $key);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function analyses(): HasMany
    {
        return $this->hasMany(Analysis::class, 'patient_id', 'patient_id')->orderBy('created_at', 'desc');
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(PatientFollowUp::class, 'patient_id', 'patient_id')->orderBy('follow_up_date', 'asc');
    }
}
