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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_id', 50)->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name')->index();
            $table->unsignedSmallInteger('age')->nullable();
            $table->string('gender', 20)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'name']);
            $table->index('created_at');
        });

        // Add index on analyses.patient_id if not present
        if (Schema::hasTable('analyses') && Schema::hasColumn('analyses', 'patient_id')) {
            Schema::table('analyses', function (Blueprint $table) {
                $table->index('patient_id');
            });
        }

        // Backfill existing patients from analyses table to preserve existing patient records and identifiers!
        if (Schema::hasTable('analyses')) {
            $existing = DB::table('analyses')
                ->where(function ($query) {
                    $query->whereNotNull('patient_name')
                          ->orWhereNotNull('patient_id');
                })
                ->select('user_id', 'patient_id', 'patient_name', 'patient_age', 'patient_gender', 'created_at')
                ->orderBy('id', 'asc')
                ->get();

            $seenIds = [];
            $seenNames = [];

            foreach ($existing as $row) {
                $name = trim((string) ($row->patient_name ?? ''));
                $assignedId = trim((string) ($row->patient_id ?? ''));

                if ($assignedId && in_array($assignedId, $seenIds, true)) {
                    continue;
                }

                if (!$assignedId && $name && isset($seenNames[strtolower($name)])) {
                    continue;
                }

                if (!$assignedId) {
                    $nextSeq = count($seenIds) + 1;
                    $assignedId = sprintf('PT-%04d', $nextSeq);
                    while (in_array($assignedId, $seenIds, true)) {
                        $nextSeq++;
                        $assignedId = sprintf('PT-%04d', $nextSeq);
                    }
                }

                $seenIds[] = $assignedId;
                if ($name) {
                    $seenNames[strtolower($name)] = $assignedId;
                }

                DB::table('patients')->insert([
                    'patient_id' => $assignedId,
                    'user_id' => $row->user_id,
                    'name' => $name ?: 'Patient ' . $assignedId,
                    'age' => $row->patient_age,
                    'gender' => $row->patient_gender,
                    'created_at' => $row->created_at ?? now(),
                    'updated_at' => now(),
                ]);

                if (empty($row->patient_id)) {
                    DB::table('analyses')
                        ->where('user_id', $row->user_id)
                        ->where('patient_name', $row->patient_name)
                        ->whereNull('patient_id')
                        ->update(['patient_id' => $assignedId]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('analyses')) {
            try {
                Schema::table('analyses', function (Blueprint $table) {
                    $table->dropIndex(['patient_id']);
                });
            } catch (\Throwable) {
                // ignore if already dropped
            }
        }
        Schema::dropIfExists('patients');
    }
};
