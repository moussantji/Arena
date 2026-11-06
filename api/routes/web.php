<?php

use App\Http\Controllers\ImageController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/confidentialite', fn () => view('confidentialite'))->name('privacy');

/*
| Images redimensionnées / recadrées via Glide (comme le e-commerce).
| L'URL est signée par la clé GLIDE_KEY ; sans moteur GD/Imagick, le
| fichier d'origine est servi (voir ImageController).
*/
Route::get('/images/{path}', [ImageController::class, 'show'])
    ->where('path', '.*')
    ->name('glide.image');
