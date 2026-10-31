<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Photo extends Model
{
    protected $fillable = ['filename', 'user_id', 'student_id', 'staff_id', 'school_id'];

    protected $appends = ['url'];

    protected static function booted(): void
    {
        static::deleting(function (Photo $photo) {
            if ($photo->filename) {
                Storage::disk('public')->delete($photo->filename);
            }
        });
    }

    /**
     * URL publique de la photo.
     *
     * DIALLO n'embarque ni GD/Imagick, ni Glide/Intervention : le
     * redimensionnement n'est pas disponible. On renvoie donc toujours le
     * fichier d'origine, comme le fait le projet e-commerce en l'absence de
     * moteur d'image.
     */
    public function getImageUrl(?int $width = null, ?int $height = null): string
    {
        $filename = (string) $this->filename;

        if ($filename === '') {
            return '';
        }

        if (str_starts_with($filename, 'http://') || str_starts_with($filename, 'https://')) {
            return $filename;
        }

        return Storage::disk('public')->url($filename);
    }

    public function getUrlAttribute(): string
    {
        return $this->getImageUrl();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
