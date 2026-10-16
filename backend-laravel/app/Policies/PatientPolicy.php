<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PatientPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any patients.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the specific patient.
     */
    public function view(User $user, Patient $patient): bool
    {
        // Owner clinician or system administrator
        if ($patient->user_id === $user->id || $user->is_admin) {
            return true;
        }

        // Cross-specialist access: if patient has analyses flagged for this clinician's department/role
        return $patient->analyses()
            ->where('status', 'flagged')
            ->where(function ($q) use ($user) {
                if ($user->role) {
                    $q->where('flagged_for', strtolower($user->role));
                }
            })
            ->exists();
    }

    /**
     * Determine whether the user can create patients.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the patient.
     */
    public function update(User $user, Patient $patient): bool
    {
        return $patient->user_id === $user->id || $user->is_admin;
    }

    /**
     * Determine whether the user can delete the patient.
     */
    public function delete(User $user, Patient $patient): bool
    {
        return $patient->user_id === $user->id || $user->is_admin;
    }
}
