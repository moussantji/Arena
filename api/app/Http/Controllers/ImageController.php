<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use League\Glide\ServerFactory;
use League\Glide\Signatures\SignatureFactory;

class ImageController extends Controller
{
    public function show(Request $request, string $path)
    {
        $key = (string) config('glide.key', '');
        if ($key !== '') {
            try {
                SignatureFactory::create($key)->validateRequest($request->path(), $request->all());
            } catch (\Throwable $e) {
                return response()->json(['message' => 'Signature d’image invalide.'], 403);
            }
        }

        try {
            $source = Storage::disk('public')->getDriver();
            $cacheDriver = Storage::disk('local')->getDriver();

            // Glide 4 : ServerFactory::create() puis getServer()
            $server = ServerFactory::create([
                'source' => $source,
                'cache' => $cacheDriver,
                'cache_path_prefix' => '.glide-cache',
                'base_url' => 'images',
            ])->getServer();

            $cachePath = $server->makeImage($path, $request->all());

            // Lit le fichier généré dans le disque cache (local)
            $contents = $cacheDriver->read($cachePath);
            $mime = $cacheDriver->mimeType($cachePath) ?: 'image/png';

            return response($contents, 200, [
                'Content-Type' => $mime,
                'Cache-Control' => 'public, max-age=31536000, immutable',
            ]);
        } catch (\Throwable $e) {
            Log::warning('Glide indisponible, original servi : '.$e->getMessage());
            $diskPath = Storage::disk('public')->path($path);
            abort_unless(is_file($diskPath), 404);

            return response()->file($diskPath);
        }
    }
}
