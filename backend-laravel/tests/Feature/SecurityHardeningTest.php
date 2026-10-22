<?php

namespace Tests\Feature;

use App\Models\Analysis;
use App\Models\AuditLog;
use App\Models\Patient;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\TOTPService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test 1: Private Storage Isolation & Unauthenticated Access Rejection
     */
    public function test_unauthenticated_requests_cannot_access_protected_images(): void
    {
        $response = $this->getJson('/api/analyses/1/image');
        $response->assertStatus(401);
    }

    /**
     * Test 2: Object-Level Authorization & IDOR Prevention
     */
    public function test_clinicians_cannot_access_or_modify_other_clinicians_analyses_without_permission(): void
    {
        $user1 = User::create([
            'name' => 'Dr. Alice',
            'email' => 'alice@hospital.org',
            'password' => Hash::make('Password123!'),
            'role' => 'Radiologist',
            'is_admin' => false,
        ]);

        $user2 = User::create([
            'name' => 'Dr. Bob',
            'email' => 'bob@hospital.org',
            'password' => Hash::make('Password123!'),
            'role' => 'Radiologist',
            'is_admin' => false,
        ]);

        $analysis = Analysis::create([
            'user_id' => $user1->id,
            'image_path' => 'analyses/alice_scan.jpg',
            'original_filename' => 'alice_scan.jpg',
            'prediction' => 'Normal',
            'confidence' => 95.0,
            'status' => 'completed',
        ]);

        // Acting as user2 (Dr. Bob) trying to access Dr. Alice's analysis -> IDOR prevented
        $response = $this->actingAs($user2)->getJson("/api/analyses/{$analysis->id}");
        $this->assertTrue(in_array($response->status(), [403, 404], true));

        // Create a patient owned by Alice
        $patient = Patient::create([
            'user_id' => $user1->id,
            'patient_id' => 'PT-IDOR-01',
            'name' => 'Alice Patient',
            'status' => 'active',
        ]);

        // Acting as user2 trying to access Alice's patient -> PatientPolicy returns 403 Forbidden
        $patientResponse = $this->actingAs($user2)->getJson("/api/patients/{$patient->patient_id}");
        $patientResponse->assertStatus(403);
    }


    /**
     * Test 3: PHI Field Encryption at Rest
     */
    public function test_patient_phi_fields_are_encrypted_at_rest_in_database(): void
    {
        $user = User::create([
            'name' => 'Dr. Carol',
            'email' => 'carol@hospital.org',
            'password' => Hash::make('Password123!'),
        ]);

        $patient = Patient::create([
            'user_id' => $user->id,
            'patient_id' => 'PT-99001',
            'name' => 'John Confidential Doe',
            'phone' => '+1-555-0199',
            'email' => 'johndoe@privatemail.com',
            'notes' => 'Highly sensitive medical observation.',
            'gender' => 'Male',
            'age' => 45,
            'status' => 'active',
        ]);

        // Read raw database row directly bypassing Eloquent casts
        $raw = DB::table('patients')->where('id', $patient->id)->first();

        // Plaintext PHI must NEVER exist in raw storage
        $this->assertStringNotContainsString('John Confidential Doe', $raw->name);
        $this->assertStringNotContainsString('+1-555-0199', $raw->phone);
        $this->assertStringNotContainsString('johndoe@privatemail.com', $raw->email);
        $this->assertStringNotContainsString('Highly sensitive medical observation.', $raw->notes);

        // Raw values should be encrypted payloads (starts with eyJ for base64 JSON payload in Laravel encryption)
        $this->assertStringStartsWith('eyJ', $raw->name);

        // Eloquent model access must decrypt transparently for authorized application logic
        $fresh = Patient::find($patient->id);
        $this->assertEquals('John Confidential Doe', $fresh->name);
        $this->assertEquals('+1-555-0199', $fresh->phone);
        $this->assertEquals('johndoe@privatemail.com', $fresh->email);
        $this->assertEquals('Highly sensitive medical observation.', $fresh->notes);
    }

    /**
     * Test 4: Cryptographic Hash Chaining on Audit Logs
     */
    public function test_audit_logs_form_an_unbroken_sha256_hash_chain(): void
    {
        $auditService = app(AuditLogService::class);

        $user = User::create([
            'name' => 'Dr. Dave',
            'email' => 'dave@hospital.org',
            'password' => Hash::make('Password123!'),
        ]);

        $log1 = $auditService->log(
            action: 'test_action_1',
            resourceType: 'Patient',
            resourceId: 'PT-100',
            user: $user
        );

        $log2 = $auditService->log(
            action: 'test_action_2',
            resourceType: 'Patient',
            resourceId: 'PT-101',
            user: $user
        );

        // Verify link in hash chain
        $this->assertEquals($log1->record_hash, $log2->previous_hash);
        $this->assertNotEmpty($log1->record_hash);
        $this->assertNotEmpty($log2->record_hash);
    }


    /**
     * Test 5: Optional TOTP Multi-Factor Authentication
     */
    public function test_totp_mfa_generation_verification_and_recovery(): void
    {
        $totpService = app(TOTPService::class);

        $secret = $totpService->generateSecret();
        $this->assertNotEmpty($secret);

        // Verify that invalid codes are rejected
        $this->assertFalse($totpService->verifyCode($secret, '000000'));
        $this->assertFalse($totpService->verifyCode($secret, 'ABCDEF'));

        // Recovery codes generation
        $recoveryCodes = $totpService->generateRecoveryCodes(8);
        $this->assertCount(8, $recoveryCodes);
        $this->assertMatchesRegularExpression('/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{2}$/', $recoveryCodes[0]);
    }

    /**
     * Test 6: Sanctum 120-Minute Token Expiration Configuration
     */
    public function test_sanctum_expiration_is_configured_to_120_minutes(): void
    {
        $this->assertEquals(120, config('sanctum.expiration'));
    }

    /**
     * Test 7: MFA Enrollment, Confirmation, and Disable Endpoints
     */
    public function test_clinician_can_enroll_confirm_and_disable_mfa_via_api(): void
    {
        $user = User::create([
            'name' => 'Dr. Elena',
            'email' => 'elena@hospital.org',
            'password' => Hash::make('SecretPass123!'),
        ]);

        // 1. Setup requires current password
        $setupRes = $this->actingAs($user)->postJson('/api/profile/mfa/setup', [
            'current_password' => 'SecretPass123!',
        ]);

        $setupRes->assertStatus(200);
        $setupData = $setupRes->json('data');
        $this->assertNotEmpty($setupData['secret']);
        $this->assertNotEmpty($setupData['provisioning_uri']);
        $this->assertCount(8, $setupData['recovery_codes']);

        // MFA should NOT be active yet (prevents lockout)
        $user->refresh();
        $this->assertFalse($user->mfa_enabled);

        // 2. Compute a valid TOTP code for the new secret
        $totpService = app(TOTPService::class);
        $timeStep = (int) floor(time() / 30);
        $reflector = new \ReflectionMethod(TOTPService::class, 'calculateOtp');
        $reflector->setAccessible(true);
        $binarySecret = $totpService->base32Decode($setupData['secret']);
        $validCode = $reflector->invoke($totpService, $binarySecret, $timeStep);

        // 3. Confirm enrollment with valid code
        $confirmRes = $this->actingAs($user)->postJson('/api/profile/mfa/confirm', [
            'code' => $validCode,
        ]);

        $confirmRes->assertStatus(200);
        $user->refresh();
        $this->assertTrue($user->mfa_enabled);
        $this->assertNotNull($user->mfa_confirmed_at);

        // 4. Disable MFA
        $disableRes = $this->actingAs($user)->postJson('/api/profile/mfa/disable', [
            'current_password' => 'SecretPass123!',
            'code' => $validCode,
        ]);

        $disableRes->assertStatus(200);
        $user->refresh();
        $this->assertFalse($user->mfa_enabled);
        $this->assertNull($user->mfa_secret);
    }

    /**
     * Test 8: Login MFA Challenge Flow
     */
    public function test_login_triggers_mfa_challenge_when_user_has_mfa_enabled(): void
    {
        $totpService = app(TOTPService::class);
        $secret = $totpService->generateSecret();
        $recoveryCodes = ['TEST-RECV-01', 'TEST-RECV-02'];

        $user = User::create([
            'name' => 'Dr. Frank',
            'email' => 'frank@hospital.org',
            'password' => Hash::make('Password123!'),
            'mfa_enabled' => true,
            'mfa_secret' => $secret,
            'mfa_recovery_codes' => $recoveryCodes,
            'mfa_confirmed_at' => now(),
        ]);

        // Attempt login without MFA code -> returns challenge
        $response = $this->postJson('/api/auth/login', [
            'email' => 'frank@hospital.org',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('data.mfa_required'));
        $this->assertArrayNotHasKey('token', $response->json('data'));

        // Attempt login with invalid code -> 422
        $badResponse = $this->postJson('/api/auth/login', [
            'email' => 'frank@hospital.org',
            'password' => 'Password123!',
            'mfa_code' => '000000',
        ]);
        $badResponse->assertStatus(422);

        // Attempt login with valid recovery code -> succeeds and consumes recovery code
        $goodResponse = $this->postJson('/api/auth/login', [
            'email' => 'frank@hospital.org',
            'password' => 'Password123!',
            'recovery_code' => 'TEST-RECV-01',
        ]);

        $goodResponse->assertStatus(200);
        $this->assertNotEmpty($goodResponse->json('data.token'));

        // Verify recovery code was consumed
        $user->refresh();
        $this->assertEquals(['TEST-RECV-02'], $user->mfa_recovery_codes);
    }

    /**
     * Test 9: Audit Verification Command
     */
    public function test_audit_verify_command_runs_successfully(): void
    {
        $this->artisan('audit:verify')
            ->assertExitCode(0);
    }
}

