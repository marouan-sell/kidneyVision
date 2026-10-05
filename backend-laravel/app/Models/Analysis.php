<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AnalysisStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Analysis extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'image_path',
        'original_filename',
        'patient_id',
        'patient_name',
        'patient_age',
        'patient_gender',
        'anatomical_location',
        'clinician_notes',
        'prediction',
        'confidence',
        'status',
        'ai_response_payload',
        'processed_at',
        'confirmed_at',
        'confirmed_by',
        'flagged_for',
        'flagged_at',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'status' => AnalysisStatus::class,
            'confidence' => 'decimal:2',
            'ai_response_payload' => 'array',
            'processed_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'flagged_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the analysis.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the clinician user who confirmed this analysis.
     */
    public function confirmedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    /**
     * Get the report associated with this analysis.
     */
    public function report(): HasOne
    {
        return $this->hasOne(Report::class);
    }

    /**
     * Scope: Only completed analyses.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', AnalysisStatus::COMPLETED);
    }

    /**
     * Scope: Analyses for a specific user.
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Recent analyses (last N days).
     */
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Check if the analysis is complete.
     */
    public function isCompleted(): bool
    {
        return $this->status === AnalysisStatus::COMPLETED;
    }

    /**
     * Check if the analysis has failed.
     */
    public function isFailed(): bool
    {
        return $this->status === AnalysisStatus::FAILED;
    }

    /**
     * Get the full image URL.
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }

        $path = str_replace('\\', '/', $this->image_path);
        $path = ltrim($path, '/');
        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8);
        }

        return asset('storage/' . $path);
    }
}
