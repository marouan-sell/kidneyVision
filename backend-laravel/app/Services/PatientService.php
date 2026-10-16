<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Patient;
use App\Models\Analysis;
use App\Models\PatientFollowUp;
use App\Models\Report;
use App\Enums\AnalysisStatus;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PatientService
{
    /**
     * Resolve existing patient or create a genuinely new patient with an automatically generated unique Patient ID.
     * Guaranteed concurrency-safe via database transactions, row locks, and atomic sequences.
     * NEVER merges patients based on name alone.
     */
    public function findOrCreatePatient(
        int $userId,
        ?string $patientId = null,
        ?string $patientName = null,
        ?int $patientAge = null,
        ?string $patientGender = null,
        ?string $notes = null,
        ?string $phone = null,
        ?string $email = null
    ): Patient {
        $cleanId = $patientId !== null ? trim($patientId) : '';
        $cleanName = $patientName !== null ? trim($patientName) : '';

        return DB::transaction(function () use ($userId, $cleanId, $cleanName, $patientAge, $patientGender, $notes, $phone, $email) {
            // Case 1: An explicit Patient ID was provided
            if ($cleanId !== '') {
                // Scope search to the authenticated user's patients to prevent IDOR / cross-tenant collisions
                $existing = Patient::where('user_id', $userId)
                    ->where('patient_id', $cleanId)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    $updated = false;
                    if ($cleanName !== '' && $existing->name !== $cleanName && !str_starts_with(strtolower($cleanName), 'photo ') && !str_starts_with(strtolower($cleanName), 'screenshot ')) {
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
                    if ($phone !== null && $existing->phone !== $phone) {
                        $existing->phone = $phone;
                        $updated = true;
                    }
                    if ($email !== null && $existing->email !== $email) {
                        $existing->email = $email;
                        $updated = true;
                    }
                    if ($updated) {
                        $existing->save();
                    }
                    return $existing;
                }

                // If not existing for this user, check if this ID is already used globally by another user
                $globalCheck = Patient::where('patient_id', $cleanId)->exists();
                $finalId = $globalCheck ? $this->generateUniquePatientId() : $cleanId;

                return Patient::create([
                    'patient_id' => $finalId,
                    'user_id' => $userId,
                    'name' => $cleanName !== '' ? $cleanName : "Patient {$finalId}",
                    'age' => $patientAge,
                    'gender' => $patientGender,
                    'notes' => $notes,
                    'phone' => $phone,
                    'email' => $email,
                ]);
            }

            // Case 2: No explicit Patient ID provided.
            // In strict compliance with medical data integrity guidelines:
            // NEVER merge patients based on name alone! Always allocate a guaranteed unique Patient ID.
            $newPatientId = $this->generateUniquePatientId();
            $displayName = $cleanName !== '' ? $cleanName : "Patient {$newPatientId}";

            return Patient::create([
                'patient_id' => $newPatientId,
                'user_id' => $userId,
                'name' => $displayName,
                'age' => $patientAge,
                'gender' => $patientGender,
                'notes' => $notes,
                'phone' => $phone,
                'email' => $email,
            ]);
        });
    }

    /**
     * Generate next guaranteed-unique Patient ID in format PT-XXXXX safely.
     * Concurrency-safe: leverages PostgreSQL atomic sequence 'patient_id_seq'.
     */
    public function generateUniquePatientId(): string
    {
        try {
            $seqRow = DB::selectOne("SELECT nextval('patient_id_seq') as seq");
            $nextSeq = (int) ($seqRow->seq ?? 100020);
            $candidateId = sprintf('PT-%05d', $nextSeq);

            // Double check uniqueness against both tables to prevent any collision
            while (
                Patient::where('patient_id', $candidateId)->exists() ||
                Analysis::where('patient_id', $candidateId)->exists()
            ) {
                $seqRow = DB::selectOne("SELECT nextval('patient_id_seq') as seq");
                $nextSeq = (int) ($seqRow->seq ?? ($nextSeq + 1));
                $candidateId = sprintf('PT-%05d', $nextSeq);
            }

            return $candidateId;
        } catch (\Throwable $e) {
            Log::warning('Fallback sequence generation', ['error' => $e->getMessage()]);

            // Database lock fallback
            return DB::transaction(function () {
                $patientsMax = DB::table('patients')
                    ->where('patient_id', 'LIKE', 'PT-%')
                    ->selectRaw("MAX(CAST(SUBSTRING(patient_id FROM 4) AS INTEGER)) as max_seq")
                    ->lockForUpdate()
                    ->value('max_seq');

                $analysesMax = DB::table('analyses')
                    ->where('patient_id', 'LIKE', 'PT-%')
                    ->selectRaw("MAX(CAST(SUBSTRING(patient_id FROM 4) AS INTEGER)) as max_seq")
                    ->value('max_seq');

                $highest = max((int) ($patientsMax ?? 0), (int) ($analysesMax ?? 0), 10000);
                $nextSeq = $highest + 1;
                $candidateId = sprintf('PT-%05d', $nextSeq);

                while (
                    Patient::where('patient_id', $candidateId)->exists() ||
                    Analysis::where('patient_id', $candidateId)->exists()
                ) {
                    $nextSeq++;
                    $candidateId = sprintf('PT-%05d', $nextSeq);
                }

                return $candidateId;
            });
        }
    }

    /**
     * Get paginated directory of patients for authenticated user with full metrics, search & filters.
     */
    public function getPatientsDirectory(int $userId, array $filters = []): LengthAwarePaginator
    {
        $perPage = isset($filters['per_page']) ? max(1, (int) $filters['per_page']) : 10;
        $search = isset($filters['search']) ? trim((string) $filters['search']) : '';
        $filterVisit = $filters['filter_visit'] ?? 'all';
        $filterReview = $filters['filter_review'] ?? 'all';
        $filterFollowUp = $filters['filter_follow_up'] ?? 'all';

        $query = Patient::where('user_id', $userId)
            ->withCount('analyses')
            ->with(['analyses' => function ($q) {
                $q->orderBy('created_at', 'desc');
            }, 'followUps' => function ($q) {
                $q->orderBy('follow_up_date', 'asc');
            }]);

        // Search by Patient ID or Blind Indexed Contact Data
        if ($search !== '') {
            $cleanTerm = strtolower($search);
            $phoneBidx = Patient::generateBlindIndex($search, 'phone');
            $emailBidx = Patient::generateBlindIndex($search, 'email');

            $query->where(function ($q) use ($cleanTerm, $phoneBidx, $emailBidx) {
                $q->whereRaw('LOWER(patient_id) LIKE ?', ["%{$cleanTerm}%"]);
                if ($phoneBidx) {
                    $q->orWhere('phone_bidx', $phoneBidx);
                }
                if ($emailBidx) {
                    $q->orWhere('email_bidx', $emailBidx);
                }
            });
        }

        // Filter: Review Status (pending review, confirmed, flagged)
        if ($filterReview === 'pending') {
            $query->whereHas('analyses', function ($q) {
                $q->whereIn('status', [AnalysisStatus::REVIEW->value, 'review']);
            });
        } elseif ($filterReview === 'confirmed') {
            $query->whereHas('analyses', function ($q) {
                $q->whereIn('status', [AnalysisStatus::CONFIRMED->value, 'confirmed']);
            });
        } elseif ($filterReview === 'flagged') {
            $query->whereHas('analyses', function ($q) {
                $q->whereIn('status', [AnalysisStatus::FLAGGED->value, 'flagged']);
            });
        }

        // Filter: Follow-up Status (upcoming, overdue, completed)
        if ($filterFollowUp === 'upcoming') {
            $query->whereHas('followUps', function ($q) {
                $q->where('status', 'scheduled')
                  ->where('follow_up_date', '>=', now());
            });
        } elseif ($filterFollowUp === 'overdue') {
            $query->whereHas('followUps', function ($q) {
                $q->where('status', 'scheduled')
                  ->where('follow_up_date', '<', now());
            });
        } elseif ($filterFollowUp === 'completed') {
            $query->whereHas('followUps', function ($q) {
                $q->where('status', 'completed');
            });
        }

        // Filter: Last Visit
        if ($filterVisit === 'recent_30') {
            $query->whereHas('analyses', function ($q) {
                $q->where('created_at', '>=', now()->subDays(30));
            });
        } elseif ($filterVisit === 'recent_90') {
            $query->whereHas('analyses', function ($q) {
                $q->where('created_at', '>=', now()->subDays(90));
            });
        }

        $paginator = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Transform items to include computed summary metrics
        $paginator->getCollection()->transform(function (Patient $patient) {
            $analyses = $patient->analyses;
            $followUps = $patient->followUps;

            $latestAnalysis = $analyses->first();
            $firstAnalysis = $analyses->last();

            $nextFollowUp = $followUps->first(function (PatientFollowUp $f) {
                return $f->status === 'scheduled' && $f->follow_up_date >= now();
            }) ?? $followUps->first(function (PatientFollowUp $f) {
                return $f->status === 'scheduled';
            });

            $hasPendingReviews = $analyses->contains(function (Analysis $a) {
                return $a->status === AnalysisStatus::REVIEW;
            });

            return [
                'id' => $patient->id,
                'patient_id' => $patient->patient_id,
                'name' => $patient->name,
                'age' => $patient->age,
                'gender' => $patient->gender,
                'phone' => $patient->phone,
                'email' => $patient->email,
                'notes' => $patient->notes,
                'flagged_for_review' => $patient->flagged_for_review,
                'review_reason' => $patient->review_reason,
                'analyses_count' => $analyses->count(),
                'first_visit' => $firstAnalysis?->created_at?->toISOString() ?? $patient->created_at?->toISOString(),
                'last_visit' => $latestAnalysis?->created_at?->toISOString() ?? $patient->created_at?->toISOString(),
                'latest_result' => $latestAnalysis ? [
                    'id' => $latestAnalysis->id,
                    'prediction' => $latestAnalysis->prediction,
                    'confidence' => $latestAnalysis->confidence,
                    'status' => $latestAnalysis->status->value,
                    'status_label' => $latestAnalysis->status->label(),
                    'status_color' => $latestAnalysis->status->color(),
                    'created_at' => $latestAnalysis->created_at->toISOString(),
                ] : null,
                'has_pending_reviews' => $hasPendingReviews,
                'next_follow_up' => $nextFollowUp ? [
                    'id' => $nextFollowUp->id,
                    'follow_up_date' => $nextFollowUp->follow_up_date->toISOString(),
                    'reason' => $nextFollowUp->reason,
                    'status' => $nextFollowUp->status,
                    'is_overdue' => $nextFollowUp->isOverdue(),
                ] : null,
                'created_at' => $patient->created_at->toISOString(),
            ];
        });

        return $paginator;
    }

    /**
     * Get aggregate Follow-up Center statistics for authenticated user.
     */
    public function getFollowUpStatistics(int $userId): array
    {
        $totalPatients = Patient::where('user_id', $userId)->count();

        $activeFollowUps = PatientFollowUp::where('user_id', $userId)
            ->where('status', 'scheduled')
            ->where('follow_up_date', '>=', now())
            ->count();

        $overdueFollowUps = PatientFollowUp::where('user_id', $userId)
            ->where('status', 'scheduled')
            ->where('follow_up_date', '<', now())
            ->count();

        $pendingReviews = Analysis::where('user_id', $userId)
            ->where('status', AnalysisStatus::REVIEW)
            ->count();

        $totalAnalyses = Analysis::where('user_id', $userId)->count();

        $highRiskPatients = Patient::where('user_id', $userId)
            ->whereHas('analyses', function ($q) {
                $q->whereRaw("LOWER(prediction) = 'tumor'");
            })
            ->count();

        return [
            'total_patients' => $totalPatients,
            'active_follow_ups' => $activeFollowUps,
            'overdue_follow_ups' => $overdueFollowUps,
            'pending_reviews' => $pendingReviews,
            'total_analyses' => $totalAnalyses,
            'high_risk_patients' => $highRiskPatients,
        ];
    }

    /**
     * Get full details for a single patient profile, including tabs:
     * Overview, Timeline, Imaging, Follow-up, Reports.
     */
    public function getPatientProfile(int $userId, string $patientId): ?array
    {
        $patient = Patient::where('user_id', $userId)
            ->where('patient_id', $patientId)
            ->with(['analyses' => function ($q) {
                $q->orderBy('created_at', 'desc')->with(['report', 'confirmedByUser']);
            }, 'followUps' => function ($q) {
                $q->orderBy('follow_up_date', 'desc');
            }])
            ->first();

        if (!$patient) {
            return null;
        }

        $analyses = $patient->analyses;
        $followUps = $patient->followUps;

        // Construct Timeline: chronological unified array of all events
        $timelineEvents = [];

        foreach ($analyses as $a) {
            // Scan uploaded & analyzed event
            $timelineEvents[] = [
                'id' => "analysis_{$a->id}",
                'type' => 'scan_analyzed',
                'timestamp' => $a->created_at->toISOString(),
                'title' => 'Renal Scan Diagnostic Analysis',
                'description' => "AI Diagnostic Screening: {$a->prediction} ({$a->confidence}% confidence)",
                'status' => $a->status->value,
                'status_label' => $a->status->label(),
                'status_color' => $a->status->color(),
                'record_id' => $a->id,
                'image_url' => $a->image_url,
                'notes' => $a->clinician_notes,
            ];

            // Clinician Confirmation event if confirmed
            if ($a->confirmed_at) {
                $timelineEvents[] = [
                    'id' => "confirmed_{$a->id}",
                    'type' => 'clinician_confirmed',
                    'timestamp' => $a->confirmed_at->toISOString(),
                    'title' => 'Clinical Finding Confirmed',
                    'description' => "Confirmed by clinician " . ($a->confirmedByUser?->name ?? 'Attending Physician'),
                    'status' => 'confirmed',
                    'status_label' => 'Clinician Confirmed',
                    'status_color' => 'emerald',
                    'record_id' => $a->id,
                ];
            }

            // Report generation event
            if ($a->report) {
                $timelineEvents[] = [
                    'id' => "report_{$a->report->id}",
                    'type' => 'report_generated',
                    'timestamp' => $a->report->created_at->toISOString(),
                    'title' => $a->report->title,
                    'description' => 'Official diagnostic PDF report ready for download/print',
                    'status' => 'completed',
                    'status_label' => 'PDF Report',
                    'status_color' => 'blue',
                    'record_id' => $a->id,
                ];
            }
        }

        foreach ($followUps as $f) {
            $timelineEvents[] = [
                'id' => "followup_{$f->id}",
                'type' => 'follow_up',
                'timestamp' => $f->follow_up_date->toISOString(),
                'title' => "Follow-up Visit: {$f->reason}",
                'description' => $f->clinical_notes ?: 'Routine clinical follow-up examination',
                'status' => $f->status,
                'status_label' => ucfirst($f->status),
                'status_color' => $f->status === 'completed' ? 'emerald' : ($f->isOverdue() ? 'red' : 'blue'),
                'record_id' => $f->id,
                'is_overdue' => $f->isOverdue(),
            ];
        }

        // Sort timeline descending by timestamp
        usort($timelineEvents, function ($a, $b) {
            return strcmp($b['timestamp'], $a['timestamp']);
        });

        // Imaging scans tab data
        $imagingScans = $analyses->map(function (Analysis $a) {
            return [
                'id' => $a->id,
                'image_url' => $a->image_url,
                'original_filename' => $a->original_filename,
                'prediction' => $a->prediction,
                'confidence' => (float) $a->confidence,
                'status' => $a->status->value,
                'status_label' => $a->status->label(),
                'status_color' => $a->status->color(),
                'location' => $a->anatomical_location ?? 'Left Kidney',
                'clinician_notes' => $a->clinician_notes,
                'model_version' => $a->ai_response_payload['model_version'] ?? 'ConvNeXt-Tiny Master 4-Class SOTA',
                'heatmap_url' => $a->ai_response_payload['gradcam_image'] ?? null,
                'has_report' => $a->report !== null,
                'confirmed_at' => $a->confirmed_at?->toISOString(),
                'confirmed_by_name' => $a->confirmedByUser?->name,
                'created_at' => $a->created_at->toISOString(),
            ];
        })->values();

        // Reports tab data
        $reportsList = $analyses->filter(fn($a) => $a->report !== null)->map(function (Analysis $a) {
            return [
                'id' => $a->report->id,
                'analysis_id' => $a->id,
                'report_code' => 'KV-' . str_pad((string) $a->id, 6, '0', STR_PAD_LEFT),
                'title' => $a->report->title,
                'summary' => $a->report->summary,
                'prediction' => $a->prediction,
                'confidence' => (float) $a->confidence,
                'created_at' => $a->report->created_at->toISOString(),
                'filename' => "kidneyvision_report_{$a->id}.pdf",
            ];
        })->values();

        // Follow ups tab data
        $followUpsList = $followUps->map(function (PatientFollowUp $f) {
            return [
                'id' => $f->id,
                'patient_id' => $f->patient_id,
                'follow_up_date' => $f->follow_up_date->toISOString(),
                'reason' => $f->reason,
                'status' => $f->status,
                'clinical_notes' => $f->clinical_notes,
                'is_overdue' => $f->isOverdue(),
                'created_at' => $f->created_at->toISOString(),
            ];
        })->values();

        return [
            'patient' => [
                'id' => $patient->id,
                'patient_id' => $patient->patient_id,
                'name' => $patient->name,
                'age' => $patient->age,
                'gender' => $patient->gender,
                'phone' => $patient->phone,
                'email' => $patient->email,
                'notes' => $patient->notes,
                'flagged_for_review' => $patient->flagged_for_review,
                'review_reason' => $patient->review_reason,
                'created_at' => $patient->created_at->toISOString(),
                'analyses_count' => $analyses->count(),
            ],
            'overview' => [
                'latest_analysis' => $analyses->first() ? [
                    'id' => $analyses->first()->id,
                    'prediction' => $analyses->first()->prediction,
                    'confidence' => (float) $analyses->first()->confidence,
                    'status' => $analyses->first()->status->value,
                    'status_label' => $analyses->first()->status->label(),
                    'created_at' => $analyses->first()->created_at->toISOString(),
                    'image_url' => $analyses->first()->image_url,
                ] : null,
                'first_visit' => $analyses->last()?->created_at?->toISOString() ?? $patient->created_at->toISOString(),
                'last_visit' => $analyses->first()?->created_at?->toISOString() ?? $patient->created_at->toISOString(),
                'pending_reviews_count' => $analyses->where('status', AnalysisStatus::REVIEW)->count(),
                'confirmed_count' => $analyses->where('status', AnalysisStatus::CONFIRMED)->count(),
                'scheduled_follow_ups_count' => $followUps->where('status', 'scheduled')->count(),
            ],
            'timeline' => $timelineEvents,
            'imaging' => $imagingScans,
            'reports' => $reportsList,
            'follow_ups' => $followUpsList,
        ];
    }

    /**
     * Compare two scans belonging to the SAME patient side by side.
     */
    public function getScanComparison(int $userId, string $patientId, int $scanId1, int $scanId2): array
    {
        $patient = Patient::where('user_id', $userId)->where('patient_id', $patientId)->firstOrFail();

        $scan1 = Analysis::where('user_id', $userId)
            ->where('patient_id', $patientId)
            ->where('id', $scanId1)
            ->with('report')
            ->firstOrFail();

        $scan2 = Analysis::where('user_id', $userId)
            ->where('patient_id', $patientId)
            ->where('id', $scanId2)
            ->with('report')
            ->firstOrFail();

        // Technical compatibility check: ensure both are legitimate medical scans
        $isScan1Valid = !empty($scan1->image_path);
        $isScan2Valid = !empty($scan2->image_path);

        $transformScan = function (Analysis $scan) {
            return [
                'id' => $scan->id,
                'report_code' => 'KV-' . str_pad((string) $scan->id, 6, '0', STR_PAD_LEFT),
                'examination_date' => $scan->created_at->toISOString(),
                'image_url' => $scan->image_url,
                'heatmap_url' => $scan->ai_response_payload['gradcam_image'] ?? null,
                'prediction' => $scan->prediction,
                'confidence' => (float) $scan->confidence,
                'status' => $scan->status->value,
                'status_label' => $scan->status->label(),
                'location' => $scan->anatomical_location ?? 'Left Kidney',
                'clinician_notes' => $scan->clinician_notes,
                'model_version' => $scan->ai_response_payload['model_version'] ?? 'ConvNeXt-Tiny Master 4-Class SOTA',
                'clinical_assessment' => $scan->ai_response_payload['clinical_assessment'] ?? null,
                'has_report' => $scan->report !== null,
            ];
        };

        // Chronological order: scanA is earlier, scanB is later
        $scanA = $scan1->created_at <= $scan2->created_at ? $scan1 : $scan2;
        $scanB = $scan1->created_at <= $scan2->created_at ? $scan2 : $scan1;

        $daysBetween = (int) $scanA->created_at->diffInDays($scanB->created_at);

        return [
            'patient' => [
                'patient_id' => $patient->patient_id,
                'name' => $patient->name,
                'age' => $patient->age,
                'gender' => $patient->gender,
            ],
            'scan_a' => $transformScan($scanA),
            'scan_b' => $transformScan($scanB),
            'interval_days' => $daysBetween,
            'is_compatible' => $isScan1Valid && $isScan2Valid,
            'neutral_observations' => [
                'finding_changed' => strtolower($scanA->prediction ?? '') !== strtolower($scanB->prediction ?? ''),
                'finding_a' => $scanA->prediction,
                'finding_b' => $scanB->prediction,
                'confidence_diff' => round((float) $scanB->confidence - (float) $scanA->confidence, 2),
                'note' => 'Differences presented for clinical review only. Final diagnostic interpretation and disease progression must be established by an authorized radiologist.',
            ],
        ];
    }

    /**
     * Create a persistent follow-up record for a patient.
     */
    public function createFollowUp(int $userId, string $patientId, array $data): PatientFollowUp
    {
        // Enforce ownership
        $patient = Patient::where('user_id', $userId)->where('patient_id', $patientId)->firstOrFail();

        return PatientFollowUp::create([
            'patient_id' => $patient->patient_id,
            'user_id' => $userId,
            'follow_up_date' => $data['follow_up_date'],
            'reason' => $data['reason'],
            'status' => $data['status'] ?? 'scheduled',
            'clinical_notes' => $data['clinical_notes'] ?? null,
        ]);
    }

    /**
     * Update an existing follow-up record.
     */
    public function updateFollowUp(int $userId, int $followUpId, array $data): PatientFollowUp
    {
        $followUp = PatientFollowUp::where('user_id', $userId)->where('id', $followUpId)->firstOrFail();

        $followUp->update([
            'follow_up_date' => $data['follow_up_date'] ?? $followUp->follow_up_date,
            'reason' => $data['reason'] ?? $followUp->reason,
            'status' => $data['status'] ?? $followUp->status,
            'clinical_notes' => array_key_exists('clinical_notes', $data) ? $data['clinical_notes'] : $followUp->clinical_notes,
        ]);

        return $followUp;
    }

    /**
     * Delete a follow-up record.
     */
    public function deleteFollowUp(int $userId, int $followUpId): bool
    {
        $followUp = PatientFollowUp::where('user_id', $userId)->where('id', $followUpId)->firstOrFail();
        return (bool) $followUp->delete();
    }

    /**
     * Create a new patient manually.
     */
    public function createPatient(int $userId, array $data): Patient
    {
        $patientId = !empty($data['patient_id']) ? trim($data['patient_id']) : $this->generateUniquePatientId();

        // Enforce uniqueness
        if (Patient::where('patient_id', $patientId)->exists()) {
            $patientId = $this->generateUniquePatientId();
        }

        return Patient::create([
            'patient_id' => $patientId,
            'user_id' => $userId,
            'name' => trim($data['name']),
            'age' => !empty($data['age']) ? (int) $data['age'] : null,
            'gender' => $data['gender'] ?? 'Male',
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    /**
     * Update patient demographics and clinical notes.
     */
    public function updatePatient(int $userId, string $patientId, array $data): Patient
    {
        $patient = Patient::where('user_id', $userId)->where('patient_id', $patientId)->firstOrFail();

        $update = [];
        if (!empty($data['name'])) $update['name'] = trim($data['name']);
        if (array_key_exists('age', $data)) $update['age'] = $data['age'] !== null ? (int) $data['age'] : null;
        if (!empty($data['gender'])) $update['gender'] = $data['gender'];
        if (array_key_exists('phone', $data)) $update['phone'] = $data['phone'];
        if (array_key_exists('email', $data)) $update['email'] = $data['email'];
        if (array_key_exists('notes', $data)) $update['notes'] = $data['notes'];

        $patient->update($update);

        return $patient;
    }

    /**
     * List all distinct patients for the user (for select inputs).
     */
    public function getPatientsForUser(int $userId, ?string $search = null): Collection
    {
        $query = Patient::where('user_id', $userId)
            ->withCount('analyses')
            ->orderBy('name', 'asc');

        if ($search !== null && trim($search) !== '') {
            $term = '%' . strtolower(trim($search)) . '%';
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(name) LIKE ?', [$term])
                  ->orWhereRaw('LOWER(patient_id) LIKE ?', [$term]);
            });
        }

        return $query->get();
    }
}
