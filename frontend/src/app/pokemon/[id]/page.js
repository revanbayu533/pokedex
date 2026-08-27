"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const API_BASE = "";

const TYPE_COLORS = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

const STAT_LABELS = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

const STAT_COLORS = {
  hp: "#F87171",
  attack: "#FB923C",
  defense: "#60A5FA",
  "special-attack": "#A78BFA",
  "special-defense": "#34D399",
  speed: "#FBBF24",
};

async function fetchPokemonDetail(id) {
  const res = await fetch(`${API_BASE}/api/pokemon/${id}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function AbilityBadge({ ability }) {
  const [desc, setDesc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const toggleTooltip = async () => {
    setIsOpen(!isOpen);
    if (!desc && !loading && !isOpen) {
      setLoading(true);
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/ability/${ability.toLowerCase().replace(/\s+/g, "-")}`);
        if (res.ok) {
          const data = await res.json();
          const entry = data.effect_entries.find(e => e.language.name === "en");
          setDesc(entry ? (entry.short_effect || entry.effect) : "No description available.");
        } else {
          setDesc("Description not found.");
        }
      } catch (err) {
        setDesc("Failed to load description.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative w-full max-w-[200px]">
      <button
        onClick={toggleTooltip}
        className="px-3 py-1 border-2 border-zinc-300 dark:border-zinc-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-full text-sm font-bold text-zinc-700 dark:text-zinc-200 capitalize flex items-center justify-between w-full transition-all cursor-pointer bg-white dark:bg-zinc-800"
      >
        <span>{ability}</span>
        <span className="text-zinc-500 text-xs rounded-full bg-zinc-100 dark:bg-zinc-700 w-5 h-5 flex items-center justify-center font-black transition-colors">
          {isOpen ? "×" : "?"}
        </span>
      </button>
      
      {isOpen && (
        <div className="mt-2 p-3 bg-zinc-800 dark:bg-zinc-200 text-zinc-100 dark:text-zinc-900 text-xs leading-relaxed font-medium rounded-xl shadow-lg relative z-10 animate-in fade-in slide-in-from-top-2">
          <div className="absolute -top-1.5 left-6 w-3 h-3 bg-zinc-800 dark:bg-zinc-200 rotate-45" />
          {loading ? (
            <span className="animate-pulse">Loading info...</span>
          ) : (
            <span className="block relative z-10">{desc}</span>
          )}
        </div>
      )}
    </div>
  );
}

function AboutTab({ pokemon }) {
  const abilities = pokemon.abilities || [];

  return (
    <div className="flex flex-col gap-4 mt-6">
      <Row label="Types">
        <div className="flex gap-2 flex-wrap">
          {(pokemon.types || []).map((type) => (
            <span
              key={type}
              className="px-3 py-1 rounded-md text-xs font-bold text-white uppercase"
              style={{
                backgroundColor: TYPE_COLORS[type.toLowerCase()] || "#999",
              }}
            >
              {type}
            </span>
          ))}
        </div>
      </Row>

      <Row label="Height">
        <span className="text-zinc-600 dark:text-zinc-300">{pokemon.height} m</span>
      </Row>

      <Row label="Weight">
        <span className="text-zinc-600 dark:text-zinc-300">{pokemon.weight} kg</span>
      </Row>

      <Row label="Abilities">
        <div className="flex flex-col gap-2.5 w-full">
          {abilities.map((ability) => (
            <AbilityBadge key={ability} ability={ability} />
          ))}
        </div>
      </Row>

      <Row label="Experience">
        <span className="text-zinc-600 dark:text-zinc-300">
          {pokemon.base_experience ?? "-"} XP
        </span>
      </Row>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-start gap-6">
      <span className="w-24 text-sm font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
        {label}
      </span>
      {children}
    </div>
  );
}

function StatsTab({ pokemon, color }) {
  const stats = pokemon.stats || [];

  const chartData = stats.map((stat) => {
    const key = stat.name.toLowerCase();
    const label = STAT_LABELS[key] || stat.name;
    return {
      stat: label,
      value: stat.value,
      fullMark: 150,
    };
  });

  const total = stats.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="flex flex-col items-center mt-2">
      <div className="w-full h-64 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#9CA3AF" />
            <PolarAngleAxis 
              dataKey="stat" 
              tick={{ fill: '#71717A', fontSize: 11, fontWeight: 'bold' }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: color || '#3B82F6', fontWeight: 'bold' }}
            />
            <Radar
              name="Stats"
              dataKey="value"
              stroke={color || "#3B82F6"}
              fill={color || "#3B82F6"}
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between w-full mt-2 px-5 py-4 bg-zinc-100 dark:bg-zinc-700/50 rounded-xl">
        <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
          Total Base Stats
        </span>
        <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">
          {total}
        </span>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5c542] via-[#dba92f] to-[#b8860b] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8 transition-colors duration-300">
      <div className="w-full max-w-5xl flex flex-col gap-8 animate-pulse">
        <div className="flex justify-between">
          <div className="h-6 w-40 bg-black/10 dark:bg-white/10 rounded" />
          <div className="h-10 w-28 bg-black/10 dark:bg-white/10 rounded-full" />
        </div>
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-6 w-20 bg-black/10 dark:bg-white/10 rounded" />
            <div className="h-6 w-32 bg-black/10 dark:bg-white/10 rounded" />
            <div className="w-56 h-56 bg-black/10 dark:bg-white/10 rounded-xl" />
          </div>
          <div className="w-full max-w-md h-72 bg-white/70 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function PokemonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("about");
  const [catchCount, setCatchCount] = useState(0);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      Promise.resolve().then(() => {
        if (active) {
          setLoading(true);
          setError(null);
        }
      });
      try {
        const data = await fetchPokemonDetail(id);
        if (active) {
          setPokemon(data);
        }

        try {
          const myPokemonRes = await fetch(`${API_BASE}/api/my-pokemon`, {
            headers: { Accept: "application/json" },
          });
          if (myPokemonRes.ok) {
            const myPokemonData = await myPokemonRes.json();
            if (myPokemonData.success && active) {
              setCatchCount(myPokemonData.data.length);
            }
          }
        } catch (err) {
          console.error("Gagal mengambil data my-pokemon", err);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setPokemon(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id, retry]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !pokemon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5c542] via-[#dba92f] to-[#b8860b] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 flex flex-col items-center justify-center px-4 gap-4 transition-colors duration-300">
        <p className="text-zinc-900 dark:text-zinc-100 font-semibold text-center">
          Gagal memuat detail Pokémon{error ? `: ${error}` : ""}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              setRetry((prev) => prev + 1);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const displayNumber = String(pokemon.id).padStart(4, "0");
  const displayName = pokemon.name.toUpperCase();
  const mainType = (pokemon.types?.[0] || "normal").toLowerCase();
  const glowColor = TYPE_COLORS[mainType] || "#999";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5c542] via-[#dba92f] to-[#b8860b] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8 transition-colors duration-300">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 hover:opacity-70 transition-opacity cursor-pointer"
          >
            <span aria-hidden="true">←</span> Kembali ke Beranda
          </button>

          <div className="bg-white dark:bg-zinc-800 border-2 border-blue-500 dark:border-blue-400 rounded-full px-10 py-2 font-bold text-zinc-800 dark:text-zinc-200 transition-colors flex items-center gap-2">
            <img src="/telurpokemon.jpeg" alt="Pokeball" className="w-10 h-10" />
            {catchCount} Catch
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start justify-center">
          <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              #{displayNumber}
            </span>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <img
                src="/telurpokemon.jpeg"
                alt="Pokeball"
                className="w-10 h-10"
              />
              {displayName}
            </h1>

            <div className="relative w-56 h-56 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-40"
                style={{ backgroundColor: glowColor }}
              />
              <img
                src={pokemon.image}
                alt={pokemon.name}
                className="relative w-56 h-56 object-contain drop-shadow-xl"
              />
            </div>

            <Link href={`/catch/${params.id}`}>
              <button className="mt-2 flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-800 border-2 border-blue-500 rounded-full font-bold text-black dark:text-white shadow-lg shadow-blue-500/40 hover:bg-blue-50 dark:hover:bg-zinc-700 hover:shadow-xl hover:shadow-blue-500/50 transition-all cursor-pointer">
                <img
                  src="/telurpokemon.jpeg"
                  alt="Pokeball"
                  className="w-10 h-10"
                />
                CATCH ME!
              </button>
            </Link>
          </div>

          <div className="w-full max-w-md bg-white dark:bg-zinc-800 border-2 border-blue-500 dark:border-blue-400 rounded-2xl p-6 transition-colors">
            <div className="relative flex bg-zinc-100 dark:bg-zinc-700 rounded-full p-1 transition-colors">
              <div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-amber-200 dark:bg-amber-500/80 rounded-full transition-all duration-300 ease-out"
                style={{
                  left: activeTab === "about" ? "4px" : "calc(50% + 0px)",
                }}
              />
              <button
                onClick={() => setActiveTab("about")}
                className={`relative flex-1 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                  activeTab === "about"
                    ? "text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`relative flex-1 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                  activeTab === "stats"
                    ? "text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                Stats
              </button>
            </div>

            {activeTab === "about" ? (
              <AboutTab pokemon={pokemon} />
            ) : (
              <StatsTab pokemon={pokemon} key={pokemon.id} color={glowColor} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
