<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Report;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ReportPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the report.
     */
    public function view(User $user, Report $report): bool
    {
        $analysis = $report->analysis;
        if (!$analysis) {
            return false;
        }

        if ($analysis->user_id === $user->id || $user->is_admin) {
            return true;
        }

        if ($analysis->status->value === 'flagged' && !empty($analysis->flagged_for)) {
            return strtolower((string) $user->role) === strtolower((string) $analysis->flagged_for);
        }

        return false;
    }

    /**
     * Determine whether the user can download or export the report.
     */
    public function download(User $user, Report $report): bool
    {
        return $this->view($user, $report);
    }
}
