<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Analysis;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class AnalysisPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any analyses.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the analysis.
     */
    public function view(User $user, Analysis $analysis): bool
    {
        if ($analysis->user_id === $user->id || $user->is_admin) {
            return true;
        }

        // Cross-specialist triage consultation access
        if ($analysis->status->value === 'flagged' && !empty($analysis->flagged_for)) {
            return strtolower((string) $user->role) === strtolower((string) $analysis->flagged_for);
        }

        return false;
    }

    /**
     * Determine whether the user can view the ultrasound image.
     */
    public function viewImage(User $user, Analysis $analysis): bool
    {
        return $this->view($user, $analysis);
    }

    /**
     * Determine whether the user can update the analysis.
     */
    public function update(User $user, Analysis $analysis): bool
    {
        if ($analysis->user_id === $user->id || $user->is_admin) {
            return true;
        }

        // Flagged specialist triage consultation
        if ($analysis->status->value === 'flagged' && !empty($analysis->flagged_for)) {
            return strtolower((string) $user->role) === strtolower((string) $analysis->flagged_for);
        }

        return false;
    }

    /**
     * Determine whether the user can confirm the analysis.
     */
    public function confirm(User $user, Analysis $analysis): bool
    {
        return $this->update($user, $analysis);
    }

    /**
     * Determine whether the user can delete the analysis.
     */
    public function delete(User $user, Analysis $analysis): bool
    {
        return $analysis->user_id === $user->id || $user->is_admin;
    }
}
