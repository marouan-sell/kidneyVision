<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAnalysisRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,png,jpg',
                'mimetypes:image/jpeg,image/png',
                'min:1', // At least 1KB (rejects empty/0-byte files)
                'max:5120', // Max 5MB matching AI model limit
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

                    // Verify image header and dimensions
                    $imageInfo = @getimagesize($realPath);
                    if ($imageInfo === false) {
                        $fail('The file is not a valid decodable image.');
                        return;
                    }

                    // Verify supported MIME
                    $mime = $imageInfo['mime'] ?? '';
                    if (!in_array($mime, ['image/jpeg', 'image/png'], true)) {
                        $fail('Only standard JPEG and PNG image formats are supported by the AI engine.');
                        return;
                    }

                    // Attempt full decode to catch truncated/corrupted payloads
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
            'patientId' => ['nullable', 'string', 'max:50'],
            'patientName' => ['nullable', 'string', 'max:255'],
            'patientAge' => ['nullable', 'integer', 'min:0', 'max:130'],
            'patientGender' => ['nullable', 'string', 'max:50'],
            'location' => ['nullable', 'string', 'max:100'],
            'clinicianNotes' => ['nullable', 'string', 'max:3000'],
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'image.required' => 'A kidney scan image is required.',
            'image.file' => 'The uploaded item must be a valid file.',
            'image.image' => 'The file must be a valid image.',
            'image.mimes' => 'Only JPG, JPEG, and PNG images are supported.',
            'image.mimetypes' => 'Only JPG, JPEG, and PNG MIME types (image/jpeg, image/png) are accepted.',
            'image.min' => 'The uploaded file is empty. Please provide a valid ultrasound scan.',
            'image.max' => 'Image size cannot exceed 5MB (model limit).',
            'image.dimensions' => 'Scan dimensions must be between 32x32 and 4096x4096 pixels.',
        ];
    }
}
