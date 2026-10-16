<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\AuditLog;
use Illuminate\Console\Command;

class VerifyAuditLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'audit:verify {--limit=1000 : Maximum records to verify}';

    protected $aliases = ['kidneyvision:verify-audit-logs'];

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify the cryptographic hash-chain integrity of audit log records';


    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $this->info("Verifying audit log cryptographic integrity (up to {$limit} chained records)...");

        $logs = AuditLog::whereNotNull('record_hash')
            ->orderBy('id', 'asc')
            ->limit($limit)
            ->get();

        if ($logs->isEmpty()) {
            $this->warn('No chained audit logs found to verify. Legacy records without hashes are skipped.');
            return Command::SUCCESS;
        }

        $tamperedCount = 0;
        $verifiedCount = 0;
        $expectedPrevHash = null;

        foreach ($logs as $log) {
            // Check previous hash continuity
            if ($expectedPrevHash !== null && $log->previous_hash !== $expectedPrevHash) {
                $this->error("CHAIN BREAK at ID {$log->id}: expected previous_hash {$expectedPrevHash}, got {$log->previous_hash}");
                $tamperedCount++;
            }

            // Recalculate hash
            $metadata = is_array($log->metadata) ? $log->metadata : null;
            $calculatedHash = AuditLog::computeHash(
                $log->previous_hash,
                $log->user_id,
                $log->action,
                $log->resource_type,
                $log->resource_id,
                $log->ip_address,
                $log->created_at->toISOString(),
                $metadata
            );

            if ($calculatedHash !== $log->record_hash) {
                $this->error("HASH MISMATCH at ID {$log->id}: recorded {$log->record_hash}, computed {$calculatedHash}");
                $tamperedCount++;
            } else {
                $verifiedCount++;
            }

            $expectedPrevHash = $log->record_hash;
        }

        if ($tamperedCount > 0) {
            $this->error("Audit log verification FAILED: {$tamperedCount} integrity violations detected across {$logs->count()} records.");
            return Command::FAILURE;
        }

        $this->info("Audit log verification PASSED: {$verifiedCount} records cryptographically validated with intact hash chain.");
        return Command::SUCCESS;
    }
}
