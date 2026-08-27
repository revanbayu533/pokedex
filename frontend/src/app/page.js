"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";

const API_BASE = "";
const PAGE_SIZE = 40;

const TYPE_COLORS = {
  normal:   "#A8A77A", fire:     "#EE8130", water:    "#6390F0",
  electric: "#F7D02C", grass:    "#7AC74C", ice:      "#96D9D6",
  fighting: "#C22E28", poison:   "#A33EA1", ground:   "#E2BF65",
  flying:   "#A98FF3", psychic:  "#F95587", bug:      "#A6B91A",
  rock:     "#B6A136", ghost:    "#735797", dragon:   "#6F35FC",
  dark:     "#705746", steel:    "#B7B7CE", fairy:    "#D685AD",
};

const ALL_TYPES = [
  "normal","fire","water","electric","grass","ice",
  "fighting","poison","ground","flying","psychic","bug",
  "rock","ghost","dragon","dark","steel","fairy",
];

const REGIONS = [
  { label: "Kanto",  value: "kanto",  gen: "Gen I",   range: "#001–151" },
  { label: "Johto",  value: "johto",  gen: "Gen II",  range: "#152–251" },
  { label: "Hoenn",  value: "hoenn",  gen: "Gen III", range: "#252–386" },
  { label: "Sinnoh", value: "sinnoh", gen: "Gen IV",  range: "#387–493" },
  { label: "Unova",  value: "unova",  gen: "Gen V",   range: "#494–649" },
  { label: "Kalos",  value: "kalos",  gen: "Gen VI",  range: "#650–721" },
  { label: "Alola",  value: "alola",  gen: "Gen VII", range: "#722–809" },
  { label: "Galar",  value: "galar",  gen: "Gen VIII",range: "#810–905" },
  { label: "Paldea", value: "paldea", gen: "Gen IX",  range: "#906–1025" },
];

// ─── Fetch Helpers ──────────────────────────────────────────────────────────

async function fetchPage(offset) {
  const res = await fetch(
    `${API_BASE}/api/pokemon-with-types?limit=${PAGE_SIZE}&offset=${offset}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchByType(type) {
  const res = await fetch(`${API_BASE}/api/pokemon-by-type/${type}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchByRegion(region) {
  const res = await fetch(`${API_BASE}/api/pokemon-by-region/${region}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchSearch(query) {
  const res = await fetch(
    `${API_BASE}/api/pokemon-with-types?search=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchMyPokemon() {
  const res = await fetch(`${API_BASE}/api/my-pokemon`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

// ─── Navbar ─────────────────────────────────────────────────────────────────

function Navbar({ koleksiCount }) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) setMounted(true); });
    return () => { active = false; };
  }, []);

  const navLinks = [
    { href: "/",        label: "BERANDA" },
    { href: "/koleksi", label: `KOLEKSI SAYA (${koleksiCount})` },
    { href: "/riwayat", label: "RIWAYAT" },
  ];

  return (
    <>
      <nav className="w-full bg-white dark:bg-zinc-800 border-2 border-blue-500 dark:border-blue-400 rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/telurpokemon.jpeg" alt="Pokéball" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
          <img src="/tpokemon.jpeg" alt="Pokémon Logo" className="h-8 sm:h-10 w-auto object-contain" />
        </div>

        <div className="hidden md:flex items-center gap-1 sm:gap-3 text-xs sm:text-sm font-bold">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={
                  isActive
                    ? "px-3 sm:px-4 py-1.5 sm:py-2 text-[#e07b00] dark:text-yellow-400 font-extrabold transition-colors"
                    : "px-3 sm:px-4 py-1.5 sm:py-2 text-zinc-600 dark:text-zinc-300 hover:text-yellow-500 dark:hover:text-yellow-400 font-bold transition-colors"
                }
              >
                {label}
              </Link>
            );
          })}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="ml-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors cursor-pointer"
              aria-label="Toggle Dark Mode"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="px-2 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              aria-label="Toggle Dark Mode"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          )}
          <button
            onClick={() => setIsOpen(true)}
            className="text-zinc-800 dark:text-zinc-200 focus:outline-none p-1"
            aria-label="Open Menu"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col justify-between transition-colors duration-300">
          <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <img src="/telurpokemon.jpeg" alt="Pokéball" className="w-8 h-8 rounded-full object-cover" />
              <img src="/tpokemon.jpeg" alt="Pokémon Logo" className="h-8 w-auto object-contain" />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-800 dark:text-zinc-200 focus:outline-none p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
              aria-label="Close Menu"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-10 px-6 py-12">
            <div
              className="text-center font-black text-5xl tracking-widest select-none uppercase drop-shadow-lg"
              style={{ color: '#ffcb05', WebkitTextStroke: '2px #3b4cca', fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              PokéDex
            </div>
            <div className="flex flex-col gap-6 w-full max-w-xs">
              {navLinks.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-center gap-3 py-3 px-6 rounded-xl border-2 transition-all font-extrabold text-center ${
                      isActive
                        ? "bg-amber-100 dark:bg-amber-950/40 border-[#e07b00] dark:border-yellow-500 text-[#e07b00] dark:text-yellow-400 shadow-md scale-105"
                        : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <img src="/telurpokemon.jpeg" alt="Pokeball" className="w-6 h-6 object-cover rounded-full" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="relative h-20 bg-[#cda434] dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-4 bg-white dark:bg-zinc-900 rounded-b-[100%]" />
            <span className="text-white/40 dark:text-zinc-500 text-xs font-bold tracking-wider">POKÉDEX SYSTEM</span>
          </div>
        </div>
      )}
    </>
  );
}

// ─── HeroBanner ─────────────────────────────────────────────────────────────

function HeroBanner() {
  return (
    <div className="w-full border-2 border-blue-500 dark:border-blue-400 rounded-2xl overflow-hidden">
      <img src="/tamnellogo.jpeg" alt="Pikachu Banner" className="w-full h-40 sm:h-52 md:h-64 object-cover" />
    </div>
  );
}

// ─── SearchBar ──────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }) {
  return (
    <div className="w-full relative">
      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        placeholder="Cari nama atau nomor Pokémon..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 border-2 border-blue-500 dark:border-blue-400 rounded-full text-sm sm:text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
      />
    </div>
  );
}

// ─── TypeFilter ─────────────────────────────────────────────────────────────

function TypeFilter({ activeType, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Filter Tipe</span>
        {activeType && (
          <button
            onClick={() => onChange(null)}
            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
          >
            ✕ Reset
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {ALL_TYPES.map((type) => {
          const color = TYPE_COLORS[type] || "#999";
          const isActive = activeType === type;
          return (
            <button
              key={type}
              onClick={() => onChange(isActive ? null : type)}
              className="px-3 py-1 rounded-full text-[11px] font-bold text-white uppercase transition-all cursor-pointer"
              style={{
                backgroundColor: isActive ? color : `${color}55`,
                border: `2px solid ${color}`,
                color: isActive ? "#fff" : color,
                transform: isActive ? "scale(1.08)" : "scale(1)",
                boxShadow: isActive ? `0 0 8px ${color}88` : "none",
              }}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── RegionFilter ────────────────────────────────────────────────────────────

function RegionFilter({ activeRegion, onChange }) {
  const regionColors = [
    "#E53E3E","#D69E2E","#3182CE","#805AD5","#2F855A","#DD6B20","#00B5D8","#68D391","#F6AD55",
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Filter Daerah</span>
        {activeRegion && (
          <button
            onClick={() => onChange(null)}
            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
          >
            ✕ Reset
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((r, i) => {
          const color = regionColors[i % regionColors.length];
          const isActive = activeRegion === r.value;
          return (
            <button
              key={r.value}
              onClick={() => onChange(isActive ? null : r.value)}
              title={`${r.gen} · ${r.range}`}
              className="flex flex-col items-center px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer"
              style={{
                backgroundColor: isActive ? color : `${color}22`,
                border: `2px solid ${color}`,
                color: isActive ? "#fff" : color,
                transform: isActive ? "scale(1.08)" : "scale(1)",
                boxShadow: isActive ? `0 0 8px ${color}88` : "none",
              }}
            >
              <span>{r.label}</span>
              <span className="text-[9px] opacity-80 font-medium normal-case">{r.gen}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── PokemonCard ────────────────────────────────────────────────────────────

function PokemonCard({ pokemon }) {
  const [imgError, setImgError] = useState(false);
  const displayNumber = String(pokemon.id).padStart(4, "0");
  const displayName   = pokemon.name.toUpperCase();
  const types         = pokemon.types || [];

  return (
    <div className="relative pt-12 group">
      <Link href={`/pokemon/${pokemon.id}`}>
        <div
          className="absolute left-1/2 -translate-x-1/2 w-28 h-28 z-10 drop-shadow-xl transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-105"
          style={{ top: "-10px" }}
        >
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-50"
            style={{ backgroundColor: TYPE_COLORS[(types[0] || "normal").toLowerCase()] || "#999" }}
          />
          <img
            src={imgError || !pokemon.image ? "/telurpokemon.jpeg" : pokemon.image}
            alt={pokemon.name}
            className="relative w-full h-full object-contain"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
      </Link>

      <Link href={`/pokemon/${pokemon.id}`}>
        <div className="bg-white dark:bg-zinc-800 border-2 border-blue-500 dark:border-blue-400 rounded-2xl pt-16 pb-4 px-4 flex flex-col items-start text-left hover:shadow-[0_0_18px_4px_rgba(59,130,246,0.5)] transition-shadow cursor-pointer">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{displayNumber}</span>
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
            {displayName}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {types.map((type) => {
              const typeLower = type.toLowerCase();
              const bgColor   = TYPE_COLORS[typeLower] || "#999";
              return (
                <span
                  key={type}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white uppercase"
                  style={{ backgroundColor: bgColor }}
                >
                  {type}
                </span>
              );
            })}
          </div>
        </div>
      </Link>
    </div>
  );
}

// ─── SkeletonCard ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="relative pt-12 animate-pulse">
      <div className="absolute left-1/2 -translate-x-1/2 w-28 h-28 bg-orange-200 dark:bg-zinc-700 rounded-full z-10" style={{ top: "-10px" }} />
      <div className="bg-white dark:bg-zinc-800 border-2 border-blue-300 dark:border-zinc-700 rounded-2xl pt-16 pb-4 px-4 flex flex-col gap-2">
        <div className="h-3 w-10 bg-zinc-200 dark:bg-zinc-600 rounded" />
        <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-600 rounded" />
        <div className="flex gap-1.5 mt-1">
          <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-600 rounded-md" />
          <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-600 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// ─── ActiveFiltersBar ────────────────────────────────────────────────────────

function ActiveFiltersBar({ activeType, activeRegion, onClearType, onClearRegion, total }) {
  if (!activeType && !activeRegion) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-white/80 dark:bg-zinc-800/80 rounded-xl border border-blue-200 dark:border-zinc-700 backdrop-blur-sm">
      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Filter aktif:</span>
      {activeType && (
        <span
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: TYPE_COLORS[activeType] || "#999" }}
        >
          Tipe: {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
          <button onClick={onClearType} className="hover:opacity-70 cursor-pointer" aria-label="Hapus filter tipe">✕</button>
        </span>
      )}
      {activeRegion && (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
          Daerah: {activeRegion.charAt(0).toUpperCase() + activeRegion.slice(1)}
          <button onClick={onClearRegion} className="hover:opacity-70 cursor-pointer" aria-label="Hapus filter daerah">✕</button>
        </span>
      )}
      {total !== null && (
        <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400 font-medium">{total} Pokémon ditemukan</span>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Home() {
  const [koleksiCount, setKoleksiCount] = useState(0);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Filter state
  const [activeType,   setActiveType]   = useState(null);
  const [activeRegion, setActiveRegion] = useState(null);

  // Pokemon list state
  const [pokemonList, setPokemonList] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState(null);
  const [offset,      setOffset]      = useState(0);
  const [hasMore,     setHasMore]     = useState(true);

  // Filtered (when both filters active)
  const [filteredList, setFilteredList] = useState(null); // null = tidak di-filter client-side

  const [retry, setRetry] = useState(0);

  // ── Debounce search ──
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Koleksi count ──
  useEffect(() => {
    localStorage.removeItem("koleksiCount");
    fetchMyPokemon()
      .then((data) => {
        setKoleksiCount(data.length);
        localStorage.setItem("koleksiCount", data.length);
      })
      .catch(() => {
        const saved = localStorage.getItem("koleksiCount");
        if (saved !== null) setKoleksiCount(parseInt(saved, 10));
      });
  }, []);

  // ── Main data fetch ──
  // Reset list whenever filters or search changes
  useEffect(() => {
    let active = true;

    const load = async () => {
      if (active) {
        setLoading(true);
        setError(null);
        setPokemonList([]);
        setOffset(0);
        setHasMore(true);
        setFilteredList(null);
      }

      try {
        let data = [];

        if (debouncedSearch) {
          // Search mode — gunakan endpoint search
          data = await fetchSearch(debouncedSearch);
          if (active) {
            setPokemonList(data);
            setHasMore(false); // pencarian tidak pakai pagination
          }
        } else if (activeType && activeRegion) {
          // Kedua filter aktif — fetch keduanya, intersect
          const [byType, byRegion] = await Promise.all([
            fetchByType(activeType),
            fetchByRegion(activeRegion),
          ]);
          const regionIds = new Set(byRegion.map((p) => String(p.id)));
          const combined  = byType.filter((p) => regionIds.has(String(p.id)));
          if (active) {
            setPokemonList(combined);
            setHasMore(false);
          }
        } else if (activeType) {
          data = await fetchByType(activeType);
          if (active) { setPokemonList(data); setHasMore(false); }
        } else if (activeRegion) {
          data = await fetchByRegion(activeRegion);
          if (active) { setPokemonList(data); setHasMore(false); }
        } else {
          // Default — halaman pertama
          data = await fetchPage(0);
          if (active) {
            setPokemonList(data);
            setOffset(PAGE_SIZE);
            setHasMore(data.length >= PAGE_SIZE);
          }
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [debouncedSearch, activeType, activeRegion, retry]);

  // ── Load More (hanya saat tidak ada filter/search) ──
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(offset);
      setPokemonList((prev) => {
        const existingIds = new Set(prev.map((p) => String(p.id)));
        const unique = data.filter((p) => !existingIds.has(String(p.id)));
        return [...prev, ...unique];
      });
      setOffset((prev) => prev + PAGE_SIZE);
      setHasMore(data.length >= PAGE_SIZE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Handle filter changes ──
  const handleTypeChange = (type) => {
    setActiveType(type);
    setSearchQuery("");
  };

  const handleRegionChange = (region) => {
    setActiveRegion(region);
    setSearchQuery("");
  };

  const isFiltered = !!(activeType || activeRegion || debouncedSearch);
  const showLoadMore = !isFiltered && hasMore && !loading;

  const displayList = pokemonList.filter((poke) => {
    // Client-side search filter jika ada debouncedSearch dan data sudah diambil
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      poke.name.toLowerCase().includes(q) ||
      String(poke.id).padStart(4, "0").includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#cda434] dark:bg-zinc-900 flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8 transition-colors duration-300">
      <div className="w-full max-w-6xl flex flex-col gap-6 sm:gap-8">

        <Navbar koleksiCount={koleksiCount} />
        <HeroBanner />
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Filter Panel */}
        <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-2xl border-2 border-blue-200 dark:border-zinc-700 p-4 flex flex-col gap-4">
          <TypeFilter   activeType={activeType}     onChange={handleTypeChange}   />
          <hr className="border-zinc-200 dark:border-zinc-700" />
          <RegionFilter activeRegion={activeRegion} onChange={handleRegionChange} />
        </div>

        {/* Active Filters Bar */}
        <ActiveFiltersBar
          activeType={activeType}
          activeRegion={activeRegion}
          onClearType={() => setActiveType(null)}
          onClearRegion={() => setActiveRegion(null)}
          total={isFiltered && !loading ? displayList.length : null}
        />

        {/* Header */}
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {debouncedSearch
              ? `Hasil Pencarian: "${debouncedSearch}"`
              : activeType && activeRegion
              ? `Pokémon ${activeType.charAt(0).toUpperCase() + activeType.slice(1)} di ${activeRegion.charAt(0).toUpperCase() + activeRegion.slice(1)}`
              : activeType
              ? `Pokémon Tipe ${activeType.charAt(0).toUpperCase() + activeType.slice(1)}`
              : activeRegion
              ? `Pokémon dari ${activeRegion.charAt(0).toUpperCase() + activeRegion.slice(1)}`
              : `Semua Pokémon (${pokemonList.length} ditampilkan)`}
          </h2>
          <hr className="mt-2.5 border-zinc-400 dark:border-zinc-600" />
        </div>

        {/* Error */}
        {error && (
          <div className="text-center py-8 text-red-500 font-medium bg-white/60 dark:bg-zinc-800/60 rounded-2xl">
            <p>Gagal memuat data: {error}</p>
            <button
              onClick={() => { setError(null); setRetry((p) => p + 1); }}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Grid */}
        {!error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 mt-2">
            {loading
              ? Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)
              : displayList.map((pokemon) => (
                  <PokemonCard key={`${pokemon.id}`} pokemon={pokemon} />
                ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && displayList.length === 0 && (
          <div className="text-center py-12">
            <img src="/telurpokemon.jpeg" alt="Tidak ditemukan" className="w-24 h-24 mx-auto mb-4 opacity-50" />
            <p className="text-zinc-700 dark:text-zinc-400 font-medium">
              {debouncedSearch
                ? `Pokémon tidak ditemukan untuk "${debouncedSearch}"`
                : "Tidak ada Pokémon untuk filter ini."}
            </p>
            <button
              onClick={() => { setActiveType(null); setActiveRegion(null); setSearchQuery(""); }}
              className="mt-3 px-5 py-2 bg-blue-500 text-white rounded-full text-sm font-bold hover:bg-blue-600 transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* Load More */}
        {showLoadMore && !error && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold rounded-full transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Memuat...
                </>
              ) : (
                <>Muat Lebih Banyak Pokémon ↓</>
              )}
            </button>
          </div>
        )}

        {/* End of list indicator */}
        {!loading && !error && !hasMore && pokemonList.length > 0 && !isFiltered && (
          <p className="text-center text-zinc-500 dark:text-zinc-500 text-sm font-medium py-4">
            ✓ Semua {pokemonList.length} Pokémon sudah ditampilkan
          </p>
        )}

      </div>
    </div>
  );
}
