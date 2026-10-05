<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class AnalysisNotFoundException extends Exception
{
    /**
     * Create a new Analysis Not Found exception.
     */
    public function __construct(
        string $message = 'Analysis not found.',
        int $code = Response::HTTP_NOT_FOUND,
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
            'error_code' => 'ANALYSIS_NOT_FOUND',
        ], $this->getCode());
    }
}
