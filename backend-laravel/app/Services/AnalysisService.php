<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Repositories\AnalysisRepositoryInterface;
use App\Contracts\Services\AIIntegrationServiceInterface;
use App\Contracts\Services\AnalysisServiceInterface;
use App\DTOs\AnalysisDTO;
use App\Enums\AnalysisStatus;
use App\Exceptions\AnalysisNotFoundException;
use App\Models\Analysis;
use App\Models\Report;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AnalysisService implements AnalysisServiceInterface
{
    public function __construct(
        private readonly AnalysisRepositoryInterface $analysisRepository,
        private readonly AIIntegrationServiceInterface $aiService,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function createAnalysis(AnalysisDTO $dto): Analysis
    {
        // 1. Create analysis record with processing status (committed for clinical audit)
        $analysis = $this->analysisRepository->create([
            'user_id' => $dto->userId,
            'image_path' => $dto->imagePath,
            'original_filename' => $dto->originalFilename,
            'patient_id' => $dto->patientId,
            'patient_name' => $dto->patientName,
            'patient_age' => $dto->patientAge,
            'patient_gender' => $dto->patientGender,
            'anatomical_location' => $dto->anatomicalLocation,
            'clinician_notes' => $dto->clinicianNotes,
            'status' => AnalysisStatus::PROCESSING,
        ]);

        try {
            // 2. Send image to AI service for prediction
            $result = $this->aiService->predict($dto->imagePath);

            $isNormal = strtolower($result->prediction) === 'normal';
            $isUncertain = !$isNormal && ($result->isUncertain || ($result->confidence < 40.0));
            $status = $isUncertain ? AnalysisStatus::REVIEW : AnalysisStatus::COMPLETED;

            // 3. Atomically update analysis and generate report
            DB::transaction(function () use ($analysis, $result, $status, $dto, $isUncertain) {
                $this->analysisRepository->update($analysis, [
                    'prediction' => $result->prediction,
                    'confidence' => $result->confidence,
                    'status' => $status,
                    'ai_response_payload' => $result->rawPayload,
                    'processed_at' => now(),
                ]);

                // 4. Generate report
                $this->generateReport($analysis, $result->prediction, $result->confidence, $dto->clinicianNotes, $isUncertain);
            });

        } catch (\Throwable $e) {
            Log::error('AI prediction failed', [
                'analysis_id' => $analysis->id,
                'error' => $e->getMessage(),
            ]);

            // Persist failed state to database so the record is retained for clinical audit
            $this->analysisRepository->update($analysis, [
                'status' => AnalysisStatus::FAILED,
                'ai_response_payload' => ['error' => $e->getMessage()],
            ]);

            throw $e;
        }

        return $analysis->load('report');
    }

    /**
     * {@inheritDoc}
     */
    public function getAnalysis(int $id, int $userId): Analysis
    {
        $analysis = $this->analysisRepository->findById($id);

        if (!$analysis || $analysis->user_id !== $userId) {
            throw new AnalysisNotFoundException();
        }

        return $analysis;
    }

    /**
     * {@inheritDoc}
     */
    public function getUserAnalyses(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->analysisRepository->findByUser($userId, $perPage);
    }

    /**
     * {@inheritDoc}
     */
    public function deleteAnalysis(int $id, int $userId): bool
    {
        $analysis = $this->getAnalysis($id, $userId);
        return $this->analysisRepository->delete($analysis);
    }

    /**
     * {@inheritDoc}
     */
    public function updateAnalysis(int $id, int $userId, array $data): Analysis
    {
        $analysis = $this->getAnalysis($id, $userId);

        $updateFields = [];
        if (array_key_exists('patientId', $data)) {
            $updateFields['patient_id'] = !empty(trim((string) $data['patientId'])) ? trim((string) $data['patientId']) : null;
        }
        if (array_key_exists('patientName', $data)) {
            $updateFields['patient_name'] = !empty(trim((string) $data['patientName'])) ? trim((string) $data['patientName']) : null;
        }
        if (array_key_exists('patientAge', $data)) {
            $updateFields['patient_age'] = $data['patientAge'] !== null ? (int) $data['patientAge'] : null;
        }
        if (array_key_exists('patientGender', $data)) {
            $updateFields['patient_gender'] = $data['patientGender'];
        }
        if (array_key_exists('location', $data)) {
            $updateFields['anatomical_location'] = $data['location'];
        }
        if (array_key_exists('clinicianNotes', $data)) {
            $updateFields['clinician_notes'] = $data['clinicianNotes'];
        }

        if (!empty($updateFields)) {
            $analysis = $this->analysisRepository->update($analysis, $updateFields);
        }

        if (array_key_exists('clinicianNotes', $data)) {
            $analysis->load('report');
            if ($analysis->report) {
                $analysis->report->update([
                    'clinician_notes' => $data['clinicianNotes']
                ]);
            }
        }

        return $analysis->load('report');
    }

    /**
     * {@inheritDoc}
     */
    public function ensureReportExists(Analysis $analysis): Report
    {
        if ($analysis->report) {
            return $analysis->report;
        }

        $prediction = !empty($analysis->prediction) ? $analysis->prediction : 'Normal';
        $confidence = $analysis->confidence ? (float) $analysis->confidence : 0.0;
        $isNormal = strtolower($prediction) === 'normal';
        $isUncertain = !$isNormal && ($analysis->status->value === 'review' || $confidence < 40.0);

        $this->generateReport($analysis, $prediction, $confidence, $analysis->clinician_notes, $isUncertain);

        $analysis->load('report');
        return $analysis->report;
    }

    /**
     * {@inheritDoc}
     */
    public function confirmAnalysis(int $id, int $userId, ?string $notes = null): Analysis
    {
        $analysis = $this->getAnalysis($id, $userId);

        $updateData = [
            'status' => AnalysisStatus::CONFIRMED,
            'confirmed_at' => now(),
            'confirmed_by' => $userId,
        ];

        if (!empty($notes)) {
            $updateData['clinician_notes'] = $notes;
        }

        $analysis = $this->analysisRepository->update($analysis, $updateData);

        if (!empty($notes)) {
            $analysis->load('report');
            if ($analysis->report) {
                $analysis->report->update([
                    'clinician_notes' => $notes,
                ]);
            }
        }

        return $analysis->load(['report', 'confirmedByUser']);
    }

    /**
     * {@inheritDoc}
     */
    public function flagAnalysis(int $id, int $userId, string $department = 'urology', ?string $reason = null): Analysis
    {
        $analysis = $this->getAnalysis($id, $userId);

        $existingNotes = $analysis->clinician_notes ?? '';
        $timestamp = now()->toDateTimeString();
        $flagNote = "[Flagged for {$department} on {$timestamp}]" . ($reason ? " Reason: {$reason}" : '');
        $combinedNotes = trim($existingNotes ? "{$existingNotes}\n\n{$flagNote}" : $flagNote);

        $updateData = [
            'status' => AnalysisStatus::FLAGGED,
            'flagged_for' => $department,
            'flagged_at' => now(),
            'clinician_notes' => $combinedNotes,
        ];

        $analysis = $this->analysisRepository->update($analysis, $updateData);

        $analysis->load('report');
        if ($analysis->report) {
            $analysis->report->update([
                'clinician_notes' => $combinedNotes,
            ]);
        }

        return $analysis->load(['report', 'confirmedByUser']);
    }

    /**
     * Generate a diagnostic report from the AI prediction.
     */
    private function generateReport(Analysis $analysis, string $prediction, float $confidence, ?string $clinicianNotes = null, bool $isUncertain = false): void
    {
        $recommendations = $this->buildRecommendations($prediction, $confidence, $isUncertain);
        $displayFinding = match (strtolower($prediction)) {
            'stone' => 'Kidney Stone (Nephrolithiasis)',
            'cyst' => 'Renal Cyst (Bosniak I/II)',
            'tumor' => 'Suspicious Renal Mass / Neoplasm Alert',
            default => 'Normal Renal Parenchyma',
        };

        Report::create([
            'analysis_id' => $analysis->id,
            'title' => "Kidney Diagnostic Report — {$displayFinding}",
            'summary' => $this->buildSummary($prediction, $confidence, $isUncertain),
            'recommendations' => $recommendations,
            'clinician_notes' => $clinicianNotes,
            'metadata' => [
                'generated_at' => now()->toISOString(),
                'model_version' => $analysis->ai_response_payload['model_version'] ?? 'ConvNeXt-Tiny Master 4-Class SOTA',
                'is_uncertain' => $isUncertain,
                'task' => 'Multi-Pathology Kidney Diagnostic & Gate System',
                'pathology' => $prediction,
                'class_probabilities' => $analysis->ai_response_payload['class_probabilities'] ?? null,
                'clinical_assessment' => $analysis->ai_response_payload['clinical_assessment'] ?? null,
            ],
        ]);
    }

    /**
     * Build a human-readable summary.
     */
    private function buildSummary(string $prediction, float $confidence, bool $isUncertain = false): string
    {
        $finding = match (strtolower($prediction)) {
            'stone' => 'Nephrolithiasis (Kidney Stone)',
            'cyst' => 'Renal Cyst (Bosniak Classification)',
            'tumor' => 'Suspicious Renal Tissue Mass / Neoplasm',
            default => 'Normal Renal Parenchyma',
        };

        return "AI Multi-Pathology Triage: {$finding} detected with {$confidence}% Detection Confidence. "
             . "This is an automated preliminary screening assessment to assist clinical triage and must be confirmed by a qualified medical professional.";
    }

    /**
     * Build recommendations based on the prediction.
     */
    private function buildRecommendations(string $prediction, float $confidence, bool $isUncertain = false): array
    {
        $base = [
            'All AI triage findings must be reviewed and confirmed by a certified radiologist, nephrologist, or urologist.',
            'Correlate findings with clinical history, serum creatinine, GFR, and urinalysis.',
        ];

        return match (strtolower($prediction)) {
            'stone' => array_merge([
                'High suspicion of nephrolithiasis: Urological consultation recommended.',
                'Assess stone dimensions, location, and potential urinary tract obstruction.',
                'Consider non-contrast CT abdomen/pelvis if ultrasound was initial modality.',
                'Ensure adequate patient hydration and pain management per clinical protocol.',
            ], $base),
            'cyst' => array_merge([
                'Cortical renal cyst identified consistent with benign fluid-filled architecture (Bosniak I/II).',
                'Periodic annual ultrasound monitoring recommended to verify dimensional stability.',
                'Correlate with renal function panel; surgical intervention typically unnecessary unless symptomatic.',
            ], $base),
            'tumor' => array_merge([
                'CRITICAL ALERT: Solid heterogeneous renal mass detected. Immediate specialist referral required.',
                'Order urgent contrast-enhanced multiphasic CT abdomen/pelvis or renal MRI with contrast.',
                'Schedule urgent urological oncology consultation for staging and histological characterization.',
            ], $base),
            'normal' => array_merge([
                'Renal parenchyma appearance is within normal limits; no nephrolithiasis, cyst, or solid mass detected.',
                'If clinical symptoms persist, consider differential diagnosis and non-contrast CT.',
                'Maintain routine preventative renal care and hydration.',
            ], $base),
            default => $base,
        };
    }
}
