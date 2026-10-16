<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
                'avatar_url' => $user->avatar_url,
                'signature_configured' => (bool) ($user->signature_configured ?? false),
                'signature_url' => $user->signature_url,
                'signature_updated_at' => $user->signature_updated_at?->toISOString(),
                'is_admin' => (bool) ($user->is_admin ?? false),
                'mfa_enabled' => (bool) ($user->mfa_enabled ?? false),
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
                'avatar_url' => $user->avatar_url,
                'signature_configured' => (bool) ($user->signature_configured ?? false),
                'signature_url' => $user->signature_url,
                'signature_updated_at' => $user->signature_updated_at?->toISOString(),
                'is_admin' => (bool) ($user->is_admin ?? false),
                'mfa_enabled' => (bool) ($user->mfa_enabled ?? false),
            ],
        ]);

    }

    /**
     * Upload and update clinician profile avatar picture.
     * POST /api/profile/avatar
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'avatar' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,png,jpg,webp',
                'max:2048', // 2MB limit
            ],
        ], [
            'avatar.required' => 'Please select a profile image to upload.',
            'avatar.image' => 'The selected file must be a valid image.',
            'avatar.mimes' => 'Profile pictures must be in JPG, PNG, or WebP format.',
            'avatar.max' => 'Profile image cannot exceed 2MB in file size.',
        ]);

        $file = $request->file('avatar');

        // Delete old avatar if present
        if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $storedPath = $file->storeAs('avatars', $filename, 'public');

        $user->update([
            'avatar_path' => $storedPath,
        ]);

        $this->auditLogService->log(
            action: 'avatar_updated',
            resourceType: 'User',
            resourceId: (string) $user->id,
            user: $user,
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile picture updated successfully.',
            'data' => [
                'avatar_url' => $user->avatar_url,
            ],
        ]);
    }

    /**
     * Remove clinician profile picture.
     * DELETE /api/profile/avatar
     */
    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->update([
            'avatar_path' => null,
        ]);

        $this->auditLogService->log(
            action: 'avatar_removed',
            resourceType: 'User',
            resourceId: (string) $user->id,
            user: $user,
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile picture removed successfully.',
            'data' => [
                'avatar_url' => null,
            ],
        ]);
    }

    /**
     * Save / configure radiologist electronic signature.
     * Accepts either drawn canvas base64 image string or file upload.
     * POST /api/profile/signature
     */
    public function updateSignature(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. Check if signature was provided as base64 data URI string
        if ($request->filled('signature') && is_string($request->input('signature'))) {
            $rawSignature = (string) $request->input('signature');
            if (!str_starts_with($rawSignature, 'data:image/png;base64,')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid signature format. Signature must be a valid PNG image data stream.',
                ], 422);
            }

            $binaryData = base64_decode(substr($rawSignature, 22));
            if ($binaryData === false || strlen($binaryData) < 100) {
                return response()->json([
                    'success' => false,
                    'message' => 'The provided signature canvas is blank or invalid.',
                ], 422);
            }

            // Size cap at 1MB
            if (strlen($binaryData) > 1048576) {
                return response()->json([
                    'success' => false,
                    'message' => 'Signature size exceeds maximum limit (1MB).',
                ], 422);
            }

            // Delete old signature if present
            if ($user->signature_path) {
                if (Storage::disk('private')->exists($user->signature_path)) {
                    Storage::disk('private')->delete($user->signature_path);
                }
                if (Storage::disk('public')->exists($user->signature_path)) {
                    Storage::disk('public')->delete($user->signature_path);
                }
            }

            $filename = 'sig_' . $user->id . '_' . time() . '.png';
            $path = 'signatures/' . $filename;
            Storage::disk('private')->put($path, $binaryData);

            $user->update([
                'signature_configured' => true,
                'signature_path' => $path,
                'signature_updated_at' => now(),
            ]);

        } elseif ($request->hasFile('signature')) {
            // 2. Uploaded signature file
            $request->validate([
                'signature' => 'file|image|mimes:png,jpeg,jpg|max:1024',
            ]);

            $file = $request->file('signature');
            if ($user->signature_path) {
                if (Storage::disk('private')->exists($user->signature_path)) {
                    Storage::disk('private')->delete($user->signature_path);
                }
                if (Storage::disk('public')->exists($user->signature_path)) {
                    Storage::disk('public')->delete($user->signature_path);
                }
            }

            $filename = 'sig_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('signatures', $filename, 'private');

            $user->update([
                'signature_configured' => true,
                'signature_path' => $path,
                'signature_updated_at' => now(),
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'No signature drawing data or file provided.',
            ], 422);
        }

        $this->auditLogService->log(
            action: 'signature_configured',
            resourceType: 'User',
            resourceId: (string) $user->id,
            user: $user,
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Radiologist signature successfully configured and secured.',
            'data' => [
                'signature_configured' => true,
                'signature_url' => $user->signature_url,
                'signature_updated_at' => $user->signature_updated_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Securely stream authenticated clinician signature image.
     *
     * GET /api/profile/signature
     */
    public function streamSignature(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->signature_configured || !$user->signature_path) {
            return response()->json([
                'success' => false,
                'message' => 'Signature not configured.',
            ], 404);
        }

        $cleanPath = str_replace(['..', '\\'], ['', '/'], (string) $user->signature_path);
        $cleanPath = ltrim($cleanPath, '/');

        // Check private storage first, fallback to legacy public path
        $path = storage_path('app/private/' . $cleanPath);
        if (!file_exists($path) || is_dir($path)) {
            $path = storage_path('app/public/' . $cleanPath);
        }

        if (!file_exists($path) || is_dir($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Signature file not found on server.',
            ], 404);
        }

        return response()->file($path, [
            'Cache-Control' => 'private, no-cache, no-store, must-revalidate',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /**
     * Remove configured radiologist signature.
     * DELETE /api/profile/signature
     */
    public function deleteSignature(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->signature_path) {
            if (Storage::disk('private')->exists($user->signature_path)) {
                Storage::disk('private')->delete($user->signature_path);
            }
            if (Storage::disk('public')->exists($user->signature_path)) {
                Storage::disk('public')->delete($user->signature_path);
            }
        }

        $user->update([
            'signature_configured' => false,
            'signature_path' => null,
            'signature_updated_at' => null,
        ]);

        $this->auditLogService->log(
            action: 'signature_removed',
            resourceType: 'User',
            resourceId: (string) $user->id,
            user: $user,
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Radiologist signature removed successfully.',
            'data' => [
                'signature_configured' => false,
                'signature_url' => null,
                'signature_updated_at' => null,
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
