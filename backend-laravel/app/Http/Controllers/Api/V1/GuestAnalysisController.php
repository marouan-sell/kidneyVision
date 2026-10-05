<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Contracts\Services\AIIntegrationServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GuestAnalysisController extends Controller
{
    public function __construct(
        private readonly AIIntegrationServiceInterface $aiService,
    ) {}

    /**
     * Upload kidney image and trigger AI prediction as a guest.
     * Does not save to database.
     *
     * POST /api/guest-predict
     */
    public function predict(Request $request): JsonResponse
    {
        $ip = $request->ip();
        $usageCount = \Illuminate\Support\Facades\Cache::get("guest_uploads_{$ip}", 0);

        if ($usageCount >= 5) {
            return response()->json([
                'success' => false,
                'message' => 'You have reached the limit of 5 free guest analyses. Please create a professional account to continue.'
            ], Response::HTTP_TOO_MANY_REQUESTS);
        }

        $request->validate([
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,png,jpg',
                'mimetypes:image/jpeg,image/png',
                'min:1',
                'max:5120',
                'dimensions:min_width=32,min_height=32,max_width=4096,max_height=4096',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (!$value instanceof \Illuminate\Http\UploadedFile || !$value->isValid()) {
                        $fail('The uploaded file is corrupted or failed to upload completely.');
                        return;
                    }

                    $realPath = $value->getRealPath();
                    if (!$realPath || !file_exists($realPath) || filesize($realPath) === 0) {
                        $fail('The uploaded file is empty or cannot be read.');
                        return;
                    }

                    $imageInfo = @getimagesize($realPath);
                    if ($imageInfo === false) {
                        $fail('The file is not a valid decodable image.');
                        return;
                    }

                    $mime = $imageInfo['mime'] ?? '';
                    if (!in_array($mime, ['image/jpeg', 'image/png'], true)) {
                        $fail('Only standard JPEG and PNG image formats are supported by the AI engine.');
                        return;
                    }

                    if (function_exists('imagecreatefromstring')) {
                        $content = @file_get_contents($realPath);
                        $gd = @imagecreatefromstring($content);
                        if ($gd === false) {
                            $fail('The image file is corrupted or has an invalid byte stream.');
                            return;
                        }
                        imagedestroy($gd);
                    }
                },
            ],
        ], [
            'image.required' => 'A kidney scan image is required.',
            'image.file' => 'The uploaded item must be a valid file.',
            'image.image' => 'The file must be a valid image.',
            'image.mimes' => 'Only JPG, JPEG, and PNG images are supported.',
            'image.mimetypes' => 'Only JPG, JPEG, and PNG MIME types (image/jpeg, image/png) are accepted.',
            'image.min' => 'The uploaded file is empty. Please provide a valid ultrasound scan.',
            'image.max' => 'Image size cannot exceed 5MB (model limit).',
            'image.dimensions' => 'Scan dimensions must be between 32x32 and 4096x4096 pixels.',
        ]);

        // Opportunistically prune temporary guest uploads older than 2 hours
        try {
            $files = \Illuminate\Support\Facades\Storage::disk('public')->files('guest_analyses');
            $cutoff = time() - 7200;
            foreach ($files as $f) {
                if (\Illuminate\Support\Facades\Storage::disk('public')->lastModified($f) < $cutoff) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($f);
                }
            }
        } catch (\Throwable) {
            // Ignore background cleanup errors
        }

        // Store temporarily
        $storedPath = $request->file('image')->store('guest_analyses', 'public');

        try {
            // Trigger AI Prediction
            $result = $this->aiService->predict($storedPath);

            // Increment usage count
            \Illuminate\Support\Facades\Cache::put("guest_uploads_{$ip}", $usageCount + 1, now()->addDays(30));

            return response()->json([
                'success' => true,
                'message' => 'Analysis completed successfully.',
                'data' => [
                    'prediction' => $result->prediction,
                    'confidence' => $result->confidence,
                    'image_url' => asset('storage/' . str_replace('\\', '/', $storedPath)),
                    'heatmap_url' => $result->rawPayload['gradcam_image'] ?? null,
                    'peak_coordinates' => $result->rawPayload['peak_coordinates'] ?? null,
                    'class_probabilities' => $result->rawPayload['class_probabilities'] ?? null,
                    'clinical_assessment' => $result->rawPayload['clinical_assessment'] ?? null,
                    'gate_evaluation' => $result->rawPayload['gate_evaluation'] ?? null,
                    'visualization_url' => $result->rawPayload['visualization_base64'] ?? null,
                    'cleaned_scan_url' => $result->rawPayload['cleaned_scan_base64'] ?? null,
                    'primary_diagnosis' => $result->rawPayload['primary_diagnosis'] ?? null,
                    'telemetry' => $result->rawPayload['telemetry'] ?? null,
                    'usage_count' => $usageCount + 1,
                    'usage_limit' => 5,

                ],
            ], Response::HTTP_OK);
        } catch (\Throwable $e) {
            // Purge rejected/failed scan immediately from server disk
            \Illuminate\Support\Facades\Storage::disk('public')->delete($storedPath);

            $status = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : Response::HTTP_UNPROCESSABLE_ENTITY;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage(),
                'error_code' => $status === 422 ? 'NON_CLINICAL_SCAN' : 'AI_PREDICTION_FAILED',
            ], $status);
        }
    }
}
