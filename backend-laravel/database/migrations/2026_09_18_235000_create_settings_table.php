<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('key')->index();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // integer, boolean, string, json
            $table->string('description')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'key']);
        });

        // Seed initial default clinical settings
        $defaults = [
            [
                'user_id' => null,
                'key' => 'ai_confidence_threshold',
                'value' => '85',
                'type' => 'integer',
                'description' => 'Minimum predictive confidence rate required to trigger an immediate anomaly alert.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => null,
                'key' => 'alert_kidney_stone',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Display prominent visual notifications when kidney stone calculus is detected.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => null,
                'key' => 'alert_low_confidence',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Flag scans near the decision boundary for manual peer review.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => null,
                'key' => 'alert_system_error',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Notify clinicians when neural microservice or database connectivity is degraded.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => null,
                'key' => 'demo_mode',
                'value' => '0',
                'type' => 'boolean',
                'description' => 'Enable simulated offline data for demonstration. Must be disabled for clinical workflows.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => null,
                'key' => 'audit_logging_enabled',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Maintain comprehensive audit trail of all clinical and administrative actions.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => null,
                'key' => 'session_timeout_minutes',
                'value' => '30',
                'type' => 'integer',
                'description' => 'Idle minutes before clinical portal session requires re-authentication.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => null,
                'key' => 'auto_logout_enabled',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Automatically end inactive sessions to protect patient medical data.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => null,
                'key' => 'data_retention_days',
                'value' => '365',
                'type' => 'integer',
                'description' => 'Standard data retention cycle period in days.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('settings')->insert($defaults);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
