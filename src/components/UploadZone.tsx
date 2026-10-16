'use client';

import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, Shield, Cpu, Sliders, CheckCircle } from 'lucide-react';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileUpload,
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
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      {/* Hero Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Track 3 – Automated & Transparent Team Recruitment
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Shortlist Top Teams with Explainable, Zero-Cost Scoring
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Drop in your Google Forms CSV or JSON registrations. Automatically detect skills,
          normalize team sizes, apply anti-cheat heuristics, and tune selection weights in real-time.
        </p>
      </div>

      {/* Drop Zone Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer bg-white ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
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
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mx-auto mb-4 shadow-xs">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Drag and drop your Registration CSV or JSON
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Compatible with Google Forms, Typeform, Devpost, or custom spreadsheets
        </p>

        <div className="inline-flex flex-col items-center justify-center gap-3">
          <span className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors">
            Browse & Upload Spreadsheet
          </span>
          <a
            href="/demo_hackathon_registrations.csv"
            download="demo_hackathon_registrations.csv"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Need a sample file? Download Demo CSV (Google Forms format)
          </a>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1 font-bold">
            $0
          </div>
          <div className="font-bold text-slate-800">100% Zero-Cost Solution</div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Runs client-side in your browser using fast regex taxonomy parsing and free public APIs. Zero token costs or server fees.
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="font-bold text-slate-800">Unopinionated & Tunable</div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Adjust weights, eligibility gates, and team-size normalization curves on the fly with instant live re-ranking.
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
            <Shield className="w-4 h-4" />
          </div>
          <div className="font-bold text-slate-800">Explainable & Auditable</div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Every shortlisted or rejected team has an itemized breakdown. Anti-cheat detects fork-padding and duplicate entries.
          </p>
        </div>
      </div>
    </div>
  );
};
