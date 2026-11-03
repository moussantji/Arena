<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicYear extends Model
{
    protected $fillable = ['label', 'starts_on', 'ends_on', 'is_current'];

    protected $casts = ['starts_on' => 'date', 'ends_on' => 'date', 'is_current' => 'boolean'];

    public function terms(): HasMany
    {
        return $this->hasMany(Term::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class);
    }

    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    /**
     * Crée une année scolaire courante et ses trois trimestres équilibrés.
     */
    public static function createWithTerms(string $label, string $startsOn, string $endsOn): self
    {
        $year = self::create([
            'label' => $label,
            'starts_on' => $startsOn,
            'ends_on' => $endsOn,
            'is_current' => true,
        ]);

        $start = CarbonImmutable::parse($startsOn)->startOfDay();
        $end = CarbonImmutable::parse($endsOn)->startOfDay();
        $totalDays = (int) $start->diffInDays($end) + 1;
        $baseLength = intdiv($totalDays, 3);
        $remainder = $totalDays % 3;
        $cursor = $start;

        for ($index = 1; $index <= 3; $index++) {
            $length = $baseLength + ($index <= $remainder ? 1 : 0);
            $termEnd = $index === 3 ? $end : $cursor->addDays(max($length - 1, 0));

            Term::create([
                'academic_year_id' => $year->id,
                'name' => "Trimestre {$index}",
                'starts_on' => $cursor->toDateString(),
                'ends_on' => $termEnd->toDateString(),
                'is_current' => $index === 1,
            ]);

            $cursor = $termEnd->addDay();
        }

        return $year->load('terms');
    }
}
