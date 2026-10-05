<?php

declare(strict_types=1);

namespace App\Enums;

enum KidneyCondition: string
{
    case NORMAL = 'Normal';
    case STONE = 'Stone';

    public function description(): string
    {
        return match ($this) {
            self::NORMAL => 'Normal renal parenchyma — No nephrolithiasis detected',
            self::STONE => 'Nephrolithiasis / Kidney stone detected',
        };
    }

    public function clinicalLabel(): string
    {
        return match ($this) {
            self::NORMAL => 'Normal Renal Parenchyma',
            self::STONE => 'Kidney Stone',
        };
    }

    public function severity(): string
    {
        return match ($this) {
            self::NORMAL => 'low',
            self::STONE => 'high',
        };
    }
}
