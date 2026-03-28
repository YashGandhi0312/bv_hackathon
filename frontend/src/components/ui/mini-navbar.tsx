"use client";

import React, { useState, useEffect } from 'react';
import { PackageSearch, Truck, Package } from 'lucide-react';

const AnimatedNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <a href={href} className="group relative inline-block overflow-hidden h-5 flex items-center text-sm">
      <div className="flex flex-col transition-transform duration-400 ease-out transform group-hover:-translate-y-1/2">
        <span className="text-neutral-500 font-medium">{children}</span>
        <span className="text-blue-600 dark:text-white font-medium">{children}</span>
      </div>
    </a>
  );
};

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logoElement = (
    <div className="flex items-center gap-2">
      <div className="bg-blue-600/20 p-1.5 rounded-lg border border-blue-500/30">
        <PackageSearch className="w-4 h-4 text-blue-400" />
      </div>
      <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-400 dark:from-white dark:to-neutral-400 tracking-tight">
        LogisPredict<span className="text-blue-500 italic">AI</span>
      </span>
    </div>
  );

  return (
    <header className={`fixed left-1/2 transform -translate-x-1/2 z-50
                       flex items-center justify-between
                       px-8 py-3 backdrop-blur-md rounded-full
                       transition-all duration-500 ease-in-out border group
                       ${scrolled
        ? 'top-4 w-[85%] max-w-5xl border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 shadow-2xl h-14'
        : 'top-6 w-[80%] max-w-6xl border-neutral-200/50 dark:border-neutral-900/40 bg-white/40 dark:bg-black/40 h-16'
      }`}>

      {/* Background Ambient Particles (Stars/Dust) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full opacity-30">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="animate-drift absolute w-1 h-1 bg-blue-400 rounded-full blur-[1px]"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 1.5}s`,
              transform: `scale(${Math.random() * 0.5 + 0.5})`
            }}
          />
        ))}
      </div>

      {/* FULL-WIDTH TRUCK TRACK */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
        {/* Glowing Path Line */}
        <div className="absolute top-[85%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.3)]" />

        {/* The Truck */}
        <div className="absolute top-[80%] left-0 -translate-y-1/2 animate-drive flex items-center gap-0">
          <div className="relative">
            <div className="absolute -left-2 top-0 w-2 h-2 bg-neutral-400/10 rounded-full animate-exhaust" />
            <div className="absolute -left-4 top-1 w-1.5 h-1.5 bg-neutral-500/5 rounded-full animate-exhaust delay-100" />
          </div>

          <div className="relative">
            <Truck className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transform -scale-x-100 transition-transform group-hover:scale-110" />
            <div className="absolute -right-12 top-1/2 -translate-y-1/2 w-16 h-6 bg-gradient-to-r from-blue-400/25 to-transparent rounded-full blur-md opacity-40 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-200 rounded-full shadow-[0_0_12px_#60a5fa] group-hover:scale-125 transition-transform" />
          </div>
        </div>
      </div>

      {/* Brand */}
      <div className="flex items-center shrink-0 relative z-20">
        {logoElement}
      </div>

      {/* Nav Link */}
      <nav className="flex items-center shrink-0 gap-2 relative z-20">
        <div className="absolute bottom-full right-full mb-1 translate-x-1/2 translate-y-1/2 pointer-events-none">
          <Package className="w-4 h-4 text-emerald-400 animate-package-pop" />
        </div>

        <AnimatedNavLink href="#">
          Tracker
        </AnimatedNavLink>

        <div className="p-1 px-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1 shadow-inner">
          Live <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
        </div>
      </nav>
    </header>
  );
}
