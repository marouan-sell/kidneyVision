<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AuditLogService;
use App\Services\TOTPService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class MfaController extends Controller
{
    public function __construct(
        private readonly TOTPService $totpService,
        private readonly AuditLogService $auditLogService
    ) {}

    /**
     * Get MFA status for authenticated clinician.
     * GET /api/profile/mfa
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'mfa_enabled' => (bool) $user->mfa_enabled,
                'confirmed_at' => $user->mfa_confirmed_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Initiate MFA enrollment. Requires current account password.
     * POST /api/profile/mfa/setup
     */
    public function setup(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            $this->auditLogService->log(
                action: 'mfa_setup_rejected',
                resourceType: 'User',
                resourceId: (string) $user->id,
                metadata: ['reason' => 'Invalid current password'],
                user: $user,
                request: $request
            );

            return response()->json([
                'success' => false,
                'message' => 'The provided current password does not match our records.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Generate new secret and recovery codes
        $secret = $this->totpService->generateSecret();
        $recoveryCodes = $this->totpService->generateRecoveryCodes(8);
        $provisioningUri = $this->totpService->getProvisioningUri($user->email, $secret);

        // Store pending configuration without enabling yet (prevents lockouts)
        $user->forceFill([
            'mfa_secret' => $secret,
            'mfa_recovery_codes' => $recoveryCodes,
            'mfa_enabled' => false,
        ])->save();

        $this->auditLogService->log(
            action: 'mfa_enrollment_initiated',
            resourceType: 'User',
            resourceId: (string) $user->id,
            user: $user,
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'MFA enrollment initiated. Scan the QR code or enter the key manually into your authenticator application.',
            'data' => [
                'secret' => $secret,
                'provisioning_uri' => $provisioningUri,
                'recovery_codes' => $recoveryCodes,
            ],
        ]);
    }

    /**
     * Confirm MFA enrollment by verifying a 6-digit TOTP code.
     * POST /api/profile/mfa/confirm
     */
    public function confirm(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        if (!$user->mfa_secret) {
            return response()->json([
                'success' => false,
                'message' => 'MFA enrollment has not been initiated. Please start setup first.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!$this->totpService->verifyCode($user->mfa_secret, $validated['code'])) {
            $this->auditLogService->log(
                action: 'mfa_confirmation_failed',
                resourceType: 'User',
                resourceId: (string) $user->id,
                metadata: ['reason' => 'Invalid verification code'],
                user: $user,
                request: $request
            );

            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code. Please check your authenticator application and try again.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->forceFill([
            'mfa_enabled' => true,
            'mfa_confirmed_at' => now(),
        ])->save();

        $this->auditLogService->log(
            action: 'mfa_enabled',
            resourceType: 'User',
            resourceId: (string) $user->id,
            user: $user,
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Two-factor authentication has been successfully activated for your account.',
            'data' => [
                'mfa_enabled' => true,
                'confirmed_at' => $user->mfa_confirmed_at->toISOString(),
            ],
        ]);
    }

    /**
     * Disable MFA. Requires current password and a valid TOTP or recovery code.
     * POST /api/profile/mfa/disable
     */
    public function disable(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'code' => ['nullable', 'string'],
            'recovery_code' => ['nullable', 'string'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'The provided current password does not match our records.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $authorized = false;

        // Verify with TOTP code
        if (!empty($validated['code']) && $user->mfa_secret) {
            $authorized = $this->totpService->verifyCode($user->mfa_secret, $validated['code']);
        }

        // Or verify with recovery code
        if (!$authorized && !empty($validated['recovery_code']) && is_array($user->mfa_recovery_codes)) {
            $inputCode = strtoupper(trim($validated['recovery_code']));
            foreach ($user->mfa_recovery_codes as $storedCode) {
                if (hash_equals(strtoupper($storedCode), $inputCode)) {
                    $authorized = true;
                    break;
                }
            }
        }

        if (!$authorized) {
            $this->auditLogService->log(
                action: 'mfa_disable_failed',
                resourceType: 'User',
                resourceId: (string) $user->id,
                metadata: ['reason' => 'Invalid TOTP or recovery code'],
                user: $user,
                request: $request
            );

            return response()->json([
                'success' => false,
                'message' => 'Invalid authenticator code or recovery code.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->forceFill([
            'mfa_enabled' => false,
            'mfa_secret' => null,
            'mfa_recovery_codes' => null,
            'mfa_confirmed_at' => null,
        ])->save();

        $this->auditLogService->log(
            action: 'mfa_disabled',
            resourceType: 'User',
            resourceId: (string) $user->id,
            user: $user,
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Two-factor authentication has been disabled.',
            'data' => [
                'mfa_enabled' => false,
            ],
        ]);
    }
}
