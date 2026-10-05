<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Http\Requests\StoreAnalysisRequest;

final readonly class AnalysisDTO
{
    public function __construct(
        public string $imagePath,
        public string $originalFilename,
        public int $userId,
        public ?string $patientId = null,
        public ?string $patientName = null,
        public ?int $patientAge = null,
        public ?string $patientGender = null,
        public ?string $anatomicalLocation = null,
        public ?string $clinicianNotes = null,
    ) {}

    /**
     * Create DTO from a validated request.
     */
    public static function fromRequest(StoreAnalysisRequest $request, string $storedPath): self
    {
        $rawFilename = $request->file('image')->getClientOriginalName();
        $cleanFilename = preg_replace('/[^\w\.\-\s]/', '', basename(strip_tags($rawFilename)));
        $cleanFilename = trim((string) $cleanFilename) ?: 'scan_' . time() . '.jpg';

        return new self(
            imagePath: $storedPath,
            originalFilename: $cleanFilename,
            userId: (int) $request->user()->id,
            patientId: $request->filled('patientId') ? trim((string) $request->input('patientId')) : null,
            patientName: $request->filled('patientName') ? trim((string) $request->input('patientName')) : null,
            patientAge: $request->filled('patientAge') ? (int) $request->input('patientAge') : null,
            patientGender: $request->input('patientGender'),
            anatomicalLocation: $request->input('location'),
            clinicianNotes: $request->input('clinicianNotes'),
        );
    }
}
