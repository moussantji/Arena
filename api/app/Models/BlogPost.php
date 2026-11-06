<?php

namespace App\Models;

use App\Models\Concerns\HasPhotos;
use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    use HasPhotos;

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
}
