<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    protected $fillable = ['department_id', 'name', 'code', 'weekly_hours', 'coefficient', 'is_active'];

    protected $casts = ['weekly_hours' => 'integer', 'coefficient' => 'decimal:2', 'is_active' => 'boolean'];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'class_subject')->withPivot(['staff_id', 'weekly_hours'])->withTimestamps();
    }

    public function classSubjects(): HasMany
    {
        return $this->hasMany(ClassSubject::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function timetableSlots(): HasMany
    {
        return $this->hasMany(TimetableSlot::class);
    }

    public function getAverageAttribute(): ?float
    {
        $grades = $this->grades()->get(['score', 'max_score']);

        if ($grades->isEmpty()) {
            return null;
        }

        return round($grades->avg(fn ($grade) => ((float) $grade->score / max(1, (float) $grade->max_score)) * 20), 2);
    }

    public function getTeachersCountAttribute(): int
    {
        return (int) $this->classSubjects()->whereNotNull('staff_id')->distinct()->count('staff_id');
    }
}
