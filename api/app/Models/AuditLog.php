<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;
use Throwable;

/**
 * Ligne du journal de traçabilité (lecture seule côté application).
 * Écrit via AuditLog::record() uniquement.
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $user_name
 * @property string $action
 * @property string|null $subject_type
 * @property string|null $subject_id
 * @property string $description
 * @property array|null $properties
 * @property string|null $ip_address
 * @property Carbon $created_at
 */
class AuditLog extends Model
{
    public const UPDATED_AT = null;

    /**
     * Les comptes qui créent/modifient des objets métier — jamais les
     * lectures classiques.
     */
    protected $fillable = [
        'user_id',
        'user_name',
        'action',
        'subject_type',
        'subject_id',
        'description',
        'properties',
        'ip_address',
    ];

    protected $casts = [
        'properties' => 'array',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Écrit une ligne de journal. Ne lève jamais d'exception : une panne de
     * traçabilité ne doit pas casser l'action métier.
     *
     * Le paramètre $actor permet de journaliser des actions qui n'ont pas
     * encore d'utilisateur authentifié sur la requête (connexion par
     * mot de passe ou Google) : l'auteur connu est alors passé explicitement.
     */
    public static function record(string $action, ?Model $subject, string $description, array $properties = [], ?User $actor = null): void
    {
        try {
            $request = Request::instance();
            $user = $request?->user() ?? $actor;

            static::query()->create([
                'user_id' => $user?->id,
                'user_name' => $user?->name ?? 'Système',
                'action' => $action,
                'subject_type' => $subject ? class_basename($subject) : null,
                'subject_id' => $subject?->getKey() !== null ? (string) $subject->getKey() : null,
                'description' => mb_substr($description, 0, 500),
                'properties' => $properties === [] ? null : $properties,
                'ip_address' => $request?->ip(),
            ]);
        } catch (Throwable $exception) {
            Log::warning('Audit : écriture impossible.', ['message' => $exception->getMessage()]);
        }
    }
}
