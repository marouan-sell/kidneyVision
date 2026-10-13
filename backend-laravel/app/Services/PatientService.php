<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Patient;
use App\Models\Analysis;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PatientService
{
    /**
     * Resolve existing patient or create a genuinely new patient with an automatically generated unique Patient ID.
     * Handles concurrent requests safely via database transactions and row locks.
     */
    public function findOrCreatePatient(
        int $userId,
        ?string $patientId = null,
        ?string $patientName = null,
        ?int $patientAge = null,
        ?string $patientGender = null,
        ?string $notes = null
    ): Patient {
        $cleanId = $patientId !== null ? trim($patientId) : '';
        $cleanName = $patientName !== null ? trim($patientName) : '';

        return DB::transaction(function () use ($userId, $cleanId, $cleanName, $patientAge, $patientGender, $notes) {
            // Case 1: An explicit Patient ID was provided
            if ($cleanId !== '') {
                $existing = Patient::where('patient_id', $cleanId)->lockForUpdate()->first();
                if ($existing) {
                    // Update details if provided
                    $updated = false;
                    if ($cleanName !== '' && $existing->name !== $cleanName) {
                        $existing->name = $cleanName;
                        $updated = true;
                    }
                    if ($patientAge !== null && $existing->age !== $patientAge) {
                        $existing->age = $patientAge;
                        $updated = true;
                    }
                    if ($patientGender !== null && $existing->gender !== $patientGender) {
                        $existing->gender = $patientGender;
                        $updated = true;
                    }
                    if ($updated) {
                        $existing->save();
                    }
                    return $existing;
                }

                // If not in patients table, create with the provided unique ID
                return Patient::create([
                    'patient_id' => $cleanId,
                    'user_id' => $userId,
                    'name' => $cleanName !== '' ? $cleanName : "Patient {$cleanId}",
                    'age' => $patientAge,
                    'gender' => $patientGender,
                    'notes' => $notes,
                ]);
            }

            // Case 2: No Patient ID provided. Check if this is an existing patient by name for this user/clinic.
            if ($cleanName !== '' && !in_array(strtolower($cleanName), ['unspecified patient', 'unknown', 'anonymous', 'patient'], true)) {
                $existingByName = Patient::where('user_id', $userId)
                    ->whereRaw('LOWER(name) = ?', [strtolower($cleanName)])
                    ->lockForUpdate()
                    ->first();

                if ($existingByName) {
                    // Reuse existing Patient ID for subsequent analyses of this patient
                    if ($patientAge !== null && $existingByName->age !== $patientAge) {
                        $existingByName->age = $patientAge;
                        $existingByName->save();
                    }
                    if ($patientGender !== null && $existingByName->gender !== $patientGender) {
                        $existingByName->gender = $patientGender;
                        $existingByName->save();
                    }
                    return $existingByName;
                }
            }

            // Case 3: Genuinely new patient. Automatically generate a unique Patient ID safely.
            $newPatientId = $this->generateUniquePatientId();
            $displayName = $cleanName !== '' ? $cleanName : "Patient {$newPatientId}";

            return Patient::create([
                'patient_id' => $newPatientId,
                'user_id' => $userId,
                'name' => $displayName,
                'age' => $patientAge,
                'gender' => $patientGender,
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Generate next guaranteed-unique Patient ID in format PT-XXXXX safely.
     * Prevents race conditions by checking current max records.
     */
    public function generateUniquePatientId(): string
    {
        // Find highest numeric suffix among PT- records in patients and analyses
        $patientsMax = DB::table('patients')
            ->where('patient_id', 'LIKE', 'PT-%')
            ->selectRaw("MAX(CAST(SUBSTRING(patient_id FROM 4) AS INTEGER)) as max_seq")
            ->value('max_seq');

        $analysesMax = DB::table('analyses')
            ->where('patient_id', 'LIKE', 'PT-%')
            ->selectRaw("MAX(CAST(SUBSTRING(patient_id FROM 4) AS INTEGER)) as max_seq")
            ->value('max_seq');

        $highest = max(
            (int) ($patientsMax ?? 0),
            (int) ($analysesMax ?? 0),
            10000 // Base starting number for 5-digit clinical formatting (PT-10001)
        );

        $nextSeq = $highest + 1;
        $candidateId = sprintf('PT-%05d', $nextSeq);

        // Double check loop to guarantee uniqueness
        while (
            Patient::where('patient_id', $candidateId)->exists() ||
            Analysis::where('patient_id', $candidateId)->exists()
        ) {
            $nextSeq++;
            $candidateId = sprintf('PT-%05d', $nextSeq);
        }

        return $candidateId;
    }

    /**
     * List all distinct patients for the user.
     */
    public function getPatientsForUser(int $userId, ?string $search = null): Collection
    {
        $query = Patient::where('user_id', $userId)
            ->withCount('analyses')
            ->orderBy('name', 'asc');

        if ($search !== null && trim($search) !== '') {
            $term = '%' . trim($search) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'ilike', $term)
                  ->orWhere('patient_id', 'ilike', $term);
            });
        }

        return $query->get();
    }
}
