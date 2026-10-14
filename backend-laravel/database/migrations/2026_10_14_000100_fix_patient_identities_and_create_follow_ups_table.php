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
        // 1. Safe Backup of affected tables before making any modifications
        if (!Schema::hasTable('patients_backup_20261014')) {
            DB::statement('CREATE TABLE patients_backup_20261014 AS SELECT * FROM patients');
        }
        if (!Schema::hasTable('analyses_backup_20261014')) {
            DB::statement('CREATE TABLE analyses_backup_20261014 AS SELECT * FROM analyses');
        }

        // 2. Add contact and review tracking columns to patients table
        Schema::table('patients', function (Blueprint $table) {
            if (!Schema::hasColumn('patients', 'phone')) {
                $table->string('phone', 50)->nullable()->after('gender');
            }
            if (!Schema::hasColumn('patients', 'email')) {
                $table->string('email', 100)->nullable()->after('phone');
            }
            if (!Schema::hasColumn('patients', 'flagged_for_review')) {
                $table->boolean('flagged_for_review')->default(false)->after('notes');
            }
            if (!Schema::hasColumn('patients', 'review_reason')) {
                $table->text('review_reason')->nullable()->after('flagged_for_review');
            }
        });

        // 3. Create patient_follow_ups table
        if (!Schema::hasTable('patient_follow_ups')) {
            Schema::create('patient_follow_ups', function (Blueprint $table) {
                $table->id();
                $table->string('patient_id', 50)->index();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->dateTime('follow_up_date');
                $table->string('reason');
                $table->string('status', 20)->default('scheduled'); // scheduled, completed, cancelled
                $table->text('clinical_notes')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'patient_id']);
                $table->index('follow_up_date');
                $table->index('status');
            });
        }

        // 4. Concurrency-Safe Sequence for Patient IDs in PostgreSQL
        DB::statement('CREATE SEQUENCE IF NOT EXISTS patient_id_seq START WITH 100020');

        // 5. Historical Data Reconciliation

        // Collision 1: Analysis #22 (User 9, 'Screenshot 2026 10 07 190514') had PT-0001 (owned by User 1).
        DB::table('analyses')->where('id', 22)->update(['patient_id' => 'PT-100011']);
        DB::table('patients')->updateOrInsert(
            ['patient_id' => 'PT-100011'],
            [
                'user_id' => 9,
                'name' => 'Screenshot 2026 10 07 190514',
                'age' => 25,
                'gender' => 'Male',
                'flagged_for_review' => false,
                'created_at' => '2026-10-07 19:08:23',
                'updated_at' => now(),
            ]
        );

        // Collision 2: Analysis #42 (User 19, 'sara') had PT-6503 (owned by User 16, 'ali').
        DB::table('analyses')->where('id', 42)->update(['patient_id' => 'PT-100012']);
        DB::table('patients')->updateOrInsert(
            ['patient_id' => 'PT-100012'],
            [
                'user_id' => 19,
                'name' => 'sara',
                'age' => 28,
                'gender' => 'Male',
                'flagged_for_review' => false,
                'created_at' => '2026-10-12 17:36:16',
                'updated_at' => now(),
            ]
        );

        // Analysis #38 (User 15, 'Ct stone train 0001') had empty patient_id
        DB::table('analyses')->where('id', 38)->update(['patient_id' => 'PT-100013']);
        DB::table('patients')->updateOrInsert(
            ['patient_id' => 'PT-100013'],
            [
                'user_id' => 15,
                'name' => 'Ct stone train 0001',
                'age' => null,
                'gender' => 'Male',
                'flagged_for_review' => false,
                'created_at' => '2026-10-12 13:56:20',
                'updated_at' => now(),
            ]
        );

        // Analyses #8, 9, 10, 31, 32, 33 (Legacy unassigned test uploads with empty name/ID)
        // Assign dedicated IDs and flag for clinical review rather than silently merging.
        DB::table('analyses')->where('id', 8)->update(['patient_id' => 'PT-100014', 'patient_name' => 'Legacy Study #8']);
        DB::table('patients')->updateOrInsert(
            ['patient_id' => 'PT-100014'],
            [
                'user_id' => 5,
                'name' => 'Legacy Study #8',
                'flagged_for_review' => true,
                'review_reason' => 'Legacy test scan with missing demographic details',
                'created_at' => '2026-10-07 16:45:53',
                'updated_at' => now(),
            ]
        );

        DB::table('analyses')->whereIn('id', [9, 10])->update(['patient_id' => 'PT-100015', 'patient_name' => 'Legacy Study User 6']);
        DB::table('patients')->updateOrInsert(
            ['patient_id' => 'PT-100015'],
            [
                'user_id' => 6,
                'name' => 'Legacy Study User 6',
                'flagged_for_review' => true,
                'review_reason' => 'Legacy test scans with missing demographic details',
                'created_at' => '2026-10-07 16:46:23',
                'updated_at' => now(),
            ]
        );

        DB::table('analyses')->whereIn('id', [31, 32])->update(['patient_id' => 'PT-100016', 'patient_name' => 'Legacy Study User 12']);
        DB::table('patients')->updateOrInsert(
            ['patient_id' => 'PT-100016'],
            [
                'user_id' => 12,
                'name' => 'Legacy Study User 12',
                'flagged_for_review' => true,
                'review_reason' => 'Legacy test scans with missing demographic details',
                'created_at' => '2026-10-10 20:30:41',
                'updated_at' => now(),
            ]
        );

        DB::table('analyses')->where('id', 33)->update(['patient_id' => 'PT-100017', 'patient_name' => 'Legacy Study #33']);
        DB::table('patients')->updateOrInsert(
            ['patient_id' => 'PT-100017'],
            [
                'user_id' => 13,
                'name' => 'Legacy Study #33',
                'flagged_for_review' => true,
                'review_reason' => 'Legacy test scan with missing demographic details',
                'created_at' => '2026-10-10 21:59:24',
                'updated_at' => now(),
            ]
        );

        // Missing patient records for existing valid IDs in analyses
        // Analysis #17 (User 2, PT-100000)
        DB::table('patients')->updateOrInsert(
            ['patient_id' => 'PT-100000'],
            [
                'user_id' => 2,
                'name' => 'Jane Test 6acd7b92dbc47',
                'age' => 20,
                'gender' => 'Male',
                'flagged_for_review' => false,
                'created_at' => '2026-10-07 16:58:23',
                'updated_at' => now(),
            ]
        );

        // Analysis #7 (User 3, PT-100001)
        DB::table('patients')->updateOrInsert(
            ['patient_id' => 'PT-100001'],
            [
                'user_id' => 3,
                'name' => 'Jane Test 6acd7bf32d570',
                'age' => null,
                'gender' => 'Male',
                'flagged_for_review' => false,
                'created_at' => '2026-10-07 16:25:30',
                'updated_at' => now(),
            ]
        );

        // Sync patient_id_seq to the highest number
        DB::statement("SELECT setval('patient_id_seq', (SELECT GREATEST(100020, COALESCE(MAX(CAST(SUBSTRING(patient_id FROM 4) AS INTEGER)), 100020)) FROM patients WHERE patient_id LIKE 'PT-%'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_follow_ups');
        DB::statement('DROP SEQUENCE IF EXISTS patient_id_seq');

        if (Schema::hasTable('patients_backup_20261014')) {
            DB::table('patients')->truncate();
            DB::statement('INSERT INTO patients SELECT * FROM patients_backup_20261014');
            Schema::dropIfExists('patients_backup_20261014');
        }

        if (Schema::hasTable('analyses_backup_20261014')) {
            DB::table('analyses')->truncate();
            DB::statement('INSERT INTO analyses SELECT * FROM analyses_backup_20261014');
            Schema::dropIfExists('analyses_backup_20261014');
        }

        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn(['phone', 'email', 'flagged_for_review', 'review_reason']);
        });
    }
};
