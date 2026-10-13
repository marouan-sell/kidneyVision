<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\PatientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function __construct(
        private readonly PatientService $patientService,
    ) {}

    /**
     * Get list of unique patients for authenticated user.
     * GET /api/patients
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->toString();
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
}
