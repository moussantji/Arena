<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Concerns\HasPhotos;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'google_id'])]
#[Hidden(['password', 'remember_token', 'google_id'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasPhotos, Notifiable;

    public const ROLE_DIRECTION = 'direction';

    public const ROLE_SECRETARIAT = 'secretariat';

    public const ROLE_COMPTABLE = 'comptable';

    public const ROLE_ENSEIGNANT = 'enseignant';

    public const ROLE_PARENT = 'parent';

    public const ROLES = [
        self::ROLE_DIRECTION,
        self::ROLE_SECRETARIAT,
        self::ROLE_COMPTABLE,
        self::ROLE_ENSEIGNANT,
        self::ROLE_PARENT,
    ];

    protected $appends = ['photo_url'];

    public function hasAnyRole(string ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    public function isDirection(): bool
    {
        return $this->hasAnyRole(self::ROLE_DIRECTION);
    }

    /**
     * Enfants liés au compte parent (vide pour les autres rôles).
     */
    public function children(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'parent_student', 'user_id', 'student_id')
            ->withTimestamps();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_creator' => 'boolean',
        ];
    }
}
