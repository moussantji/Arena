<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GoogleAuthController extends Controller
{
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

    /**
     * Informations publiques nécessaires au flux OAuth de l'application desktop.
     */
    public function status(): JsonResponse
    {
        $enabled = $this->isConfigured();

        return response()->json([
            'enabled' => $enabled,
            'client_id' => $enabled ? config('services.google.client_id') : null,
        ]);
    }

    /**
     * Échange le code OAuth reçu par la boucle locale Electron contre un token
     * Sanctum, après vérification du compte Google.
     */
    public function exchange(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:4096'],
            'code_verifier' => ['required', 'string', 'min:43', 'max:128'],
            'redirect_uri' => ['required', 'url', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
        ], [
            'code.required' => 'Le code Google est absent.',
            'redirect_uri.required' => 'L’adresse de retour Google est absente.',
        ]);

        if (! $this->isConfigured()) {
            throw ValidationException::withMessages([
                'google' => ['La connexion Google n’est pas configurée sur ce poste.'],
            ]);
        }

        if (! $this->isLoopbackRedirect($data['redirect_uri'])) {
            throw ValidationException::withMessages([
                'redirect_uri' => ['L’adresse de retour Google est invalide.'],
            ]);
        }

        try {
            $tokenResponse = Http::asForm()
                ->timeout(15)
                ->post(self::TOKEN_URL, [
                    'client_id' => config('services.google.client_id'),
                    'client_secret' => config('services.google.client_secret'),
                    'code' => $data['code'],
                    'code_verifier' => $data['code_verifier'],
                    'grant_type' => 'authorization_code',
                    'redirect_uri' => $data['redirect_uri'],
                ]);
        } catch (ConnectionException $exception) {
            Log::warning('Google OAuth : échange du code impossible.', [
                'message' => $exception->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'google' => ['Google est injoignable. Vérifiez votre connexion internet.'],
            ]);
        }

        if (! $tokenResponse->successful() || blank($tokenResponse->json('access_token'))) {
            Log::warning('Google OAuth : réponse de token invalide.', [
                'status' => $tokenResponse->status(),
                'body' => Str::limit($tokenResponse->body(), 500),
            ]);

            throw ValidationException::withMessages([
                'google' => ['Google a refusé la connexion. Réessayez dans un instant.'],
            ]);
        }

        try {
            $userInfoResponse = Http::withToken($tokenResponse->json('access_token'))
                ->timeout(15)
                ->get(self::USERINFO_URL);
        } catch (ConnectionException $exception) {
            Log::warning('Google OAuth : profil Google injoignable.', [
                'message' => $exception->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'google' => ['Impossible de vérifier votre compte Google. Réessayez.'],
            ]);
        }

        if (! $userInfoResponse->successful()) {
            throw ValidationException::withMessages([
                'google' => ['Impossible de vérifier votre compte Google. Réessayez.'],
            ]);
        }

        $googleId = trim((string) $userInfoResponse->json('sub'));
        $email = Str::lower(trim((string) $userInfoResponse->json('email')));
        $emailVerified = filter_var(
            $userInfoResponse->json('email_verified', false),
            FILTER_VALIDATE_BOOLEAN,
        );

        if ($googleId === '' || $email === '') {
            throw ValidationException::withMessages([
                'google' => ['Le compte Google ne fournit pas d’adresse e-mail exploitable.'],
            ]);
        }

        if (! $emailVerified) {
            throw ValidationException::withMessages([
                'email' => ['L’adresse e-mail de ce compte Google n’est pas vérifiée.'],
            ]);
        }

        $user = User::query()->where('google_id', $googleId)->first();

        if (! $user) {
            $user = User::query()
                ->whereRaw('LOWER(email) = ?', [$email])
                ->first();

            if (! $user) {
                throw ValidationException::withMessages([
                    'email' => [
                        'Aucun compte Kalanso n’est associé à cette adresse Google. '
                        .'Demandez à la direction de créer votre compte.',
                    ],
                ]);
            }

            if (filled($user->google_id) && $user->google_id !== $googleId) {
                throw ValidationException::withMessages([
                    'email' => ['Ce compte Kalanso est déjà lié à un autre compte Google.'],
                ]);
            }

            $user->forceFill([
                'google_id' => $googleId,
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();
        }

        $token = $user->createToken('google-desktop')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user->fresh()->load('photos:id,user_id,filename'),
        ]);
    }

    private function isConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'));
    }

    private function isLoopbackRedirect(string $uri): bool
    {
        $parts = parse_url($uri);

        if (! is_array($parts)) {
            return false;
        }

        $host = $parts['host'] ?? '';

        return ($parts['scheme'] ?? '') === 'http'
            && in_array($host, ['127.0.0.1', 'localhost', '::1', '[::1]'], true)
            && ($parts['path'] ?? '') === '/oauth/callback'
            && isset($parts['port']);
    }
}
