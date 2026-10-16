<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Additive & non-destructive conversion of PHI columns to TEXT and addition of blind indexes.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        // 1. Convert columns in patients table to TEXT to accommodate AES-256 ciphertexts safely
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE patients ALTER COLUMN name TYPE TEXT');
            DB::statement('ALTER TABLE patients ALTER COLUMN phone TYPE TEXT');
            DB::statement('ALTER TABLE patients ALTER COLUMN email TYPE TEXT');
            if (Schema::hasColumn('analyses', 'patient_name')) {
                DB::statement('ALTER TABLE analyses ALTER COLUMN patient_name TYPE TEXT');
            }
        }

        // 2. Add blind index columns to patients table
        Schema::table('patients', function (Blueprint $table) {
            if (!Schema::hasColumn('patients', 'phone_bidx')) {
                $table->string('phone_bidx', 64)->nullable()->after('phone')->index();
            }
            if (!Schema::hasColumn('patients', 'email_bidx')) {
                $table->string('email_bidx', 64)->nullable()->after('email')->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            if (Schema::hasColumn('patients', 'phone_bidx')) {
                $table->dropColumn('phone_bidx');
            }
            if (Schema::hasColumn('patients', 'email_bidx')) {
                $table->dropColumn('email_bidx');
            }
        });
    }
};
