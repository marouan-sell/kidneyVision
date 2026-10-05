<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAnalysisRequest extends FormRequest
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
            'patientId' => ['nullable', 'string', 'max:50'],
            'patientName' => ['nullable', 'string', 'max:255'],
            'patientAge' => ['nullable', 'integer', 'min:0', 'max:130'],
            'patientGender' => ['nullable', 'string', 'max:50'],
            'location' => ['nullable', 'string', 'max:100'],
            'clinicianNotes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
