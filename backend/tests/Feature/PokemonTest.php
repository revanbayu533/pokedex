<?php

namespace Tests\Feature;

use App\Models\MyPokemon;
use App\Models\PokemonHistory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PokemonTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_pokemon_list()
    {
        $response = $this->getJson('/api/pokemon');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     '*' => ['id', 'name', 'image', 'url']
                 ]);
    }

    public function test_can_fetch_pokemon_list_with_types()
    {
        $response = $this->getJson('/api/pokemon-with-types');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     '*' => ['id', 'name', 'image', 'url', 'types']
                 ]);
    }

    public function test_can_fetch_pokemon_detail()
    {
        $response = $this->getJson('/api/pokemon/1');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'id',
                     'name',
                     'image',
                     'types',
                     'height',
                     'weight',
                     'abilities',
                     'stats' => [
                         '*' => ['name', 'value']
                     ]
                 ]);
    }

    public function test_catch_pokemon_logic()
    {
        $payload = [
            'pokemon_id' => 25,
            'name' => 'Pikachu',
            'image' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
            'types' => ['Electric'],
            'height' => 4,
            'weight' => 60,
        ];

        $response = $this->postJson('/api/pokemon/catch', $payload);

        $response->assertStatus(200)
                 ->assertJsonStructure(['success', 'message']);

        $json = $response->json();

        if ($json['success']) {
            $this->assertDatabaseHas('my_pokemon', [
                'pokemon_id' => 25,
                'name' => 'Pikachu',
            ]);

            $this->assertDatabaseHas('pokemon_histories', [
                'pokemon_id' => 25,
                'action' => 'catch',
            ]);
        } else {
            $this->assertDatabaseMissing('my_pokemon', [
                'pokemon_id' => 25,
            ]);
        }
    }

    public function test_can_release_pokemon()
    {
        $pokemon = MyPokemon::create([
            'pokemon_id' => 4,
            'name' => 'Charmander',
            'image' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',
            'types' => ['Fire'],
            'height' => 6,
            'weight' => 85,
        ]);

        $this->assertDatabaseHas('my_pokemon', ['name' => 'Charmander']);

        $response = $this->deleteJson('/api/my-pokemon/' . $pokemon->id);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Pokemon has been released successfully!'
                 ]);

        $this->assertDatabaseMissing('my_pokemon', ['name' => 'Charmander']);

        $this->assertDatabaseHas('pokemon_histories', [
            'pokemon_id' => 4,
            'action' => 'release',
        ]);
    }

    public function test_can_fetch_my_pokemon_list()
    {
        MyPokemon::create([
            'pokemon_id' => 1,
            'name' => 'Bulbasaur',
            'image' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
            'types' => ['Grass', 'Poison'],
            'height' => 7,
            'weight' => 69,
        ]);

        $response = $this->getJson('/api/my-pokemon');

        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data')
                 ->assertJsonFragment([
                     'name' => 'Bulbasaur'
                 ]);
    }
}
