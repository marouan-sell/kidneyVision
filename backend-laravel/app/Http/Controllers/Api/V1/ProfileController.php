<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService
    ) {}

    /**
     * Get authenticated user profile.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'Radiologist',
                'hospital' => $user->hospital ?? 'Not specified',
                'signature_configured' => (bool) ($user->signature_configured ?? false),
                'is_admin' => (bool) ($user->is_admin ?? false),
                'created_at' => $user->created_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Update profile information.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'hospital' => 'nullable|string|max:255',
            'role' => 'nullable|string|max:100',
            'signature_configured' => 'sometimes|boolean',
        ]);

        $user->update($validated);

        $this->auditLogService->log(
            action: 'profile_updated',
            resourceType: 'User',
            resourceId: (string) $user->id,
            metadata: [
                'updated_fields' => array_keys($validated),
            ],
            user: $user,
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'Radiologist',
                'hospital' => $user->hospital ?? 'Not specified',
                'signature_configured' => (bool) ($user->signature_configured ?? false),
                'is_admin' => (bool) ($user->is_admin ?? false),
            ],
        ]);
    }

    /**
     * Update account password (requires current password).
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', Password::defaults(), 'confirmed'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'The provided current password does not match our records.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        $this->auditLogService->log(
            action: 'password_changed',
            resourceType: 'User',
            resourceId: (string) $user->id,
            user: $user,
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully.',
        ]);
    }

    /**
     * Revoke other or all active sessions/tokens.
     */
    public function revokeSessions(Request $request): JsonResponse
    {
        $user = $request->user();

        // Delete other tokens, preserving current access token if present
        $currentTokenId = $user->currentAccessToken()?->id;

        if ($currentTokenId) {
            $user->tokens()->where('id', '!=', $currentTokenId)->delete();
        } else {
            $user->tokens()->delete();
        }

        $this->auditLogService->log(
            action: 'sessions_revoked',
            resourceType: 'User',
            resourceId: (string) $user->id,
            user: $user,
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'All other active sessions have been revoked successfully.',
        ]);
    }
}
