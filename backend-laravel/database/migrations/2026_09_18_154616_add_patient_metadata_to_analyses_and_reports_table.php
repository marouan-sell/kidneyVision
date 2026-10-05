<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('analyses', function (Blueprint $table) {
            $table->string('patient_name')->nullable()->after('original_filename');
            $table->unsignedSmallInteger('patient_age')->nullable()->after('patient_name');
            $table->string('patient_gender', 20)->nullable()->after('patient_age');
            $table->string('anatomical_location', 50)->nullable()->after('patient_gender');
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->text('clinician_notes')->nullable()->after('recommendations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn('clinician_notes');
        });

        Schema::table('analyses', function (Blueprint $table) {
            $table->dropColumn([
                'patient_name',
                'patient_age',
                'patient_gender',
                'anatomical_location',
            ]);
        });
    }
};
