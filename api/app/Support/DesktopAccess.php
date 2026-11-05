<?php

namespace App\Support;

use App\Models\User;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Règles d'accès à l'application PC (poste de l'établissement).
 *
 * L'application desktop est réservée aux rôles d'administration. Les
 * comptes enseignants utiliseront l'application mobile Kalanso
 * (prochainement) ; les comptes parents feront de même.
 * Le canal de l'appareil est déduit du "device_name" transmis par le
 * client : « …desktop… » = application PC, tout le reste = mobile/API.
 */
final class DesktopAccess
{
    /** Rôles interdits sur le poste PC (le mobile restera ouvert). */
    public const DESKTOP_FORBIDDEN_ROLES = [
        User::ROLE_ENSEIGNANT,
        // 'parent' — à ajouter lors de l'arrivée des comptes parents (mobile).
    ];

    /** PC si le device_name mentionne « desktop », mobile sinon. */
    public static function channel(?string $deviceName): string
    {
        $name = mb_strtolower(trim((string) $deviceName));

        return str_contains($name, 'desktop') ? 'desktop' : 'mobile';
    }

    /**
     * Refuse la connexion sur le canal PC pour les rôles interdits.
     *
     * @throws HttpException 403 avec un message destiné à l'utilisateur
     */
    public static function assertAllowed(User $user, ?string $deviceName): void
    {
        if (self::channel($deviceName) !== 'desktop') {
            return;
        }

        if (! in_array($user->role, self::DESKTOP_FORBIDDEN_ROLES, true)) {
            return;
        }

        throw new HttpException(
            403,
            'Ce compte est réservé à l’application mobile Kalanso (prochainement). '
            .'Les enseignants et les parents ne peuvent pas utiliser l’application PC. '
            .'Contactez la direction.',
        );
    }
}
