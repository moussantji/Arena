<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Admission extends Model
{
    protected $fillable = ['reference', 'first_name', 'last_name', 'gender', 'birth_date', 'desired_class_id', 'guardian_name', 'guardian_phone', 'guardian_email', 'status', 'applied_on', 'decision_on', 'notes'];

    protected $casts = ['birth_date' => 'date', 'applied_on' => 'date', 'decision_on' => 'date'];

    protected $appends = ['full_name'];

    public function desiredClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'desired_class_id');
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }
}
