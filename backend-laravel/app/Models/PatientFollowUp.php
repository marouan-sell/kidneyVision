<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientFollowUp extends Model
{
    use HasFactory;

    protected $table = 'patient_follow_ups';

    protected $fillable = [
        'patient_id',
        'user_id',
        'follow_up_date',
        'reason',
        'status',
        'clinical_notes',
    ];

    protected function casts(): array
    {
        return [
            'follow_up_date' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'patient_id');
    }

    public function isOverdue(): bool
    {
        return $this->status === 'scheduled' && $this->follow_up_date->isPast();
    }
}
