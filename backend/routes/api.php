<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PokemonController;
use App\Http\Controllers\MyPokemonController;
use App\Http\Controllers\PokemonHistoryController;

Route::get('/pokemon', [PokemonController::class, 'index']);
Route::get('/pokemon-with-types', [PokemonController::class, 'indexWithTypes']);
Route::get('/pokemon-by-type/{type}', [PokemonController::class, 'getByType']);
Route::get('/pokemon-by-region/{region}', [PokemonController::class, 'getByRegion']);
Route::get('/pokemon/{id}', [PokemonController::class, 'show']);
Route::post('/pokemon/catch', [MyPokemonController::class, 'catch']);
Route::get('/my-pokemon', [MyPokemonController::class, 'index']);
Route::delete('/my-pokemon/{id}', [MyPokemonController::class, 'destroy']);
Route::get('/pokemon-history', [PokemonHistoryController::class, 'index']);
