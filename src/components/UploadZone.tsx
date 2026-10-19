'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  UploadCloud, 
  FolderOpen, 
  FileSpreadsheet, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Sliders, 
  Code2, 
  Layers,
  Terminal,
  FileCode,
  Zap,
  Award,
  ChevronRight,
  Database,
  Globe,
  Loader2
} from 'lucide-react';

interface UploadZoneProps {
  onFileUpload: (file: File, pdfFiles?: File[]) => void;
  onGoogleSheetSubmit?: (url: string) => Promise<boolean | void>;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileUpload, onGoogleSheetSubmit }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeAperture, setActiveAperture] = useState<number | null>(null);
  const [showSheetsInput, setShowSheetsInput] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [isFetchingDemo, setIsFetchingDemo] = useState(false);

  const handleLoadDemo = async () => {
    try {
      setIsFetchingDemo(true);
      const resp = await fetch('/demo_hackathon_registrations.csv');
      if (!resp.ok) throw new Error('Demo CSV could not be fetched');
      const text = await resp.text();
      const demoFile = new File([text], 'demo_hackathon_registrations.csv', { type: 'text/csv' });
      onFileUpload(demoFile);
    } catch (err: any) {
      alert('Failed to load demo dataset: ' + err.message);
    } finally {
      setIsFetchingDemo(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const apertures = [
    { id: 1, label: 'Full Stack', x: 100, y: 0, icon: Code2, desc: 'TypeScript, React, Node, REST' },
    { id: 2, label: 'AI & Data', x: 50, y: 87, icon: Cpu, desc: 'PyTorch, LangChain, RAG, BigQuery' },
    { id: 3, label: 'Accolades', x: -50, y: 87, icon: Award, desc: 'SIH, ETHIndia, MLH Winners' },
    { id: 4, label: 'GitHub Velocity', x: -100, y: 0, icon: Terminal, desc: '5,000 req/hr Live Code Inspection' },
    { id: 5, label: 'Zero-DB Privacy', x: -50, y: -87, icon: ShieldCheck, desc: 'Volatile In-Memory Garbage Collection' },
    { id: 6, label: 'Synergy HUD', x: 50, y: -87, icon: Layers, desc: 'Diminishing Returns Normalization' },
  ];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      const spreadsheetFile = files.find(
        (f) =>
          f.name.endsWith('.csv') ||
          f.name.endsWith('.tsv') ||
          f.name.endsWith('.json') ||
          f.name.endsWith('.xlsx') ||
          f.name.endsWith('.xls')
      );
      const pdfFiles = files.filter((f) => f.name.endsWith('.pdf'));

      if (spreadsheetFile) {
        onFileUpload(spreadsheetFile, pdfFiles);
      } else {
        alert('Please drop an Excel (.xlsx, .xls), CSV, or JSON registration file.');
      }
    }
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      const candidateFile =
        fileList.find(
          (f) =>
            /register|team|applicant|submission/i.test(f.name) &&
            (f.name.endsWith('.csv') ||
              f.name.endsWith('.json') ||
              f.name.endsWith('.xlsx') ||
              f.name.endsWith('.xls'))
        ) ||
        fileList.find(
          (f) =>
            f.name.endsWith('.csv') ||
            f.name.endsWith('.tsv') ||
            f.name.endsWith('.json') ||
            f.name.endsWith('.xlsx') ||
            f.name.endsWith('.xls')
        );

      const pdfFiles = fileList.filter((f) => f.name.endsWith('.pdf'));

      if (candidateFile) {
        onFileUpload(candidateFile, pdfFiles);
      } else {
        alert('No Excel, CSV, or JSON spreadsheet found in the selected folder.');
      }
    }
  };

  const handleImportSheet = async () => {
    if (!sheetUrl.trim()) return;
    setIsFetchingSheet(true);
    setSheetError(null);

    try {
      if (onGoogleSheetSubmit) {
        await onGoogleSheetSubmit(sheetUrl.trim());
      }
      setShowSheetsInput(false);
      setSheetUrl('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import Google Sheet';
      setSheetError(msg);
    } finally {
      setIsFetchingSheet(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-2 px-2 sm:px-4 space-y-6 font-mono">
      {/* Hidden file inputs for File and Folder */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onFileUpload(e.target.files[0]);
          }
        }}
        accept=".csv,.tsv,.json,.xlsx,.xls"
        className="hidden"
      />

      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderSelect}
        // @ts-expect-error webkitdirectory is standard across modern browsers
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
      />

      {/* Main Single-Screen Unified Hero & Upload Terminal (Above the fold) */}
      <div className="relative overflow-hidden bg-zinc-950/90 border border-cyan-950/80 rounded-3xl p-6 sm:p-8 md:p-10 shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        {/* Ambient cyber light orbs */}
        <div className="absolute top-0 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-float-orb" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Branding, Telemetry, and Instant Select Options */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>· SC.00 // TRACK 3 — AUTONOMOUS RECRUITMENT ENGINE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-100 tracking-tight leading-none uppercase">
              RECRUITMENT <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 neon-glow-cyan">
                AUTOMATION
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed max-w-lg">
              Deterministic, explainable candidate ranking platform for hackathons.
              Evaluates GitHub velocity, cross-disciplinary synergy, and verifiable accolades with <strong>$0 API bills</strong> and <strong>zero database retention</strong>.
            </p>

            {/* Direct Upload & Folder Picker Box right above the fold! */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`p-4 sm:p-5 rounded-2xl border-2 border-dashed transition-all bg-black/60 ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01] shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  : 'border-cyan-900/60 hover:border-cyan-500/80 shadow-lg'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <UploadCloud className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-100 uppercase">
                      Select Registration Data
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Drop spreadsheet here or pick from local drive
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Select File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-cyan-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-700 hover:border-cyan-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Select a directory containing your registration data"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Select Folder</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSheetsInput(!showSheetsInput)}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-emerald-700/60 hover:border-emerald-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title="Import cohort from a Google Sheets document link"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Google Sheets</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadDemo}
                    disabled={isFetchingDemo}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-amber-500/50 hover:border-amber-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50"
                    title="Instantly load the verified 23-team hackathon demo dataset"
                  >
                    {isFetchingDemo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>Demo (23 Teams)</span>
                  </button>
                </div>
              </div>

              {/* Google Sheets Live Import Bar */}
              {showSheetsInput && (
                <div className="mt-3 p-3.5 bg-black/80 border border-emerald-500/40 rounded-xl space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      Import Live Google Sheet URL
                    </span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      Must be set to &apos;Anyone with the link can view&apos;
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0X.../edit#gid=0"
                      className="w-full sm:flex-1 px-3 py-2 bg-zinc-900/90 border border-zinc-700 focus:border-emerald-400 rounded-lg text-xs text-zinc-100 font-mono outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleImportSheet}
                      disabled={isFetchingSheet || !sheetUrl.trim()}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      {isFetchingSheet ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Importing...</span>
                        </>
                      ) : (
                        <span>Fetch & Ingest</span>
                      )}
                    </button>
                  </div>

                  {sheetError && (
                    <p className="text-[11px] text-amber-400 font-sans">{sheetError}</p>
                  )}
                </div>
              )}

              <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 uppercase">
                <span>Google Sheets · Excel (.xlsx, .xls) · CSV · JSON</span>
                <span className="text-cyan-500">Volatile RAM Ingestion</span>
              </div>
            </div>

            {/* Telemetry specs grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="bg-black/60 border border-zinc-800/80 p-2 rounded-xl">
                <span className="text-zinc-500 block text-[9px] uppercase">STORAGE</span>
                <span className="text-cyan-400 font-bold text-xs">0 DB Retention</span>
              </div>
              <div className="bg-black/60 border border-zinc-800/80 p-2 rounded-xl">
                <span className="text-zinc-500 block text-[9px] uppercase">COST</span>
                <span className="text-emerald-400 font-bold text-xs">$0 API Bills</span>
              </div>
              <div className="bg-black/60 border border-zinc-800/80 p-2 rounded-xl">
                <span className="text-zinc-500 block text-[9px] uppercase">GITHUB PAT</span>
                <span className="text-blue-400 font-bold text-xs">5,000 Req/Hr</span>
              </div>
              <div className="bg-black/60 border border-zinc-800/80 p-2 rounded-xl">
                <span className="text-zinc-500 block text-[9px] uppercase">TAXONOMY</span>
                <span className="text-indigo-400 font-bold text-xs">7 Disciplines</span>
              </div>
            </div>

            <div className="pt-1">
              <Link
                href="/formulas"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/80 hover:border-cyan-400 text-cyan-300 text-xs font-bold transition-all shadow-xs"
                title="Configure Scoring Formulae & Custom Math Engine"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Configure Multipliers & Formulae Studio (/formulas)</span>
                <span className="text-[10px] text-cyan-400 font-mono">→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Rotating Film Reel / Arc Reactor Sci-Fi Lens HUD */}
          {/* CRITICAL: Counter-rotation applied so all emojis/icons always preserve their upright straight nature! */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-88 md:h-88 flex items-center justify-center">
              
              {/* Outer Mechanical Tick Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-zinc-800/90 border-dashed animate-spin-slow pointer-events-none" />
              <div className="absolute inset-3 rounded-full border border-cyan-500/20 pointer-events-none" />

              {/* Glowing Film Reel Body with Circular Apertures */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-4 border-zinc-700/80 shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center">
                
                {/* Rotating Aperture Ring (Clockwise) */}
                <div className="absolute inset-0 rounded-full animate-spin-slow pointer-events-none">
                  {apertures.map((ap) => {
                    const Icon = ap.icon;

                    return (
                      <div
                        key={ap.id}
                        style={{
                          transform: `translate(${ap.x}px, ${ap.y}px)`,
                        }}
                        onMouseEnter={() => setActiveAperture(ap.id)}
                        onMouseLeave={() => setActiveAperture(null)}
                        className="absolute top-1/2 left-1/2 -mt-6 -ml-6 w-12 h-12 rounded-full bg-zinc-900 border-2 border-zinc-700 hover:border-cyan-400 hover:bg-cyan-950/60 transition-all flex items-center justify-center shadow-md cursor-pointer group pointer-events-auto"
                        title={`${ap.label}: ${ap.desc}`}
                      >
                        {/* 
                          COUNTER-ROTATION WRAPPER:
                          Because the parent rotates clockwise at 35s, this container rotates counter-clockwise
                          at the exact same 35s speed, so the icon inside ALWAYS preserves its straight/upright nature!
                        */}
                        <div className="animate-spin-counter flex items-center justify-center w-full h-full">
                          <Icon className="w-5 h-5 text-zinc-300 group-hover:text-cyan-300 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Center Arc Reactor / Lens Core */}
                <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-zinc-950 to-black border-2 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.5),inset_0_0_15px_rgba(6,182,212,0.4)] flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                  <div className="w-7 h-7 rounded-full bg-cyan-400/20 border border-cyan-300 flex items-center justify-center shadow-[0_0_15px_#22d3ee] animate-pulse">
                    <Zap className="w-3.5 h-3.5 text-cyan-200" />
                  </div>
                  <span className="text-[9px] font-mono font-black text-cyan-300 uppercase tracking-tighter mt-1">
                    CORE 3.0
                  </span>
                  <span className="text-[7px] font-mono text-zinc-500 uppercase">
                    DETERMINISTIC
                  </span>
                </div>

                {/* Rotary Bevel Highlights */}
                <div className="absolute inset-8 rounded-full border border-zinc-800/80 pointer-events-none" />
                <div className="absolute inset-16 rounded-full border border-zinc-800/60 pointer-events-none" />
              </div>

              {/* Active Aperture Hover Indicator Badge */}
              {activeAperture && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/90 border border-cyan-500/60 px-3.5 py-1.5 rounded-xl text-center backdrop-blur-md shadow-xl z-20 whitespace-nowrap">
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

      {/* Underneath: 3-Pillar Architecture Specs Strip (Compact) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 bg-zinc-950/80 border border-cyan-950/80 rounded-2xl space-y-1 backdrop-blur-md">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="uppercase tracking-wider text-[11px]">GitHub Code Velocity</span>
          </div>
          <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
            Evaluates commit frequency, original vs fork ratios, and language breadth using public APIs with token rotation.
          </p>
        </div>

        <div className="p-3.5 bg-zinc-950/80 border border-cyan-950/80 rounded-2xl space-y-1 backdrop-blur-md">
          <div className="flex items-center gap-2 text-blue-400 font-bold">
            <FileCode className="w-4 h-4 text-blue-400" />
            <span className="uppercase tracking-wider text-[11px]">In-Memory Resume NLP</span>
          </div>
          <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
            Extracts skills, hackathon placement keywords (SIH, ETHIndia, 1st place), and project portfolios directly in volatile RAM.
          </p>
        </div>

        <div className="p-3.5 bg-zinc-950/80 border border-cyan-950/80 rounded-2xl space-y-1 backdrop-blur-md">
          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="uppercase tracking-wider text-[11px]">Fair Team Normalization</span>
          </div>
          <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
            Diminishing returns and max-skill mathematical models prevent large teams from unfairly dominating solo hackers.
          </p>
        </div>
      </div>
    </div>
  );
};
