<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'hospital' => $this->hospital,
            'role' => $this->role ?? 'Radiologist',
            'avatarUrl' => $this->avatar_url,
            'avatar_url' => $this->avatar_url,
            'signature_configured' => (bool) ($this->signature_configured ?? false),
            'signature_url' => $this->signature_url,
            'mfa_enabled' => (bool) ($this->mfa_enabled ?? false),
            'created_at' => $this->created_at->toISOString(),

        ];
    }
}
