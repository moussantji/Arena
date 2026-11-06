<?php

namespace App\Models;

use App\Models\Concerns\HasPhotos;
use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    use HasPhotos;

    /**
     * Largeur souhaitée pour l'image à la une du blog (liaison Glide signée).
     */
    public const PHOTO_WIDTH = 800;

    /**
     * Hauteur souhaitée pour l'image à la une du blog (recadrage 16/10).
     */
    public const PHOTO_HEIGHT = 500;

    protected $fillable = [
        'slug',
        'title',
        'category',
        'author',
        'summary',
        'body',
        'reading_time',
        'is_featured',
        'published_at',
    ];

    protected $casts = [
        'body' => 'array',
        'is_featured' => 'boolean',
        'published_at' => 'datetime',
    ];

    protected $appends = ['photo_url'];

    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at')->where('published_at', '<=', now());
    }

    /**
     * URL publique de l'image à la une via Glide (comme e-commerce),
     * sans lien `/storage/...` brut côté blog.
     */
    public function getPhotoUrlAttribute(): ?string
    {
        if (! $this->relationLoaded('photos')) {
            return null;
        }

        $url = $this->photos->first()?->getImageUrl(self::PHOTO_WIDTH, self::PHOTO_HEIGHT);

        return ($url !== null && $url !== '') ? $url : null;
    }
}
