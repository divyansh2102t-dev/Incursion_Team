'use client';

import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Sliders, 
  Play, 
  Code2, 
  Layers 
} from 'lucide-react';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  onLoadDemo?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileUpload,
  onLoadDemo,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Drop Zone Box with Cyberpunk styling */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer bg-zinc-950/80 backdrop-blur-xl ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01] shadow-[0_0_30px_rgba(6,182,212,0.3)]'
            : 'border-cyan-900/40 hover:border-cyan-500/60 hover:bg-zinc-900/60 shadow-xl'
        }`}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.csv,.tsv,.json';
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files[0]) onFileUpload(files[0]);
          };
          input.click();
        }}
      >
        {/* Subtle cyber background grid inside */}
        <div className="absolute inset-0 bg-cyber-grid-dense opacity-20 pointer-events-none" />

        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <UploadCloud className="w-8 h-8 animate-pulse" />
          </div>

          <h3 className="text-lg font-bold text-zinc-100 mb-1 tracking-tight">
            Drag & Drop Candidate Spreadsheet
          </h3>
          <p className="text-xs text-zinc-400 mb-6 max-w-md mx-auto">
            Directly parses CSV or JSON from Google Forms, Typeform, Devpost, or custom hackathon registration portals.
          </p>

          <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            >
              Browse Local Files
            </button>

            {onLoadDemo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadDemo();
                }}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-cyan-300 font-bold text-xs uppercase tracking-wider rounded-lg border border-cyan-800/50 hover:border-cyan-500 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                <span>Instant Load Demo Cohort</span>
              </button>
            )}
          </div>

          <div className="mt-4">
            <a
              href="/demo_hackathon_registrations.csv"
              download="demo_hackathon_registrations.csv"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-cyan-400/80 hover:text-cyan-300 underline font-mono tracking-tight"
            >
              ↓ Download Sample Registration CSV (20+ Teams with edge cases)
            </a>
          </div>
        </div>
      </div>

      {/* Cyber Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
        <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-bold text-sm">$0.00</span>
            <span className="text-[10px] text-zinc-500">CLIENT-SIDE</span>
          </div>
          <div className="font-bold text-zinc-200">Zero-Cost Architecture</div>
          <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
            Eliminates paid LLMs using fast regex taxonomy parsing and free public APIs. $0 monthly bill.
          </p>
        </div>

        <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-cyan-400 font-bold text-sm">0 KB STORED</span>
            <span className="text-[10px] text-zinc-500">VOLATILE RAM</span>
          </div>
          <div className="font-bold text-zinc-200">Zero Database Privacy</div>
          <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
            Candidate resumes and profiles exist solely in volatile browser RAM and are immediately discarded.
          </p>
        </div>

        <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-blue-400 font-bold text-sm">5,000 REQ/HR</span>
            <span className="text-[10px] text-zinc-500">PAT ENCRYPTION</span>
          </div>
          <div className="font-bold text-zinc-200">Multi-Token GitHub PAT</div>
          <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
            Store and rotate multiple organizer tokens in encrypted local storage with 100% deterministic fallback.
          </p>
        </div>
      </div>
    </div>
  );
};
