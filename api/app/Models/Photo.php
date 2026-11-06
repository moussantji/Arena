<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use League\Glide\Urls\UrlBuilderFactory;

class Photo extends Model
{
    protected $fillable = ['filename', 'user_id', 'student_id', 'staff_id', 'school_id', 'blog_post_id'];

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
     * Reprise de `getImageUrl()` du projet e-commerce :
     * - filename déjà absolue (CDN/externe) → renvoyée telle quelle ;
     * - sans dimension demandée → fichier d'origine (`/storage/...`) ;
     * - avec largeur/hauteur → URL Glide signée `/images/...?w=&h=&fit=crop&s=`
     *   (voir ImageController, route `glide.image`).
     * Sans moteur GD/Imagick, Glide ne peut pas redimensionner :
     * `ImageController` sert alors l'original (pas de 500), mais l'URL
     * reste `/images/...` comme dans le e-commerce.
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

        if ($width === null && $height === null) {
            return Storage::disk('public')->url($filename);
        }

        $params = array_filter([
            'w' => $width,
            'h' => $height,
            'fit' => 'crop',
        ]);

        $urlBuilder = UrlBuilderFactory::create('/images/', (string) config('glide.key', '') ?: null);

        return $urlBuilder->getUrl($filename, $params);
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

    public function blogPost(): BelongsTo
    {
        return $this->belongsTo(BlogPost::class);
    }
}
