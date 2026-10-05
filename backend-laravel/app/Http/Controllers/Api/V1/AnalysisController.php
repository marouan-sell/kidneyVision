<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnalysisRequest;
use App\Http\Resources\AnalysisCollection;
use App\Http\Resources\AnalysisResource;
use App\Contracts\Services\AnalysisServiceInterface;
use App\DTOs\AnalysisDTO;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AnalysisController extends Controller
{
    public function __construct(
        private readonly AnalysisServiceInterface $analysisService,
        private readonly \App\Services\AuditLogService $auditLogService,
    ) {}

    /**
     * Upload kidney image and trigger AI prediction.
     *
     * POST /api/predict
     */
    public function predict(StoreAnalysisRequest $request): JsonResponse
    {
        $storedPath = $request->file('image')->store('analyses', 'public');

        $dto = AnalysisDTO::fromRequest($request, $storedPath);

        try {
            $analysis = $this->analysisService->createAnalysis($dto);
        } catch (\Throwable $e) {
            $statusCode = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : Response::HTTP_UNPROCESSABLE_ENTITY;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage(),
                'error_code' => $statusCode === 422 ? 'NON_CLINICAL_SCAN' : 'AI_SERVICE_ERROR',
            ], $statusCode);
        }

        $this->auditLogService->log(
            action: 'analysis_created',
            resourceType: 'Analysis',
            resourceId: (string) $analysis->id,
            metadata: [
                'prediction' => $analysis->prediction,
                'confidence' => $analysis->confidence,
                'patient_id' => $analysis->patient_id,
            ],
            user: $request->user(),
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Analysis completed successfully.',
            'data' => new AnalysisResource($analysis),
        ], Response::HTTP_CREATED);
    }

    /**
     * Get paginated list of user's analyses.
     *
     * GET /api/analyses
     */
    public function index(Request $request): AnalysisCollection
    {
        $perPage = $request->integer('per_page', 15);
        $analyses = $this->analysisService->getUserAnalyses(
            (int) $request->user()->id,
            $perPage,
        );

        return new AnalysisCollection($analyses);
    }

    /**
     * Get a single analysis by ID.
     *
     * GET /api/analyses/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $analysis = $this->analysisService->getAnalysis(
            $id,
            (int) $request->user()->id,
        );

        $this->auditLogService->log(
            action: 'analysis_viewed',
            resourceType: 'Analysis',
            resourceId: (string) $analysis->id,
            user: $request->user(),
            request: $request
        );

        return response()->json([
            'success' => true,
            'data' => new AnalysisResource($analysis),
        ]);
    }

    /**
     * Delete an analysis (soft delete).
     *
     * DELETE /api/analyses/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->analysisService->deleteAnalysis(
            $id,
            (int) $request->user()->id,
        );

        $this->auditLogService->log(
            action: 'analysis_deleted',
            resourceType: 'Analysis',
            resourceId: (string) $id,
            user: $request->user(),
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Analysis deleted successfully.',
        ]);
    }

    /**
     * Update an analysis (patient metadata / notes).
     *
     * PUT/PATCH /api/analyses/{id}
     */
    public function update(\App\Http\Requests\UpdateAnalysisRequest $request, int $id): JsonResponse
    {
        $analysis = $this->analysisService->updateAnalysis(
            $id,
            (int) $request->user()->id,
            $request->validated(),
        );

        $this->auditLogService->log(
            action: 'clinician_notes_updated',
            resourceType: 'Analysis',
            resourceId: (string) $analysis->id,
            metadata: [
                'has_notes' => !empty($analysis->clinician_notes),
            ],
            user: $request->user(),
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Analysis updated successfully.',
            'data' => new AnalysisResource($analysis),
        ]);
    }

    /**
     * Securely stream the analysis ultrasound scan image for authorized owner only.
     *
     * GET /api/analyses/{id}/image
     */
    public function image(Request $request, int $id)
    {
        $analysis = $this->analysisService->getAnalysis(
            $id,
            (int) $request->user()->id,
        );

        $cleanPath = str_replace(['..', '\\'], ['', '/'], (string) $analysis->image_path);
        $path = storage_path('app/public/' . $cleanPath);

        if (!file_exists($path) || is_dir($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Image file not found on server.',
            ], 404);
        }

        return response()->file($path, [
            'Cache-Control' => 'private, max-age=3600',
            'Access-Control-Allow-Origin' => '*',
        ]);
    }

    /**
     * Sign and confirm an analysis by clinician.
     *
     * POST /api/analyses/{id}/confirm
     */
    public function confirm(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'notes' => ['nullable', 'string', 'max:3000'],
        ]);

        $analysis = $this->analysisService->confirmAnalysis(
            $id,
            (int) $request->user()->id,
            $request->input('notes')
        );

        $this->auditLogService->log(
            action: 'clinician_confirmed_finding',
            resourceType: 'Analysis',
            resourceId: (string) $analysis->id,
            metadata: [
                'confirmed_by' => $request->user()->id,
                'has_notes' => !empty($request->input('notes')),
            ],
            user: $request->user(),
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Analysis confirmed and signed by clinician.',
            'data' => new AnalysisResource($analysis),
        ]);
    }

    /**
     * Flag an analysis for specialist triage consultation.
     *
     * POST /api/analyses/{id}/flag
     */
    public function flag(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'department' => ['nullable', 'string', 'max:50'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $department = $request->input('department', 'urology');
        $reason = $request->input('reason');

        $analysis = $this->analysisService->flagAnalysis(
            $id,
            (int) $request->user()->id,
            $department,
            $reason
        );

        $this->auditLogService->log(
            action: 'analysis_flagged_for_consultation',
            resourceType: 'Analysis',
            resourceId: (string) $analysis->id,
            metadata: [
                'department' => $department,
                'reason' => $reason,
            ],
            user: $request->user(),
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => "Analysis successfully flagged for {$department} triage consultation.",
            'data' => new AnalysisResource($analysis),
        ]);
    }
}
