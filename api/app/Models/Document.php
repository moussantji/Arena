<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    protected $fillable = ['student_id', 'name', 'type', 'file_path', 'size_bytes', 'issued_on'];

    protected $casts = ['issued_on' => 'date', 'size_bytes' => 'integer'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
