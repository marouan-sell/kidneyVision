<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return "Laravel works!";
});

// Fail-safe storage route ensuring images load even if symlinks fail or on Windows dev servers
Route::get('/storage/{path}', function (string $path) {
    $cleanPath = str_replace(['..', '\\'], ['', '/'], $path);
    $fullPath = storage_path('app/public/' . $cleanPath);

    if (!file_exists($fullPath) || is_dir($fullPath)) {
        abort(404, 'Image not found.');
    }

    return response()->file($fullPath, [
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*');
