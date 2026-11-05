<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/confidentialite', fn () => view('confidentialite'))->name('privacy');
