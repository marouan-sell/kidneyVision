<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Contracts\Services\AnalysisServiceInterface;
use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class PDFReportController extends Controller
{
    public function __construct(
        private readonly AnalysisServiceInterface $analysisService,
        private readonly \App\Services\AuditLogService $auditLogService,
    ) {}

    public function download(Request $request, int $id)
    {
        try {
            $analysis = $this->analysisService->getAnalysis($id, $request->user()->id);
            $analysis->load('report');

            if (!$analysis->report) {
                $this->analysisService->ensureReportExists($analysis);
                $analysis->load('report');
            }

            if (!$analysis->report) {
                return response()->json([
                    'success' => false,
                    'message' => 'Report not yet generated for this analysis.'
                ], 404);
            }

            $this->auditLogService->log(
                action: 'report_downloaded',
                resourceType: 'Report',
                resourceId: (string) ($analysis->report->id ?? $analysis->id),
                metadata: [
                    'analysis_id' => $analysis->id,
                ],
                user: $request->user(),
                request: $request
            );

            // Generate PDF using DOMPDF
            $pdf = Pdf::loadView('pdf.report', [
                'analysis' => $analysis,
                'user' => $request->user()
            ]);

            return $pdf->download("kidneyvision_report_{$analysis->id}.pdf");

        } catch (\App\Exceptions\AnalysisNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Analysis not found.',
                'error_code' => 'ANALYSIS_NOT_FOUND',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Failed to generate PDF report', [
                'analysis_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF report.'
            ], 500);
        }
    }

    /**
     * Stream PDF report inline for in-app preview modal/iframe.
     * Enforces ownership authorization.
     */
    public function preview(Request $request, int $id)
    {
        try {
            $analysis = $this->analysisService->getAnalysis($id, $request->user()->id);
            $analysis->load('report');

            if (!$analysis->report) {
                $this->analysisService->ensureReportExists($analysis);
                $analysis->load('report');
            }

            if (!$analysis->report) {
                return response()->json([
                    'success' => false,
                    'message' => 'Report not yet generated for this analysis.'
                ], 404);
            }

            $this->auditLogService->log(
                action: 'report_viewed',
                resourceType: 'Report',
                resourceId: (string) ($analysis->report->id ?? $analysis->id),
                metadata: [
                    'analysis_id' => $analysis->id,
                ],
                user: $request->user(),
                request: $request
            );

            // Stream PDF inline for browser/iframe preview
            $pdf = Pdf::loadView('pdf.report', [
                'analysis' => $analysis,
                'user' => $request->user()
            ]);

            return $pdf->stream("kidneyvision_report_{$analysis->id}.pdf");

        } catch (\App\Exceptions\AnalysisNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Analysis not found.',
                'error_code' => 'ANALYSIS_NOT_FOUND',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Failed to preview PDF report', [
                'analysis_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to preview PDF report.'
            ], 500);
        }
    }
}
