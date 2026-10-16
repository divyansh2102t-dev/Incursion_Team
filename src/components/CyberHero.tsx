'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Upload, 
  Sliders, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  Zap, 
  Code2, 
  Award,
  Layers,
  ChevronDown
} from 'lucide-react';

interface CyberHeroProps {
  onLoadDemo: () => void;
  onTriggerUpload: () => void;
  onScrollToDashboard: () => void;
  hasData: boolean;
  totalTeamsCount: number;
}

export const CyberHero: React.FC<CyberHeroProps> = ({
  onLoadDemo,
  onTriggerUpload,
  onScrollToDashboard,
  hasData,
  totalTeamsCount,
}) => {
  const [activeAperture, setActiveAperture] = useState<number | null>(null);

  const apertures = [
    { id: 1, label: 'Full Stack', angle: 0, icon: Code2, desc: 'TypeScript, React, Node, GraphQL' },
    { id: 2, label: 'AI & Data', angle: 60, icon: Cpu, desc: 'PyTorch, LangChain, RAG, BigQuery' },
    { id: 3, label: 'Accolades', angle: 120, icon: Award, desc: 'SIH, ETHIndia, MLH Winners' },
    { id: 4, label: 'GitHub Git', angle: 180, icon: Terminal, desc: '5,000 req/hr Live Code Velocity' },
    { id: 5, label: 'Zero-DB RAM', angle: 240, icon: ShieldCheck, desc: 'Volatile In-Memory Garbage Collection' },
    { id: 6, label: 'Synergy HUD', angle: 300, icon: Layers, desc: 'Diminishing Returns Normalization' },
  ];

  return (
    <div className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-16 border-b border-cyan-950/40">
      {/* Background cyber ambient gradients & light ribbon */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-float-orb" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Sci-Fi Top Telemetry Trackers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-cyan-500/80">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="tracking-widest uppercase">· SC.00 — INCURSION ENGINE // TRACK 3</span>
        </div>
        <div className="flex items-center gap-2 bg-black/60 border border-cyan-900/40 px-3 py-1 rounded-full backdrop-blur-md">
          <span className="text-zinc-500">NOW SHOWING —</span>
          <span className="text-zinc-200 font-bold tracking-wider">HERO RECRUITMENT</span>
          <span className="text-cyan-400">00:00:01</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Big Distressed Industrial Cyber Typography */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95]">
              <span className="block distressed-title">SHAPE THE</span>
              <span className="block distressed-title">FUTURE OF</span>
              <span className="block distressed-blue text-5xl sm:text-7xl md:text-8xl mt-1">
                HACKATHONS
              </span>
            </h1>
          </div>

          {/* Accent rule */}
          <div className="w-24 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent" />

          <p className="text-sm sm:text-base text-zinc-400 max-w-xl font-normal leading-relaxed">
            An autonomous, deterministic, and 100% zero-cost candidate ranking engine. Evaluating
            live GitHub code velocity, multi-disciplinary team synergy, and verifiable hackathon accolades with
            zero database retention.
          </p>

          {/* Interactive CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onLoadDemo}
              className="px-6 py-3 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs uppercase tracking-wider border border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Explore Demo Cohort</span>
            </button>

            <button
              onClick={onTriggerUpload}
              className="px-5 py-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-medium text-xs uppercase tracking-wider border border-zinc-700/60 hover:border-zinc-500 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span>Upload CSV / JSON</span>
            </button>

            <Link
              href="/formulas"
              className="px-5 py-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-medium text-xs uppercase tracking-wider border border-zinc-700/60 hover:border-zinc-500 transition-all flex items-center gap-2"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Formula Studio</span>
            </Link>

            {hasData && (
              <button
                onClick={onScrollToDashboard}
                className="px-4 py-3 rounded-full bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 font-mono text-xs border border-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Jump to Leaderboard ({totalTeamsCount})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sci-Fi Spec Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono text-[11px]">
            <div className="bg-black/40 border border-zinc-800/80 p-2.5 rounded-lg">
              <span className="text-zinc-500 block">COST</span>
              <span className="text-emerald-400 font-bold">$0 API Bills</span>
            </div>
            <div className="bg-black/40 border border-zinc-800/80 p-2.5 rounded-lg">
              <span className="text-zinc-500 block">STORAGE</span>
              <span className="text-cyan-400 font-bold">0 DB Retention</span>
            </div>
            <div className="bg-black/40 border border-zinc-800/80 p-2.5 rounded-lg">
              <span className="text-zinc-500 block">PAT QUOTA</span>
              <span className="text-blue-400 font-bold">5,000 Req/Hr</span>
            </div>
            <div className="bg-black/40 border border-zinc-800/80 p-2.5 rounded-lg">
              <span className="text-zinc-500 block">TAXONOMY</span>
              <span className="text-indigo-400 font-bold">7 Disciplines</span>
            </div>
          </div>
        </div>

        {/* Right Column: Rotating Film Reel / Arc Reactor Sci-Fi Lens HUD */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
            
            {/* Outer Mechanical Tick Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-zinc-800/90 border-dashed animate-spin-slow pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-cyan-500/20 pointer-events-none" />

            {/* Glowing Film Reel Body with Circular Apertures */}
            <div className="relative w-72 h-72 sm:w-84 sm:h-84 rounded-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-4 border-zinc-700/80 shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center">
              
              {/* Rotating Aperture Holder */}
              <div className="absolute inset-0 rounded-full animate-spin-slow">
                {apertures.map((ap) => {
                  const rad = (ap.angle * Math.PI) / 180;
                  // Distance from center
                  const r = 110; // px
                  const x = Math.cos(rad) * r;
                  const y = Math.sin(rad) * r;
                  const Icon = ap.icon;

                  return (
                    <div
                      key={ap.id}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                      onMouseEnter={() => setActiveAperture(ap.id)}
                      onMouseLeave={() => setActiveAperture(null)}
                      className="absolute top-1/2 left-1/2 -mt-7 -ml-7 w-14 h-14 rounded-full bg-zinc-900 border-2 border-zinc-700 hover:border-cyan-400 hover:bg-cyan-950/60 transition-all flex items-center justify-center shadow-md cursor-pointer group"
                      title={`${ap.label}: ${ap.desc}`}
                    >
                      <Icon className="w-5 h-5 text-zinc-400 group-hover:text-cyan-300 transition-colors" />
                    </div>
                  );
                })}
              </div>

              {/* Center Arc Reactor / Lens Core */}
              <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-zinc-950 to-black border-2 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.5),inset_0_0_15px_rgba(6,182,212,0.4)] flex flex-col items-center justify-center p-2 text-center">
                {/* Center glowing light bulb */}
                <div className="w-7 h-7 rounded-full bg-cyan-400/20 border border-cyan-300 flex items-center justify-center shadow-[0_0_15px_#22d3ee] animate-pulse">
                  <Zap className="w-3.5 h-3.5 text-cyan-200" />
                </div>
                <span className="text-[9px] font-mono font-black text-cyan-300 uppercase tracking-tighter mt-1">
                  CORE 3.0
                </span>
                <span className="text-[7px] font-mono text-zinc-500">
                  DETERMINISTIC
                </span>
              </div>

              {/* Rotary Bevel Highlights */}
              <div className="absolute inset-8 rounded-full border border-zinc-800/80 pointer-events-none" />
              <div className="absolute inset-16 rounded-full border border-zinc-800/60 pointer-events-none" />
            </div>

            {/* Active Aperture Float Tag */}
            {activeAperture && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/90 border border-cyan-500/50 px-4 py-2 rounded-xl text-center backdrop-blur-md shadow-xl z-20 whitespace-nowrap">
                <span className="text-xs font-bold text-cyan-300 block">
                  {apertures.find((a) => a.id === activeAperture)?.label}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {apertures.find((a) => a.id === activeAperture)?.desc}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
