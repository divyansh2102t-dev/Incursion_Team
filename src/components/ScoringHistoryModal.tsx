'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ScoringHistoryEntry } from '@/types';
import {
  X,
  History,
  Trash2,
  RotateCcw,
  Download,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
  Save,
  Search,
  Sparkles,
  Award,
  Layers,
  AlertTriangle,
  Calendar,
  Users,
} from 'lucide-react';
import { triggerDownload } from '@/utils/exportUtils';

interface ScoringHistoryModalProps {
  onClose: () => void;
  hasActiveCohort: boolean;
}

export const ScoringHistoryModal: React.FC<ScoringHistoryModalProps> = ({
  onClose,
  hasActiveCohort,
}) => {
  const {
    scoringHistory,
    saveScoringSnapshot,
    renameHistoryEntry,
    deleteHistoryEntry,
    clearAllHistory,
    restoreHistoryEntry,
  } = useApp();

  const [newRunName, setNewRunName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasActiveCohort) {
      showNotice('Please load or evaluate a cohort first to save a scoring snapshot.');
      return;
    }
    const saved = saveScoringSnapshot(newRunName);
    if (saved) {
      showNotice(`Saved scoring snapshot: "${saved.name}"`);
      setNewRunName('');
    }
  };

  const handleStartRename = (entry: ScoringHistoryEntry) => {
    setEditingId(entry.id);
    setEditingName(entry.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      renameHistoryEntry(id, editingName.trim());
      showNotice('Scoring run renamed successfully.');
    }
    setEditingId(null);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from history?`)) {
      deleteHistoryEntry(id);
      showNotice(`Deleted "${name}"`);
    }
  };

  const handleClearAll = () => {
    if (
      confirm(
        'Are you sure you want to delete ALL scoring history? This cannot be undone.'
      )
    ) {
      clearAllHistory();
      showNotice('All scoring history cleared.');
    }
  };

  const handleRestore = (id: string, name: string) => {
    const success = restoreHistoryEntry(id);
    if (success) {
      showNotice(`Restored scoring configuration from "${name}"`);
      setTimeout(() => onClose(), 600);
    }
  };

  const handleExportJSON = (entry: ScoringHistoryEntry) => {
    const json = JSON.stringify(entry, null, 2);
    const filename = `scoring_run_${entry.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')}_${entry.timestamp.split('T')[0]}.json`;
    triggerDownload(filename, json, 'application/json');
    showNotice(`Exported ${filename}`);
  };

  // Filtered runs
  const filteredHistory = scoringHistory.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.configSnapshot.presetName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden font-mono text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-950/80 bg-black/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-cyan-300 tracking-tight uppercase">
                  Scoring Run History & Audit Vault
                </h2>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
                  {scoringHistory.length} RUNS
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans">
                Review, restore, export, or manage all historical candidate rankings & configs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {scoringHistory.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-2.5 py-1.5 bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 text-xs rounded-lg border border-rose-800/80 transition-colors flex items-center gap-1 cursor-pointer"
                title="Delete all saved scoring history"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Notification */}
        {statusNotice && (
          <div className="bg-cyan-950/90 border-b border-cyan-500 text-cyan-300 text-xs px-4 py-2 flex items-center gap-2 font-mono">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Save Current Run Bar */}
          {hasActiveCohort && (
            <div className="bg-black/60 border border-cyan-900/60 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Snapshot & Name Current Scoring Run</span>
                </span>
                <span className="text-[10px] text-zinc-400">Save active weights & ranks</span>
              </div>

              <form onSubmit={handleSaveCurrent} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter a custom name (e.g. Round 1 Final Shortlist, High-GitHub Bias)..."
                  value={newRunName}
                  onChange={(e) => setNewRunName(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-cyan-400 px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-200 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Run</span>
                </button>
              </form>
            </div>
          )}

          {/* Search bar when history has multiple items */}
          {scoringHistory.length > 1 && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search history by run name or philosophy preset..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-black/50 border border-zinc-800 focus:border-cyan-500/60 rounded-lg text-xs font-mono text-zinc-200 outline-none"
              />
            </div>
          )}

          {/* History List */}
          {scoringHistory.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
                <History className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-300">No Scoring Runs Saved Yet</p>
                <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans">
                  Whenever you evaluate a cohort, adjust weights, or test cutoffs, use the snapshot bar above to preserve an immutable audit trail of your shortlist decisions.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((run) => {
                const isEditing = editingId === run.id;
                const isExpanded = expandedRunId === run.id;

                return (
                  <div
                    key={run.id}
                    className="bg-black/50 border border-zinc-800 hover:border-cyan-900/60 rounded-xl p-4 transition-all space-y-3 group"
                  >
                    {/* Top Row: Name (Editable) + Timestamp + Delete Button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 pb-2.5">
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1 max-w-md">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(run.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              autoFocus
                              className="w-full bg-zinc-900 border border-cyan-400 text-cyan-300 text-xs px-2 py-1 rounded outline-none font-bold"
                            />
                            <button
                              onClick={() => handleSaveRename(run.id)}
                              className="p-1 bg-cyan-500 text-black rounded hover:bg-cyan-400 cursor-pointer"
                              title="Confirm name change"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 bg-zinc-800 text-zinc-400 rounded hover:text-zinc-200 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/edit">
                            <h3 className="font-bold text-sm text-cyan-300 tracking-tight">
                              {run.name}
                            </h3>
                            <button
                              onClick={() => handleStartRename(run)}
                              className="opacity-0 group-hover/edit:opacity-100 p-1 hover:bg-zinc-800 text-zinc-500 hover:text-cyan-400 rounded transition-opacity cursor-pointer"
                              title="Rename this scoring run"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <span className="text-[10px] bg-cyan-950/80 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded font-mono font-bold">
                          {run.configSnapshot.presetName}
                        </span>
                      </div>

                      {/* Right: Timestamp & Individual Delete Button */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-sans">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          <span>{new Date(run.timestamp).toLocaleString()}</span>
                        </span>

                        {/* Individual Delete Button */}
                        <button
                          onClick={() => handleDeleteItem(run.id, run.name)}
                          className="p-1.5 bg-zinc-900 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-400 rounded-lg border border-zinc-800 hover:border-rose-800/80 transition-colors cursor-pointer"
                          title="Delete this scoring run from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stats Metrics Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
                      <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-900">
                        <span className="text-zinc-400 block text-[9px] uppercase">COHORT SIZE:</span>
                        <span className="font-bold text-zinc-200">{run.totalTeams} Teams</span>
                      </div>
                      <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-900">
                        <span className="text-zinc-400 block text-[9px] uppercase">SHORTLISTED:</span>
                        <span className="font-bold text-cyan-400">
                          {run.shortlistedCount} / {run.shortlistTarget} target
                        </span>
                      </div>
                      <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-900">
                        <span className="text-zinc-400 block text-[9px] uppercase">AVERAGE SCORE:</span>
                        <span className="font-bold text-indigo-400">{run.averageScore} pts</span>
                      </div>
                      <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-900">
                        <span className="text-zinc-400 block text-[9px] uppercase">TOP 1 RANK:</span>
                        <span className="font-bold text-amber-400 truncate block">
                          {run.topTeamsSnapshot[0]?.teamName || 'N/A'} ({run.highestScore} pts)
                        </span>
                      </div>
                      <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-900">
                        <span className="text-zinc-400 block text-[9px] uppercase">DISQUALIFIED:</span>
                        <span className="font-bold text-rose-400">{run.disqualifiedCount} Teams</span>
                      </div>
                    </div>

                    {/* Weights Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400 pt-1">
                      <span className="text-zinc-400 font-bold">Weights:</span>
                      <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-cyan-400">
                        💻 Tech {run.configSnapshot.weights.technicalDepth}%
                      </span>
                      <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-indigo-400">
                        🏆 Exp {run.configSnapshot.weights.projectExperience}%
                      </span>
                      <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-purple-400">
                        🧩 Comp {run.configSnapshot.weights.skillComplementarity}%
                      </span>
                      <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-emerald-400">
                        📋 Data {run.configSnapshot.weights.dataCompleteness}%
                      </span>
                      <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-300">
                        ⚖️ {run.configSnapshot.aggregationStrategy}
                      </span>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900 text-xs">
                      {/* Expand preview */}
                      <button
                        onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Hide Top Shortlisted Teams</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>View Top Shortlisted Teams ({run.topTeamsSnapshot.length})</span>
                          </>
                        )}
                      </button>

                      {/* Restore & Export Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExportJSON(run)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                          title="Export historical run as JSON"
                        >
                          <Download className="w-3 h-3 text-cyan-400" />
                          <span>Export JSON</span>
                        </button>

                        <button
                          onClick={() => handleRestore(run.id, run.name)}
                          className="px-3 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-bold rounded-lg border border-cyan-500/40 hover:border-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer text-[11px] shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                          title="Load this run's configuration and rankings onto the live dashboard"
                        >
                          <RotateCcw className="w-3 h-3 text-cyan-400" />
                          <span>Restore Run</span>
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Top Teams Table */}
                    {isExpanded && (
                      <div className="bg-black/80 rounded-xl border border-zinc-800 p-3 overflow-x-auto mt-2">
                        <div className="text-[10px] text-zinc-400 font-bold uppercase mb-2">
                          Top Shortlisted Teams Snapshot:
                        </div>
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="border-b border-zinc-800 text-zinc-400">
                              <th className="py-1 px-2">Rank</th>
                              <th className="py-1 px-2">Team Name</th>
                              <th className="py-1 px-2">Size</th>
                              <th className="py-1 px-2">Final Score</th>
                              <th className="py-1 px-2">Tech</th>
                              <th className="py-1 px-2">Exp</th>
                              <th className="py-1 px-2">Comp</th>
                              <th className="py-1 px-2">Data</th>
                              <th className="py-1 px-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {run.topTeamsSnapshot.map((team) => (
                              <tr
                                key={team.rank + team.teamName}
                                className="border-b border-zinc-900/60 hover:bg-zinc-900/40 font-mono"
                              >
                                <td className="py-1 px-2 font-bold text-cyan-400">#{team.rank}</td>
                                <td className="py-1 px-2 font-semibold text-zinc-200">{team.teamName}</td>
                                <td className="py-1 px-2 text-zinc-400">{team.teamSize}</td>
                                <td className="py-1 px-2 font-bold text-indigo-400">{team.finalScore}</td>
                                <td className="py-1 px-2 text-zinc-400">{team.scoreBreakdown.technicalDepth}</td>
                                <td className="py-1 px-2 text-zinc-400">{team.scoreBreakdown.projectExperience}</td>
                                <td className="py-1 px-2 text-zinc-400">{team.scoreBreakdown.skillComplementarity}</td>
                                <td className="py-1 px-2 text-zinc-400">{team.scoreBreakdown.dataCompleteness}</td>
                                <td className="py-1 px-2">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      team.status === 'shortlisted' || team.status === 'pinned'
                                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                        : team.status === 'rejected'
                                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                        : 'bg-zinc-900 text-zinc-400'
                                    }`}
                                  >
                                    {team.status.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
