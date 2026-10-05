<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class AIServiceException extends Exception
{
    /**
     * Create a new AI Service exception.
     */
    public function __construct(
        string $message = 'AI service is currently unavailable.',
        int $code = Response::HTTP_SERVICE_UNAVAILABLE,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'error_code' => 'AI_SERVICE_UNAVAILABLE',
        ], $this->getCode());
    }
}
