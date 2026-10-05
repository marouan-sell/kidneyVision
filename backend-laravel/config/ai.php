<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Flask AI Microservice Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the Flask-based AI microservice that handles
    | kidney image analysis predictions.
    |
    */

    'flask_base_url' => env('AI_FLASK_BASE_URL', 'http://127.0.0.1:5000'),
    'predict_endpoint' => env('AI_PREDICT_ENDPOINT', '/predict'),
    'health_endpoint' => env('AI_HEALTH_ENDPOINT', '/health'),
    'timeout' => (int) env('AI_TIMEOUT', 30),
    'retry_times' => (int) env('AI_RETRY_TIMES', 3),
    'retry_sleep' => (int) env('AI_RETRY_SLEEP', 1000),
    'mock_enabled' => (bool) env('AI_MOCK_ENABLED', true),

];
