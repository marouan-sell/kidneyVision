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
        'notes',
        'flagged_for_review',
        'review_reason',
    ];

    protected function casts(): array
    {
        return [
            'age' => 'integer',
            'flagged_for_review' => 'boolean',
        ];
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
