<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function __construct(
        private readonly \App\Services\AuditLogService $auditLogService,
        private readonly \App\Services\TOTPService $totpService
    ) {}

    /**
     * Register a new user.
     *
     * POST /api/auth/register
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'hospital' => $validated['hospital'],
            'password' => Hash::make($validated['password']),
        ]);

        $this->auditLogService->log(
            action: 'user_registered',
            resourceType: 'User',
            resourceId: (string) $user->id,
            user: $user,
            request: $request
        );

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful.',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ], Response::HTTP_CREATED);
    }

    /**
     * Authenticate user and issue token (with optional MFA challenge).
     *
     * POST /api/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            $this->auditLogService->log(
                action: 'login_failed',
                resourceType: 'User',
                resourceId: $user ? (string) $user->id : 'unknown',
                metadata: ['email' => $validated['email']],
                request: $request
            );

            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Check if user has MFA enabled
        if ($user->mfa_enabled) {
            $mfaCode = $request->input('mfa_code');
            $recoveryCode = $request->input('recovery_code');

            // If neither code is supplied, return challenge response
            if (empty($mfaCode) && empty($recoveryCode)) {
                return response()->json([
                    'success' => true,
                    'message' => 'Two-factor authentication required.',
                    'data' => [
                        'mfa_required' => true,
                        'email' => $user->email,
                    ],
                ]);
            }

            $mfaPassed = false;
            $usedRecovery = false;

            if (!empty($mfaCode) && $user->mfa_secret) {
                $mfaPassed = $this->totpService->verifyCode($user->mfa_secret, (string) $mfaCode);
            }

            if (!$mfaPassed && !empty($recoveryCode) && is_array($user->mfa_recovery_codes)) {
                $inputRecCode = strtoupper(trim((string) $recoveryCode));
                $remainingCodes = [];
                foreach ($user->mfa_recovery_codes as $code) {
                    if (!$mfaPassed && hash_equals(strtoupper($code), $inputRecCode)) {
                        $mfaPassed = true;
                        $usedRecovery = true;
                    } else {
                        $remainingCodes[] = $code;
                    }
                }

                if ($usedRecovery) {
                    $user->forceFill(['mfa_recovery_codes' => $remainingCodes])->save();
                    $this->auditLogService->log(
                        action: 'mfa_recovery_code_consumed',
                        resourceType: 'User',
                        resourceId: (string) $user->id,
                        user: $user,
                        request: $request
                    );
                }
            }

            if (!$mfaPassed) {
                $this->auditLogService->log(
                    action: 'login_mfa_failed',
                    resourceType: 'User',
                    resourceId: (string) $user->id,
                    metadata: ['type' => !empty($mfaCode) ? 'totp' : 'recovery_code'],
                    user: $user,
                    request: $request
                );

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid two-factor authentication code or recovery code.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        // Revoke previous tokens for security
        $user->tokens()->delete();

        $token = $user->createToken('auth-token')->plainTextToken;

        $this->auditLogService->log(
            action: 'user_login',
            resourceType: 'User',
            resourceId: (string) $user->id,
            user: $user,
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }


    /**
     * Revoke the current access token (logout).
     *
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        $this->auditLogService->log(
            action: 'user_logout',
            resourceType: 'User',
            resourceId: (string) $user->id,
            user: $user,
            request: $request
        );

        $user->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Get the authenticated user.
     *
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => new UserResource($request->user()),
            ],
        ]);
    }
}
