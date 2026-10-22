<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageSanitizerService
{
    /**
     * Sanitize an uploaded medical scan by stripping unnecessary EXIF and metadata,
     * then store the sanitized image onto the specified disk outside webroot.
     *
     * @param UploadedFile $file The raw uploaded image
     * @param string $folder Target storage directory
     * @param string $disk Storage disk ('private')
     * @return string The relative stored file path
     */
    public function sanitizeAndStore(
        UploadedFile $file,
        string $folder = 'analyses',
        string $disk = 'private'
    ): string {
        $realPath = $file->getRealPath();
        $rawBytes = file_get_contents($realPath);

        // Attempt EXIF stripping via GD re-encoding if GD extension is active
        if (function_exists('imagecreatefromstring')) {
            $imageResource = @imagecreatefromstring($rawBytes);
            if ($imageResource !== false) {
                $ext = strtolower($file->getClientOriginalExtension());
                $cleanFilename = Str::random(40);

                ob_start();
                if (in_array($ext, ['png'], true)) {
                    // PNG: preserve alpha transparency, strip ancillary metadata chunks
                    imagealphablending($imageResource, false);
                    imagesavealpha($imageResource, true);
                    imagepng($imageResource, null, 6);
                    $sanitizedBytes = ob_get_clean();
                    $storedPath = "{$folder}/{$cleanFilename}.png";
                } else {
                    // JPEG / others: re-encode at 95% quality without EXIF
                    imagejpeg($imageResource, null, 95);
                    $sanitizedBytes = ob_get_clean();
                    $storedPath = "{$folder}/{$cleanFilename}.jpg";
                }

                imagedestroy($imageResource);

                if ($sanitizedBytes !== false && strlen($sanitizedBytes) > 0) {
                    Storage::disk($disk)->put($storedPath, $sanitizedBytes);
                    return $storedPath;
                }
            }
        }

        // Fallback: standard store if GD re-encoding is unavailable
        return $file->store($folder, $disk);
    }
}
