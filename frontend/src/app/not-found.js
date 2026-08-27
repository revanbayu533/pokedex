"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function NotFound() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#cda434] dark:bg-zinc-900 flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8 transition-colors duration-300">
      
      {/* Simple Navbar-like header for context */}
      <nav className="w-full max-w-6xl bg-white dark:bg-zinc-800 border-2 border-blue-500 dark:border-blue-400 rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between transition-colors">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 cursor-pointer">
          <img src="/telurpokemon.jpeg" alt="Pokéball" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
          <img src="/tpokemon.jpeg" alt="Pokémon Logo" className="h-8 sm:h-10 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors cursor-pointer text-sm font-bold"
              aria-label="Toggle Dark Mode"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          )}
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 w-full max-w-2xl px-4 py-12">
        <div className="relative">
          <img src="/telurpokemon.jpeg" alt="404 Not Found" className="w-32 h-32 opacity-70 grayscale animate-pulse" />
          <div className="absolute -bottom-2 -right-4 bg-red-500 text-white font-black text-2xl px-4 py-1 rounded-full border-4 border-white shadow-lg rotate-12">
            404
          </div>
        </div>
        
        <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border-2 border-blue-200 dark:border-zinc-700 rounded-2xl p-8 shadow-xl mt-4 w-full">
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2 uppercase">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base font-medium mb-6">
            Wah! Sepertinya Snorlax menghalangi jalan ini atau halaman yang kamu cari tidak ada di Pokedex.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full transition-all transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Kembali ke Beranda
          </Link>
        </div>
      </div>

    </div>
  );
}
