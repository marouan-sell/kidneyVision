<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateStorageToPrivate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kidneyvision:migrate-storage
                            {--dry-run : Simulate the migration without copying files}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely migrate medical scans and signatures from public disk to private storage with SHA-256 verification (non-destructive)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->info('Starting Non-Destructive Storage Migration to Private Disk...');
        if ($dryRun) {
            $this->warn('DRY-RUN MODE ENABLED: No files will be modified or copied.');
        }

        $directories = ['analyses', 'signatures'];
        $totalFiles = 0;
        $copiedCount = 0;
        $skippedCount = 0;
        $failedCount = 0;

        foreach ($directories as $dir) {
            $this->line("\nScanning directory: [{$dir}] on public disk...");

            if (!Storage::disk('public')->exists($dir)) {
                $this->line("Directory [{$dir}] does not exist on public disk. Skipping.");
                continue;
            }

            $files = Storage::disk('public')->allFiles($dir);
            $this->info("Found " . count($files) . " files in [{$dir}].");

            foreach ($files as $file) {
                $totalFiles++;

                // Check if target already exists on private disk
                if (Storage::disk('private')->exists($file)) {
                    $sourceHash = hash_file('sha256', Storage::disk('public')->path($file));
                    $targetHash = hash_file('sha256', Storage::disk('private')->path($file));

                    if ($sourceHash === $targetHash) {
                        $this->line(" [SKIP] {$file} (identical copy already in private storage)");
                        $skippedCount++;
                        continue;
                    }
                }

                if ($dryRun) {
                    $this->line(" [PLAN] Would copy {$file} -> private:{$file}");
                    $copiedCount++;
                    continue;
                }

                try {
                    $content = Storage::disk('public')->get($file);
                    Storage::disk('private')->put($file, $content);

                    // Cryptographic integrity verification
                    $sourceHash = hash('sha256', $content);
                    $targetHash = hash_file('sha256', Storage::disk('private')->path($file));

                    if ($sourceHash !== $targetHash) {
                        $this->error(" [FAIL] Integrity mismatch for {$file}!");
                        $failedCount++;
                    } else {
                        $this->info(" [COPIED] {$file} (SHA-256 verified)");
                        $copiedCount++;
                    }
                } catch (\Throwable $e) {
                    $this->error(" [ERROR] Failed to migrate {$file}: " . $e->getMessage());
                    $failedCount++;
                }
            }
        }

        $this->newLine();
        $this->info("=================================================");
        $this->info("Storage Migration Summary:");
        $this->line("Total scanned: {$totalFiles}");
        $this->line("Copied / Verified: {$copiedCount}");
        $this->line("Already up-to-date: {$skippedCount}");
        $this->line("Failures: {$failedCount}");
        $this->warn("Note: Original files on public disk were NOT deleted (non-destructive safety).");
        $this->info("=================================================");

        return $failedCount > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}
