<?php

namespace App\Models\Concerns;

use App\Models\Photo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Reprise adaptée de `attachfiles()` / `getPhoto()` du projet e-commerce.
 *
 * Les fichiers sont stockés sur le disque public dans un dossier propre au
 * modèle (students/12, staff/4, users/1, schools/1) puis rattachés à la
 * table `photos`.
 */
trait HasPhotos
{
    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class, $this->getForeignKey());
    }

    /**
     * @param  array<int, UploadedFile|null>|null  $files
     * @return Collection<int, Photo>
     */
    public function attachfiles(?array $files): Collection
    {
        $pictures = [];

        foreach ($files ?? [] as $file) {
            if (! $file instanceof UploadedFile || $file->getError()) {
                continue;
            }

            $filename = $file->store($this->photoDirectory().'/'.$this->getKey(), 'public');
            $pictures[] = ['filename' => $filename];
        }

        if ($pictures !== []) {
            $this->photos()->createMany($pictures);
        }

        return $this->photos()->get();
    }

    public function replacePhoto(UploadedFile $file): ?Photo
    {
        $this->photos()->get()->each(fn (Photo $photo) => $photo->delete());
        $this->attachfiles([$file]);

        return $this->photos()->first();
    }

    public function getPhoto(): ?Photo
    {
        return $this->photos()->first();
    }

    /**
     * `photo_url` n'est calculé que si la relation a été chargée afin de ne
     * jamais déclencher une requête par ligne dans les listes.
     */
    public function getPhotoUrlAttribute(): ?string
    {
        if (! $this->relationLoaded('photos')) {
            return null;
        }

        return $this->photos->first()?->getImageUrl();
    }

    protected function photoDirectory(): string
    {
        return Str::plural(Str::snake(class_basename($this)));
    }

    protected static function bootHasPhotos(): void
    {
        static::deleting(function ($model) {
            $model->photos()->get()->each(fn (Photo $photo) => $photo->delete());
        });
    }
}
