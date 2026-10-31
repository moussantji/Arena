<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model
{
    protected $fillable = ['student_id', 'subject_id', 'school_class_id', 'term_id', 'evaluation', 'score', 'max_score', 'coefficient', 'evaluated_on', 'comment'];

    protected $casts = ['score' => 'decimal:2', 'max_score' => 'decimal:2', 'coefficient' => 'decimal:2', 'evaluated_on' => 'date'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class);
    }
}
