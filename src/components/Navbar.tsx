'use client';

import React, { useRef } from 'react';
import {
  Upload,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  Columns,
  Activity,
  ArrowRightLeft,
  FileSpreadsheet,
  FileCode,
  Code2,
} from 'lucide-react';
import { SelectionConfig } from '@/types';

interface NavbarProps {
  config: SelectionConfig;
  onUpdateConfig: (updated: SelectionConfig) => void;
  onFileUpload: (file: File) => void;
  onOpenMapper: () => void;
  onOpenSensitivity: () => void;
  onOpenCompare: () => void;
  onOpenGitHubSync: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  hasData: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  onUpdateConfig,
  onFileUpload,
  onOpenMapper,
  onOpenSensitivity,
  onOpenCompare,
  onOpenGitHubSync,
  onExportCSV,
  onExportJSON,
  hasData,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Track Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-xs tracking-tighter">
            IN
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                Incursion Recruitment Engine
              </h1>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 uppercase">
                Track 3
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Reusable, tunable & explainable hackathon team shortlisting (100% Zero-Cost)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.tsv,.json"
            className="hidden"
          />

          {/* Download Demo File Button */}
          <a
            href="/demo_hackathon_registrations.csv"
            download="demo_hackathon_registrations.csv"
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
            title="Download Sample Registration CSV File to test uploading"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Demo CSV</span>
          </a>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV / JSON</span>
          </button>

          {hasData && (
            <>
              {/* GitHub Sync & Quota */}
              <button
                onClick={onOpenGitHubSync}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5"
                title="Manage GitHub Tokens, Rate Limits & Live Enrichment"
              >
                <Code2 className="w-3.5 h-3.5 text-blue-600" />
                <span>GitHub PAT & Sync</span>
              </button>

              {/* Column Mapper */}
              <button
                onClick={onOpenMapper}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                title="Inspect / Edit Column Mappings"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Mapper</span>
              </button>

              {/* Head-to-Head Compare */}
              <button
                onClick={onOpenCompare}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                title="Pairwise Head-to-Head Comparison"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Compare</span>
              </button>

              {/* Sensitivity Analysis */}
              <button
                onClick={onOpenSensitivity}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                title="Sensitivity & Shortlist Robustness"
              >
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>Sensitivity</span>
              </button>

              {/* Blind Review Mode Toggle */}
              <button
                onClick={() => onUpdateConfig({ ...config, anonymizeMode: !config.anonymizeMode })}
                className={`px-3 py-1.5 rounded-lg font-medium border transition-colors flex items-center gap-1.5 ${
                  config.anonymizeMode
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
                title="Anonymize candidate names, emails, and personal identifiers to reduce bias"
              >
                {config.anonymizeMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>Blind Mode {config.anonymizeMode ? 'ON' : 'OFF'}</span>
              </button>

              {/* Export Dropdown / Buttons */}
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <button
                  onClick={onExportCSV}
                  className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-700 font-medium flex items-center gap-1 border-r border-slate-200"
                  title="Export Ranked Shortlist as CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={onExportJSON}
                  className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-700 font-medium flex items-center gap-1"
                  title="Export Audit Bundle with Exact Config & Teams as JSON"
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>JSON Bundle</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
