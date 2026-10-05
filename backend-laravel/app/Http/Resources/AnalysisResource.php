<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnalysisResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'image_url' => $this->image_url,
            'original_filename' => $this->original_filename,
            'patient_id' => $this->patient_id ?? ('PT-' . str_pad((string) $this->id, 4, '0', STR_PAD_LEFT)),
            'patient_name' => $this->patient_name ?? $this->original_filename,
            'patient_age' => $this->patient_age,
            'patient_gender' => $this->patient_gender,
            'anatomical_location' => $this->anatomical_location,
            'clinician_notes' => $this->clinician_notes ?? $this->report?->clinician_notes,
            'prediction' => $this->prediction,
            'confidence' => $this->confidence,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'status_color' => $this->status?->color(),
            'report' => new ReportResource($this->whenLoaded('report')),
            'heatmap_url' => $this->ai_response_payload['gradcam_image'] ?? null,
            'peak_coordinates' => $this->ai_response_payload['peak_coordinates'] ?? null,
            'class_probabilities' => $this->ai_response_payload['class_probabilities'] ?? null,
            'clinical_assessment' => $this->ai_response_payload['clinical_assessment'] ?? null,
            'gate_evaluation' => $this->ai_response_payload['gate_evaluation'] ?? null,
            'visualization_url' => $this->ai_response_payload['visualization_base64'] ?? null,
            'cleaned_scan_url' => $this->ai_response_payload['cleaned_scan_base64'] ?? null,
            'primary_diagnosis' => $this->ai_response_payload['primary_diagnosis'] ?? null,
            'telemetry' => $this->ai_response_payload['telemetry'] ?? null,
            'model_version' => $this->ai_response_payload['model_version'] ?? null,
            'processed_at' => $this->processed_at?->toISOString(),
            'confirmed_at' => $this->confirmed_at?->toISOString(),
            'confirmed_by' => $this->confirmed_by,
            'confirmed_by_name' => $this->confirmedByUser?->name,
            'flagged_for' => $this->flagged_for,
            'flagged_at' => $this->flagged_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
