<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Patient;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class EncryptExistingPatientData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kidneyvision:encrypt-patients
                            {--dry-run : Simulate encryption without writing changes to the database}
                            {--batch-size=100 : Number of records to process per chunk}';

    protected $aliases = ['encrypt:patient-data'];


    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely and idempotently encrypt legacy plaintext patient records and populate blind indexes (resumable & non-destructive)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $batchSize = max(10, (int) $this->option('batch-size'));

        $this->info('===========================================================');
        $this->info('KidneyVision AI — Non-Destructive Patient Data Encryption');
        $this->info('===========================================================');

        if ($dryRun) {
            $this->warn('DRY-RUN MODE ACTIVATED: Database will NOT be modified.');
        }

        $totalScanned = 0;
        $alreadyEncrypted = 0;
        $migratedCount = 0;
        $failedCount = 0;

        // Query raw database records directly to avoid Eloquent automatic decrypt/encrypt cycles
        DB::table('patients')->orderBy('id', 'asc')->chunk($batchSize, function ($rows) use (
            $dryRun,
            &$totalScanned,
            &$alreadyEncrypted,
            &$migratedCount,
            &$failedCount
        ) {
            foreach ($rows as $row) {
                $totalScanned++;
                $needsUpdate = false;
                $updateData = [];

                // 1. Check Name
                if (!empty($row->name)) {
                    if ($this->isAlreadyEncrypted((string) $row->name)) {
                        $alreadyEncrypted++;
                    } else {
                        $needsUpdate = true;
                        $updateData['name'] = Crypt::encryptString((string) $row->name);
                    }
                }

                // 2. Check Phone & Blind Index
                if (!empty($row->phone)) {
                    if (!$this->isAlreadyEncrypted((string) $row->phone)) {
                        $needsUpdate = true;
                        $updateData['phone'] = Crypt::encryptString((string) $row->phone);
                        $updateData['phone_bidx'] = Patient::generateBlindIndex((string) $row->phone, 'phone');
                    } elseif (empty($row->phone_bidx)) {
                        // Phone is already encrypted, decrypt safely to generate blind index
                        try {
                            $decryptedPhone = Crypt::decryptString((string) $row->phone);
                            $updateData['phone_bidx'] = Patient::generateBlindIndex($decryptedPhone, 'phone');
                            $needsUpdate = true;
                        } catch (\Throwable) {
                            // Skip if decrypt fails
                        }
                    }
                }

                // 3. Check Email & Blind Index
                if (!empty($row->email)) {
                    if (!$this->isAlreadyEncrypted((string) $row->email)) {
                        $needsUpdate = true;
                        $updateData['email'] = Crypt::encryptString((string) $row->email);
                        $updateData['email_bidx'] = Patient::generateBlindIndex((string) $row->email, 'email');
                    } elseif (empty($row->email_bidx)) {
                        try {
                            $decryptedEmail = Crypt::decryptString((string) $row->email);
                            $updateData['email_bidx'] = Patient::generateBlindIndex($decryptedEmail, 'email');
                            $needsUpdate = true;
                        } catch (\Throwable) {
                            // Skip if decrypt fails
                        }
                    }
                }

                // 4. Check Clinical Notes
                if (!empty($row->notes) && !$this->isAlreadyEncrypted((string) $row->notes)) {
                    $needsUpdate = true;
                    $updateData['notes'] = Crypt::encryptString((string) $row->notes);
                }

                if ($needsUpdate) {
                    if ($dryRun) {
                        $this->line(" [PLAN] Patient record ID {$row->id} requires encryption & blind index.");
                        $migratedCount++;
                    } else {
                        try {
                            DB::table('patients')
                                ->where('id', $row->id)
                                ->update($updateData);

                            $migratedCount++;
                            $this->line(" [ENCRYPTED] Record ID {$row->id} safely transformed.");
                        } catch (\Throwable $e) {
                            $failedCount++;
                            $this->error(" [FAILED] Record ID {$row->id}: " . $e->getMessage());
                        }
                    }
                }
            }
        });

        $this->newLine();
        $this->info('Migration Summary:');
        $this->line("Total records scanned: {$totalScanned}");
        $this->line("Already encrypted / skipped: {$alreadyEncrypted}");
        $this->line("Records migrated / encrypted: {$migratedCount}");
        $this->line("Failures: {$failedCount}");
        $this->info('===========================================================');

        return $failedCount > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    /**
     * Check if a database string payload is already encrypted by Laravel OpenSSL.
     */
    private function isAlreadyEncrypted(?string $value): bool
    {
        if ($value === null || trim($value) === '') {
            return false;
        }

        // Laravel ciphertexts are base64-encoded JSON strings containing iv, value, and mac
        if (!str_starts_with($value, 'eyJ')) {
            return false;
        }

        try {
            $decoded = base64_decode($value, true);
            if ($decoded === false) {
                return false;
            }
            $json = json_decode($decoded, true);
            return is_array($json) && isset($json['iv'], $json['value'], $json['mac']);
        } catch (\Throwable) {
            return false;
        }
    }
}
