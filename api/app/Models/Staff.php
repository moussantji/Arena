<?php

namespace App\Models;

use App\Models\Concerns\HasPhotos;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Staff extends Model
{
    use HasPhotos;

    protected $table = 'staff';

    protected $fillable = ['user_id', 'department_id', 'first_name', 'last_name', 'role', 'years_experience', 'phone', 'email', 'hired_on', 'is_active'];

    protected $casts = ['hired_on' => 'date', 'is_active' => 'boolean', 'years_experience' => 'integer'];

    protected $appends = ['full_name', 'initials', 'photo_url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function headTeacherClasses(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'head_teacher_id');
    }

    public function classSubjects(): HasMany
    {
        return $this->hasMany(ClassSubject::class);
    }

    public function timetableSlots(): HasMany
    {
        return $this->hasMany(TimetableSlot::class);
    }

    public function recordedAbsences(): HasMany
    {
        return $this->hasMany(Absence::class, 'recorded_by');
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }

    public function getInitialsAttribute(): string
    {
        return mb_strtoupper(mb_substr($this->first_name, 0, 1).mb_substr($this->last_name, 0, 1));
    }
}
