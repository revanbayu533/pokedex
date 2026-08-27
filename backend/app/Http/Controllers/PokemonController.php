<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class PokemonController extends Controller
{
    /**
     * Map nama region ke ID generasi PokeAPI
     */
    private array $regionMap = [
        'kanto'  => 1,
        'johto'  => 2,
        'hoenn'  => 3,
        'sinnoh' => 4,
        'unova'  => 5,
        'kalos'  => 6,
        'alola'  => 7,
        'galar'  => 8,
        'paldea' => 9,
    ];

    public function index(Request $request)
    {
        $search = $request->query('search');
        $cacheKey = $search
            ? 'pokemon_list_search_' . md5(strtolower($search))
            : 'pokemon_list_default';

        $pokemonList = Cache::remember($cacheKey, 3600, function () use ($search) {
            $limit = $search ? 2000 : 20;

            $response = Http::timeout(10)->get("https://pokeapi.co/api/v2/pokemon?limit={$limit}");

            if (!$response->successful()) {
                return null;
            }

            $data = $response->json();
            $results = collect($data['results']);

            if ($search) {
                $results = $results->filter(function ($pokemon) use ($search) {
                    $parts = explode('/', rtrim($pokemon['url'], '/'));
                    $id = end($parts);

                    if (is_numeric($search)) {
                        return Str::contains($id, $search);
                    }

                    return Str::contains(strtolower($pokemon['name']), strtolower($search));
                })->take(20)->values();
            }

            return $results->map(function ($pokemon) {
                $parts = explode('/', rtrim($pokemon['url'], '/'));
                $id = end($parts);

                return [
                    'id'    => $id,
                    'name'  => ucfirst($pokemon['name']),
                    'image' => "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{$id}.png",
                    'url'   => $pokemon['url']
                ];
            })->toArray();
        });

        if ($pokemonList === null) {
            Cache::forget($cacheKey);
            return response()->json(['error' => 'Failed to fetch data from PokeAPI'], 500);
        }

        return response()->json($pokemonList);
    }

    /**
     * Daftar Pokémon dengan tipe, support pagination & search.
     * Query params: search, limit (default 40), offset (default 0)
     */
    public function indexWithTypes(Request $request)
    {
        $search = $request->query('search');
        $limit  = (int) $request->query('limit', 40);
        $offset = (int) $request->query('offset', 0);

        // Batasi limit maksimal 100
        $limit = min($limit, 100);

        $cacheKey = $search
            ? 'pokemon_with_types_search_' . md5(strtolower($search))
            : "pokemon_with_types_limit{$limit}_offset{$offset}";

        $pokemonList = Cache::remember($cacheKey, 3600, function () use ($search, $limit, $offset) {
            if ($search) {
                // Fetch semua untuk pencarian
                $response = Http::timeout(10)->get("https://pokeapi.co/api/v2/pokemon?limit=2000");
            } else {
                $response = Http::timeout(10)->get("https://pokeapi.co/api/v2/pokemon?limit={$limit}&offset={$offset}");
            }

            if (!$response->successful()) {
                return null;
            }

            $data    = $response->json();
            $results = collect($data['results']);

            if ($search) {
                $results = $results->filter(function ($pokemon) use ($search) {
                    $parts = explode('/', rtrim($pokemon['url'], '/'));
                    $id    = end($parts);

                    if (is_numeric($search)) {
                        return Str::contains($id, $search);
                    }

                    return Str::contains(strtolower($pokemon['name']), strtolower($search));
                })->take(40)->values();
            }

            $basicList = $results->map(function ($pokemon) {
                $parts = explode('/', rtrim($pokemon['url'], '/'));
                $id    = end($parts);
                return [
                    'id'    => $id,
                    'name'  => ucfirst($pokemon['name']),
                    'image' => "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{$id}.png",
                    'url'   => $pokemon['url']
                ];
            })->toArray();

            $ids = array_column($basicList, 'id');

            $responses = Http::pool(function ($pool) use ($ids) {
                foreach ($ids as $id) {
                    $pool->as("pokemon_{$id}")
                        ->retry(2, 200)
                        ->timeout(10)
                        ->get("https://pokeapi.co/api/v2/pokemon/{$id}");
                }
            });

            return array_map(function ($pokemon) use ($responses) {
                $key   = "pokemon_{$pokemon['id']}";
                $types = [];

                if (
                    isset($responses[$key])
                    && !($responses[$key] instanceof \Throwable)
                    && $responses[$key]->successful()
                ) {
                    $detail = $responses[$key]->json();
                    $types  = collect($detail['types'])->map(function ($item) {
                        return ucfirst($item['type']['name']);
                    })->toArray();

                    Cache::put("pokemon_detail_{$pokemon['id']}", [
                        'id'        => $detail['id'],
                        'name'      => ucfirst($detail['name']),
                        'image'     => "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{$detail['id']}.png",
                        'types'     => $types,
                        'height'    => $detail['height'] / 10,
                        'weight'    => $detail['weight'] / 10,
                        'abilities' => collect($detail['abilities'])->map(fn($item) => ucfirst($item['ability']['name']))->toArray(),
                        'stats'     => collect($detail['stats'])->map(fn($item) => [
                            'name'  => ucfirst($item['stat']['name']),
                            'value' => $item['base_stat']
                        ])->toArray(),
                    ], 86400);
                }

                return array_merge($pokemon, ['types' => $types]);
            }, $basicList);
        });

        if ($pokemonList === null) {
            Cache::forget($cacheKey);
            return response()->json(['error' => 'Failed to fetch data from PokeAPI'], 500);
        }

        return response()->json($pokemonList);
    }

    /**
     * Ambil Pokémon berdasarkan tipe.
     * Endpoint: GET /api/pokemon-by-type/{type}
     */
    public function getByType($type)
    {
        $type     = strtolower($type);
        $cacheKey = "pokemon_by_type_{$type}";

        $pokemonList = Cache::remember($cacheKey, 3600, function () use ($type) {
            $response = Http::timeout(15)->get("https://pokeapi.co/api/v2/type/{$type}");

            if (!$response->successful()) {
                return null;
            }

            $data    = $response->json();
            $entries = collect($data['pokemon'] ?? []);

            // Ambil hanya Pokémon (bukan forms) dengan ID <= 1025
            $filtered = $entries->map(function ($entry) {
                $parts = explode('/', rtrim($entry['pokemon']['url'], '/'));
                $id    = (int) end($parts);
                return [
                    'id'    => $id,
                    'name'  => ucfirst($entry['pokemon']['name']),
                    'image' => "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{$id}.png",
                    'url'   => $entry['pokemon']['url'],
                ];
            })->filter(fn($p) => $p['id'] >= 1 && $p['id'] <= 1025)
              ->sortBy('id')
              ->values()
              ->toArray();

            // Ambil tipe untuk setiap pokémon dari cache dulu, sisanya fetch
            $result = [];
            $toFetch = [];

            foreach ($filtered as $pokemon) {
                $cached = Cache::get("pokemon_detail_{$pokemon['id']}");
                if ($cached) {
                    $result[] = array_merge($pokemon, ['types' => $cached['types']]);
                } else {
                    $toFetch[]  = $pokemon;
                }
            }

            // Fetch sisa yang belum di-cache (batch)
            if (!empty($toFetch)) {
                $ids = array_column($toFetch, 'id');
                $responses = Http::pool(function ($pool) use ($ids) {
                    foreach ($ids as $id) {
                        $pool->as("pokemon_{$id}")
                            ->retry(2, 200)
                            ->timeout(10)
                            ->get("https://pokeapi.co/api/v2/pokemon/{$id}");
                    }
                });

                foreach ($toFetch as $pokemon) {
                    $key   = "pokemon_{$pokemon['id']}";
                    $types = [ucfirst($type)];

                    if (
                        isset($responses[$key])
                        && !($responses[$key] instanceof \Throwable)
                        && $responses[$key]->successful()
                    ) {
                        $detail = $responses[$key]->json();
                        $types  = collect($detail['types'])->map(fn($item) => ucfirst($item['type']['name']))->toArray();

                        Cache::put("pokemon_detail_{$pokemon['id']}", [
                            'id'        => $detail['id'],
                            'name'      => ucfirst($detail['name']),
                            'image'     => "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{$detail['id']}.png",
                            'types'     => $types,
                            'height'    => $detail['height'] / 10,
                            'weight'    => $detail['weight'] / 10,
                            'abilities' => collect($detail['abilities'])->map(fn($item) => ucfirst($item['ability']['name']))->toArray(),
                            'stats'     => collect($detail['stats'])->map(fn($item) => [
                                'name'  => ucfirst($item['stat']['name']),
                                'value' => $item['base_stat']
                            ])->toArray(),
                        ], 86400);
                    }

                    $result[] = array_merge($pokemon, ['types' => $types]);
                }
            }

            usort($result, fn($a, $b) => $a['id'] <=> $b['id']);
            return $result;
        });

        if ($pokemonList === null) {
            Cache::forget($cacheKey);
            return response()->json(['error' => "Failed to fetch Pokémon by type: {$type}"], 500);
        }

        return response()->json($pokemonList);
    }

    /**
     * Ambil Pokémon berdasarkan daerah/region.
     * Endpoint: GET /api/pokemon-by-region/{region}
     */
    public function getByRegion($region)
    {
        $region   = strtolower($region);
        $genId    = $this->regionMap[$region] ?? null;

        if (!$genId) {
            return response()->json(['error' => "Unknown region: {$region}"], 400);
        }

        $cacheKey = "pokemon_by_region_{$region}";

        $pokemonList = Cache::remember($cacheKey, 3600, function () use ($genId) {
            $response = Http::timeout(15)->get("https://pokeapi.co/api/v2/generation/{$genId}");

            if (!$response->successful()) {
                return null;
            }

            $data    = $response->json();
            $species = collect($data['pokemon_species'] ?? []);

            $basicList = $species->map(function ($s) {
                $parts = explode('/', rtrim($s['url'], '/'));
                $id    = (int) end($parts);
                return [
                    'id'    => $id,
                    'name'  => ucfirst($s['name']),
                    'image' => "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{$id}.png",
                    'url'   => $s['url'],
                ];
            })->filter(fn($p) => $p['id'] >= 1 && $p['id'] <= 1025)
              ->sortBy('id')
              ->values()
              ->toArray();

            // Ambil tipe dari cache atau fetch
            $result  = [];
            $toFetch = [];

            foreach ($basicList as $pokemon) {
                $cached = Cache::get("pokemon_detail_{$pokemon['id']}");
                if ($cached) {
                    $result[] = array_merge($pokemon, ['types' => $cached['types']]);
                } else {
                    $toFetch[] = $pokemon;
                }
            }

            if (!empty($toFetch)) {
                $ids = array_column($toFetch, 'id');
                $responses = Http::pool(function ($pool) use ($ids) {
                    foreach ($ids as $id) {
                        $pool->as("pokemon_{$id}")
                            ->retry(2, 200)
                            ->timeout(10)
                            ->get("https://pokeapi.co/api/v2/pokemon/{$id}");
                    }
                });

                foreach ($toFetch as $pokemon) {
                    $key   = "pokemon_{$pokemon['id']}";
                    $types = [];

                    if (
                        isset($responses[$key])
                        && !($responses[$key] instanceof \Throwable)
                        && $responses[$key]->successful()
                    ) {
                        $detail = $responses[$key]->json();
                        $types  = collect($detail['types'])->map(fn($item) => ucfirst($item['type']['name']))->toArray();

                        Cache::put("pokemon_detail_{$pokemon['id']}", [
                            'id'        => $detail['id'],
                            'name'      => ucfirst($detail['name']),
                            'image'     => "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{$detail['id']}.png",
                            'types'     => $types,
                            'height'    => $detail['height'] / 10,
                            'weight'    => $detail['weight'] / 10,
                            'abilities' => collect($detail['abilities'])->map(fn($item) => ucfirst($item['ability']['name']))->toArray(),
                            'stats'     => collect($detail['stats'])->map(fn($item) => [
                                'name'  => ucfirst($item['stat']['name']),
                                'value' => $item['base_stat']
                            ])->toArray(),
                        ], 86400);
                    }

                    $result[] = array_merge($pokemon, ['types' => $types]);
                }
            }

            usort($result, fn($a, $b) => $a['id'] <=> $b['id']);
            return $result;
        });

        if ($pokemonList === null) {
            Cache::forget($cacheKey);
            return response()->json(['error' => "Failed to fetch Pokémon by region: {$region}"], 500);
        }

        return response()->json($pokemonList);
    }

    public function show($id)
    {
        $pokemon = Cache::remember("pokemon_detail_{$id}", 86400, function () use ($id) {
            $response = Http::timeout(10)->get("https://pokeapi.co/api/v2/pokemon/{$id}");

            if (!$response->successful()) {
                return null;
            }

            $data = $response->json();

            $types = collect($data['types'])->map(function ($item) {
                return ucfirst($item['type']['name']);
            })->toArray();

            $abilities = collect($data['abilities'])->map(function ($item) {
                return ucfirst($item['ability']['name']);
            })->toArray();

            $stats = collect($data['stats'])->map(function ($item) {
                return [
                    'name'  => ucfirst($item['stat']['name']),
                    'value' => $item['base_stat']
                ];
            })->toArray();

            $pokemonId = $data['id'];

            return [
                'id'        => $pokemonId,
                'name'      => ucfirst($data['name']),
                'image'     => "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{$pokemonId}.png",
                'types'     => $types,
                'height'    => $data['height'] / 10,
                'weight'    => $data['weight'] / 10,
                'abilities' => $abilities,
                'stats'     => $stats
            ];
        });

        if ($pokemon === null) {
            Cache::forget("pokemon_detail_{$id}");
            return response()->json(['error' => 'Pokemon not found'], 404);
        }

        return response()->json($pokemon);
    }
}
