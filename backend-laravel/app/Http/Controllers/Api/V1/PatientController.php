<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Services\PatientService;
use App\Services\AuditLogService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class PatientController extends Controller
{
    public function __construct(
        private readonly PatientService $patientService,
        private readonly AuditLogService $auditLogService,
    ) {}

    /**
     * Paginated Patient Directory with search and multi-criteria filters.
     * GET /api/patients
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'per_page' => $request->integer('per_page', 10),
            'search' => $request->string('search')->trim()->value(),
            'filter_visit' => $request->string('filter_visit', 'all')->value(),
            'filter_review' => $request->string('filter_review', 'all')->value(),
            'filter_follow_up' => $request->string('filter_follow_up', 'all')->value(),
        ];

        $paginator = $this->patientService->getPatientsDirectory(
            (int) $request->user()->id,
            $filters
        );

        $this->auditLogService->log(
            action: 'patient_directory_viewed',
            resourceType: 'Patient',
            metadata: [
                'has_search' => !empty($filters['search']),
                'total_records' => $paginator->total(),
            ],
            user: $request->user(),
            request: $request
        );

        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Lightweight list of all patients for dropdowns and select inputs.
     * GET /api/patients/list
     */
    public function listAll(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->value();
        $patients = $this->patientService->getPatientsForUser(
            (int) $request->user()->id,
            $search !== '' ? $search : null
        );

        return response()->json([
            'success' => true,
            'data' => $patients,
        ]);
    }

    /**
     * Aggregate follow-up center statistics for authenticated user.
     * GET /api/patients/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $stats = $this->patientService->getFollowUpStatistics((int) $request->user()->id);

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Preview the next automatic Patient ID.
     * GET /api/patients/next-id
     */
    public function nextId(): JsonResponse
    {
        $nextId = $this->patientService->generateUniquePatientId();

        return response()->json([
            'success' => true,
            'data' => [
                'next_patient_id' => $nextId,
            ],
        ]);
    }

    /**
     * Create a new patient manually.
     * POST /api/patients
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'patient_id' => 'nullable|string|max:50',
            'age' => 'nullable|integer|min:0|max:130',
            'gender' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
            'notes' => 'nullable|string',
        ]);

        $patient = $this->patientService->createPatient((int) $request->user()->id, $validated);

        $this->auditLogService->log(
            action: 'patient_created',
            resourceType: 'Patient',
            resourceId: (string) $patient->id,
            metadata: [
                'patient_id' => $patient->patient_id,
                'name' => $patient->name,
            ],
            user: $request->user(),
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Patient record created successfully.',
            'data' => $patient,
        ], Response::HTTP_CREATED);
    }

    /**
     * Get complete profile and tabs data for a patient.
     * GET /api/patients/{patient_id}
     */
    public function show(Request $request, string $patientId): JsonResponse
    {
        $patient = Patient::where('patient_id', $patientId)->first();

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient record not found.',
                'error_code' => 'PATIENT_NOT_FOUND',
            ], Response::HTTP_NOT_FOUND);
        }

        $this->authorize('view', $patient);

        $profile = $this->patientService->getPatientProfile((int) $request->user()->id, $patientId);

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Patient record not found.',
                'error_code' => 'PATIENT_NOT_FOUND',
            ], Response::HTTP_NOT_FOUND);
        }

        $this->auditLogService->log(
            action: 'patient_viewed',
            resourceType: 'Patient',
            resourceId: (string) $patient->id,
            metadata: [
                'patient_id' => $patient->patient_id,
            ],
            user: $request->user(),
            request: $request
        );

        return response()->json([
            'success' => true,
            'data' => $profile,
        ]);
    }

    /**
     * Update patient demographics and clinical notes.
     * PUT /api/patients/{patient_id}
     */
    public function update(Request $request, string $patientId): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'age' => 'nullable|integer|min:0|max:130',
            'gender' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
            'notes' => 'nullable|string',
        ]);

        try {
            $patient = $this->patientService->updatePatient((int) $request->user()->id, $patientId, $validated);

            $this->auditLogService->log(
                action: 'patient_updated',
                resourceType: 'Patient',
                resourceId: (string) $patient->id,
                metadata: [
                    'patient_id' => $patient->patient_id,
                ],
                user: $request->user(),
                request: $request
            );

            return response()->json([
                'success' => true,
                'message' => 'Patient record updated successfully.',
                'data' => $patient,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json([
                'success' => false,
                'message' => 'Patient record not found.',
                'error_code' => 'PATIENT_NOT_FOUND',
            ], Response::HTTP_NOT_FOUND);
        }
    }

    /**
     * Schedule a new follow-up appointment.
     * POST /api/patients/{patient_id}/follow-ups
     */
    public function scheduleFollowUp(Request $request, string $patientId): JsonResponse
    {
        $validated = $request->validate([
            'follow_up_date' => 'required|date',
            'reason' => 'required|string|max:255',
            'status' => 'nullable|string|in:scheduled,completed,cancelled',
            'clinical_notes' => 'nullable|string',
        ]);

        try {
            $followUp = $this->patientService->createFollowUp((int) $request->user()->id, $patientId, $validated);

            $this->auditLogService->log(
                action: 'follow_up_scheduled',
                resourceType: 'PatientFollowUp',
                resourceId: (string) $followUp->id,
                metadata: [
                    'patient_id' => $patientId,
                    'follow_up_date' => $followUp->follow_up_date->toISOString(),
                ],
                user: $request->user(),
                request: $request
            );

            return response()->json([
                'success' => true,
                'message' => 'Follow-up appointment scheduled successfully.',
                'data' => $followUp,
            ], Response::HTTP_CREATED);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json([
                'success' => false,
                'message' => 'Patient record not found.',
                'error_code' => 'PATIENT_NOT_FOUND',
            ], Response::HTTP_NOT_FOUND);
        }
    }

    /**
     * Update a follow-up appointment (e.g. mark completed, change date or notes).
     * PUT /api/patients/{patient_id}/follow-ups/{followUpId}
     */
    public function updateFollowUp(Request $request, string $patientId, int $followUpId): JsonResponse
    {
        $validated = $request->validate([
            'follow_up_date' => 'nullable|date',
            'reason' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:scheduled,completed,cancelled',
            'clinical_notes' => 'nullable|string',
        ]);

        try {
            $followUp = $this->patientService->updateFollowUp((int) $request->user()->id, $followUpId, $validated);

            $this->auditLogService->log(
                action: 'follow_up_updated',
                resourceType: 'PatientFollowUp',
                resourceId: (string) $followUp->id,
                metadata: [
                    'patient_id' => $patientId,
                    'status' => $followUp->status,
                ],
                user: $request->user(),
                request: $request
            );

            return response()->json([
                'success' => true,
                'message' => 'Follow-up appointment updated successfully.',
                'data' => $followUp,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json([
                'success' => false,
                'message' => 'Follow-up record not found.',
                'error_code' => 'FOLLOW_UP_NOT_FOUND',
            ], Response::HTTP_NOT_FOUND);
        }
    }

    /**
     * Delete a follow-up appointment.
     * DELETE /api/patients/{patient_id}/follow-ups/{followUpId}
     */
    public function deleteFollowUp(Request $request, string $patientId, int $followUpId): JsonResponse
    {
        try {
            $this->patientService->deleteFollowUp((int) $request->user()->id, $followUpId);

            return response()->json([
                'success' => true,
                'message' => 'Follow-up appointment removed.',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json([
                'success' => false,
                'message' => 'Follow-up record not found.',
                'error_code' => 'FOLLOW_UP_NOT_FOUND',
            ], Response::HTTP_NOT_FOUND);
        }
    }

    /**
     * Compare two scans belonging to the same patient side by side.
     * GET /api/patients/{patient_id}/compare?scan1={id}&scan2={id}
     */
    public function compareScans(Request $request, string $patientId): JsonResponse
    {
        $scan1 = $request->integer('scan1');
        $scan2 = $request->integer('scan2');

        if (!$scan1 || !$scan2 || $scan1 === $scan2) {
            return response()->json([
                'success' => false,
                'message' => 'Please select two distinct scans to compare.',
                'error_code' => 'INVALID_COMPARISON_SELECTION',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $comparison = $this->patientService->getScanComparison(
                (int) $request->user()->id,
                $patientId,
                $scan1,
                $scan2
            );

            return response()->json([
                'success' => true,
                'data' => $comparison,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json([
                'success' => false,
                'message' => 'One or both scans could not be found for this patient.',
                'error_code' => 'SCANS_NOT_FOUND',
            ], Response::HTTP_NOT_FOUND);
        }
    }

    /**
     * Generate & stream/download comprehensive Patient Longitudinal History PDF report.
     * GET /api/patients/{patient_id}/history/pdf
     */
    public function downloadHistoryPdf(Request $request, string $patientId)
    {
        $patient = Patient::where('patient_id', $patientId)
            ->with(['analyses' => function ($q) {
                $q->orderBy('created_at', 'desc')->with('report');
            }, 'followUps' => function ($q) {
                $q->orderBy('follow_up_date', 'desc');
            }])
            ->first();

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient record not found.',
                'error_code' => 'PATIENT_NOT_FOUND',
            ], Response::HTTP_NOT_FOUND);
        }

        $this->authorize('view', $patient);

        $user = $request->user();
        $signatureBase64 = null;
        if ($user && $user->signature_configured && $user->signature_path) {
            $sigPath = $user->signature_path;
            if (\Illuminate\Support\Facades\Storage::disk('private')->exists($sigPath)) {
                $sigBytes = \Illuminate\Support\Facades\Storage::disk('private')->get($sigPath);
                $signatureBase64 = 'data:image/png;base64,' . base64_encode($sigBytes);
            } elseif (\Illuminate\Support\Facades\Storage::disk('public')->exists($sigPath)) {
                $sigBytes = \Illuminate\Support\Facades\Storage::disk('public')->get($sigPath);
                $signatureBase64 = 'data:image/png;base64,' . base64_encode($sigBytes);
            }
        }

        $analyses = $patient->analyses;
        $firstVisit = $analyses->last()?->created_at ?? $patient->created_at;
        $lastVisit = $analyses->first()?->created_at ?? $patient->created_at;

        $pdf = Pdf::loadView('pdf.patient_history', [
            'patient' => $patient,
            'analyses' => $analyses,
            'followUps' => $patient->followUps,
            'firstVisit' => $firstVisit,
            'lastVisit' => $lastVisit,
            'user' => $user,
            'signatureBase64' => $signatureBase64,
        ]);

        $this->auditLogService->log(
            action: 'patient_history_pdf_downloaded',
            resourceType: 'Patient',
            resourceId: (string) $patient->id,
            metadata: [
                'patient_id' => $patient->patient_id,
            ],
            user: $request->user(),
            request: $request
        );

        $filename = "patient_history_{$patient->patient_id}.pdf";
        return $request->boolean('preview') ? $pdf->stream($filename) : $pdf->download($filename);
    }
}
